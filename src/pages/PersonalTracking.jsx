import React, { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../firebase'; // ודא שהנתיב ל-firebase.js נכון
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faUserCircle } from '@fortawesome/free-solid-svg-icons';
import './PersonalTracking.css'; // ייבוא קובץ ה-CSS החדש

function PersonalTracking() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [games, setGames] = useState([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [playerNames, setPlayerNames] = useState([]);
  const [selectedPlayerName, setSelectedPlayerName] = useState('');
  const [totalProfitLoss, setTotalProfitLoss] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        navigate('/');
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const fetchGames = async () => {
      if (user) {
        setLoadingGames(true);
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id'; // קבלת appId
        try {
          // הנתיב תוקן: artifacts/${appId}/users/${user.uid}/cashGames
          const q = query(collection(db, `artifacts/${appId}/users/${user.uid}/cashGames`));
          const querySnapshot = await getDocs(q);
          const fetchedGames = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setGames(fetchedGames);

          const names = new Set();
          fetchedGames.forEach(game => {
            // ודא ש-game.players קיים ושהוא מערך
            if (Array.isArray(game.players)) {
              game.players.forEach(player => {
                names.add(player.name);
              });
            }
          });
          setPlayerNames(Array.from(names));

        } catch (error) {
          console.error('שגיאה באחזור משחקים:', error);
        } finally {
          setLoadingGames(false);
        }
      }
    };

    fetchGames();
  }, [user]);

  useEffect(() => {
    if (selectedPlayerName && games.length > 0) {
      let sum = 0;
      games.forEach(game => {
        const playerInGame = game.players.find(p => p.name === selectedPlayerName);
        if (playerInGame) {
          // ודא ש-buyIn ו-cashOut הם מספרים
          const buyIn = parseFloat(playerInGame.buyIn) || 0;
          const cashOut = parseFloat(playerInGame.cashOut) || 0;
          sum += (cashOut - buyIn);
        }
      });
      setTotalProfitLoss(sum);
    } else {
      setTotalProfitLoss(0);
    }
  }, [selectedPlayerName, games]);

  if (loadingAuth || loadingGames) {
    return (
      <div className="page-container personal-tracking-container">
        <p style={{ textAlign: 'center', color: 'var(--text-color)' }}>טוען נתונים...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page-container personal-tracking-container">
        <p style={{ textAlign: 'center', color: 'var(--text-color)' }}>מפנה לדף הכניסה...</p>
      </div>
    );
  }

  return (
    <div className="page-container personal-tracking-container">
      <h2><FontAwesomeIcon icon={faChartLine} /> מעקב אישי</h2>

      <div className="form-section">
        <label htmlFor="playerNameSelect">בחר את השם שלך:</label>
        <select
          id="playerNameSelect"
          value={selectedPlayerName}
          onChange={(e) => setSelectedPlayerName(e.target.value)}
        >
          <option value="">בחר שם...</option>
          {playerNames.map((name, index) => (
            <option key={index} value={name}>{name}</option>
          ))}
        </select>
      </div>

      {selectedPlayerName && (
        <div className="tracking-results">
          <h3><FontAwesomeIcon icon={faUserCircle} /> סיכום עבור {selectedPlayerName}:</h3>
          <p className={`total-profit-loss ${totalProfitLoss >= 0 ? 'positive' : 'negative'}`}>
            סה"כ רווח/הפסד: {totalProfitLoss.toFixed(2)} ₪
          </p>

          <h4>היסטוריית משחקים:</h4>
          {games.filter(game => game.players.some(p => p.name === selectedPlayerName)).length > 0 ? (
            <ul className="game-history-list">
              {games
                .filter(game => game.players.some(p => p.name === selectedPlayerName))
                .sort((a, b) => {
                  const dateA = a.date && a.date.seconds ? new Date(a.date.seconds * 1000) : new Date(0);
                  const dateB = b.date && b.date.seconds ? new Date(b.date.seconds * 1000) : new Date(0);
                  return dateB - dateA;
                })
                .map(game => {
                  const playerInGame = game.players.find(p => p.name === selectedPlayerName);
                  // ודא ש-playerInGame קיים לפני גישה למאפיינים שלו
                  if (!playerInGame) return null;

                  const buyIn = parseFloat(playerInGame.buyIn) || 0;
                  const cashOut = parseFloat(playerInGame.cashOut) || 0;
                  const gameProfitLoss = cashOut - buyIn;
                  const gameDate = game.date && game.date.seconds ? new Date(game.date.seconds * 1000).toLocaleDateString('he-IL') : 'תאריך לא ידוע';

                  return (
                    <li key={game.id} className="game-item">
                      <div className="game-info">
                        <span>תאריך: {gameDate}</span>
                        <span>יחס צ'יפים: {game.chipsPerShekel || 'לא ידוע'}</span>
                      </div>
                      <div className="player-stats">
                        <span>השקעה: {buyIn.toFixed(2)} ₪</span>
                        <span>יציאה: {cashOut.toFixed(2)} ₪</span>
                        <span className={`profit-loss ${gameProfitLoss >= 0 ? 'positive' : 'negative'}`}>
                          רווח/הפסד: {gameProfitLoss.toFixed(2)} ₪
                        </span>
                      </div>
                    </li>
                  );
                })}
            </ul>
          ) : (
            <p>לא נמצאו משחקים עבור שם השחקן שנבחר.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default PersonalTracking;