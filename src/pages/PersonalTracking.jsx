import React, { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../firebase'; // ודא שהנתיב ל-firebase.js נכון
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faUserCircle, faCoins, faMoneyBillWave, faDollarSign, faHandshake, faCalendarAlt, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import './PersonalTracking.css'; // ייבוא קובץ ה-CSS החדש

function PersonalTracking() {
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null); // מצב לשמירת ה-userId
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [games, setGames] = useState([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [playerNames, setPlayerNames] = useState([]);
  const [selectedPlayerName, setSelectedPlayerName] = useState('');
  const [totalProfitLoss, setTotalProfitLoss] = useState(0);
  const [error, setError] = useState(null); // הגדרת מצב שגיאה
  const navigate = useNavigate();

  // קבלת ה-appId מהמשתנה הגלובלי __app_id
  const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setUserId(currentUser.uid); // שמור את ה-UID
      } else {
        navigate('/');
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (userId) {
      fetchPlayerNames(userId);
      fetchGames(userId);
    }
  }, [userId]);

  useEffect(() => {
    // חשב רווח/הפסד כולל כאשר המשחקים או השחקן הנבחר משתנים
    if (selectedPlayerName && games.length > 0) {
      const playerGames = games.filter(game =>
        game.players && game.players.some(p => p.name === selectedPlayerName)
      );

      const calculatedTotalProfitLoss = playerGames.reduce((sum, game) => {
        const playerInGame = game.players.find(p => p.name === selectedPlayerName);
        const buyIn = parseFloat(playerInGame.buyIn) || 0;
        const cashOut = parseFloat(playerInGame.cashOut) || 0;
        return sum + (cashOut - buyIn);
      }, 0);
      setTotalProfitLoss(calculatedTotalProfitLoss);
    } else {
      setTotalProfitLoss(0); // אפס אם אין שחקן נבחר או אין משחקים
    }
  }, [selectedPlayerName, games]);


  const fetchPlayerNames = async (currentUserId) => {
    try {
      const playersCollectionRef = collection(db, `artifacts/${appId}/users/${currentUserId}/players`);
      const playerSnapshot = await getDocs(playersCollectionRef);
      const names = playerSnapshot.docs.map(doc => doc.data().name);
      setPlayerNames(names);
      if (names.length > 0) {
        setSelectedPlayerName(names[0]); // בחר את השחקן הראשון כברירת מחדל
      }
    } catch (err) {
      console.error("שגיאה בטעינת שמות שחקנים:", err);
      setError("שגיאה בטעינת שמות שחקנים.");
    }
  };

  const fetchGames = async (currentUserId) => {
    setLoadingGames(true);
    setError(null);
    try {
      const gamesCollectionRef = collection(db, `artifacts/${appId}/users/${currentUserId}/cashGames`);
      const q = query(gamesCollectionRef); // ללא orderBy
      const querySnapshot = await getDocs(q);
      const fetchedGames = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // ודא ש-players הוא מערך גם אם הוא חסר או לא בפורמט הנכון
        players: Array.isArray(doc.data().players) ? doc.data().players : [],
      }));
      setGames(fetchedGames);
    } catch (err) {
      console.error("שגיאה בטעינת משחקים:", err);
      setError("שגיאה בטעינת משחקים.");
    } finally {
      setLoadingGames(false);
    }
  };

  if (loadingAuth) {
    return (
      <div className="personal-tracking-container">
        <h2>טוען מעקב אישי...</h2>
      </div>
    );
  }

  return (
    <div className="personal-tracking-container">
      <h2><FontAwesomeIcon icon={faChartLine} /> מעקב אישי</h2>
      <p className="text-center text-gray-600 mb-8">
        עקוב אחר הביצועים שלך במשחקי קאש.
      </p>

      <div className="section player-selection-section">
        <h3><FontAwesomeIcon icon={faUserCircle} /> בחר שחקן</h3>
        {playerNames.length > 0 ? (
          <select
            value={selectedPlayerName}
            onChange={(e) => setSelectedPlayerName(e.target.value)}
            className="player-select"
          >
            {playerNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        ) : (
          <p>אין שחקנים זמינים. אנא הוסף שחקנים בדף 'ניהול שחקנים'.</p>
        )}
      </div>

      {selectedPlayerName && (
        <div className="section summary-section">
          <h3><FontAwesomeIcon icon={faDollarSign} /> סיכום רווח/הפסד עבור {selectedPlayerName}</h3>
          <p className={`total-profit-loss ${totalProfitLoss >= 0 ? 'positive' : 'negative'}`}>
            {totalProfitLoss.toFixed(2)} ₪
          </p>
        </div>
      )}

      <div className="section game-history-section">
        <h3><FontAwesomeIcon icon={faHandshake} /> היסטוריית משחקים</h3>
        {loadingGames ? (
          <p style={{ textAlign: 'center' }}>טוען היסטוריית משחקים...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : games.length === 0 ? (
          <p style={{ textAlign: 'center' }}>אין משחקים להצגה. התחל משחק קאש חדש כדי לראות נתונים כאן.</p>
        ) : (
          <ul className="game-list">
            {games
                .filter(game => game.players && game.players.some(p => p.name === selectedPlayerName))
                .sort((a, b) => {
                  // ודא שתאריכים קיימים לפני הגישה למאפיינים
                  const dateA = a.date && a.date.seconds ? new Date(a.date.seconds * 1000) : new Date(0);
                  const dateB = b.date && b.date.seconds ? new Date(b.date.seconds * 1000) : new Date(0);
                  return dateB - dateA;
                })
                .map(game => {
                  const playerInGame = game.players.find(p => p.name === selectedPlayerName);
                  if (!playerInGame) return null; // לוודא שהשחקן קיים במשחק

                  const buyIn = parseFloat(playerInGame.buyIn) || 0;
                  const cashOut = parseFloat(playerInGame.cashOut) || 0;
                  const gameProfitLoss = cashOut - buyIn;
                  const gameDate = game.date ? new Date(game.date.seconds * 1000).toLocaleDateString('he-IL') : 'תאריך לא ידוע';

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
          )}
      </div>
    </div>
  );
}

export default PersonalTracking;