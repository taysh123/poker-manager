import React, { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../firebase'; // ודא שהנתיב ל-firebase.js נכון
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// ודא ש-faChartLine מיובא מכאן
import { faChartLine, faUserCircle, faCoins, faMoneyBillWave, faDollarSign, faHandshake, faCalendarAlt, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
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

  // קבלת ה-appId מהמשתנה הגלובלי __app_id
  const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setLoadingAuth(false);
        // טען נתונים רק אם המשתמש אינו אנונימי
        if (!currentUser.isAnonymous) {
          fetchPersonalData(currentUser.uid, appId); // העבר appId לפונקציה
        } else {
          setLoadingGames(false);
          // הגדר הודעת שגיאה במקרה של משתמש אנונימי
          setError('מעקב אישי אינו זמין במצב אורח. אנא התחבר כדי לצפות בו.');
        }
      } else {
        navigate('/');
      }
    });

    return () => unsubscribe();
  }, [navigate, appId]); // הוסף appId לתלויות

  const fetchPersonalData = async (userId, currentAppId) => {
    setLoadingGames(true);
    setError(null);
    try {
      const cashGamesCollection = collection(db, 'artifacts', currentAppId, 'users', userId, 'cashGames');
      const querySnapshot = await getDocs(cashGamesCollection);
      
      const fetchedGames = [];
      let totalBuyIn = 0;
      let totalCashOut = 0;
      let gamesPlayed = 0;

      const uniquePlayerNames = new Set(); // כדי לאסוף שמות שחקנים ייחודיים

      querySnapshot.docs.forEach(doc => {
        const game = doc.data();
        fetchedGames.push({ id: doc.id, ...game });

        // מצא את נתוני המשתמש הנוכחי במערך השחקנים של המשחק
        if (game.players && Array.isArray(game.players)) {
          // ננסה להתאים לפי UID או DisplayName
          const currentUserPlayer = game.players.find(player => 
            (user && player.id === user.uid) || (user && player.name === user.displayName)
          );
          
          // אסוף את כל שמות השחקנים מהמשחקים
          game.players.forEach(player => {
            uniquePlayerNames.add(player.name);
          });

          if (currentUserPlayer) {
            totalBuyIn += parseFloat(currentUserPlayer.buyIn) || 0;
            totalCashOut += parseFloat(currentUserPlayer.cashOut) || 0;
            gamesPlayed += 1;
          }
        }
      });

      // מיון המשחקים לפי תאריך יורד
      setCashGames(fetchedGames.sort((a, b) => {
        const dateA = a.date && a.date.seconds ? new Date(a.date.seconds * 1000) : new Date(0);
        const dateB = b.date && b.date.seconds ? new Date(b.date.seconds * 1000) : new Date(0);
        return dateB - dateA;
      }));
      
      setPersonalStats({
        totalBuyIn,
        totalCashOut,
        netProfit: totalCashOut - totalBuyIn,
        gamesPlayed,
      });
      setPlayerNames(Array.from(uniquePlayerNames)); // הגדר את שמות השחקנים הייחודיים
      setLoadingGames(false);
    } catch (err) {
      console.error('שגיאה בשליפת נתוני מעקב אישי:', err);
      setError('שגיאה בטעינת הנתונים. נסה שוב מאוחר יותר.');
      setLoadingGames(false);
    }
  };

  // אפקט לחישוב רווח/הפסד כולל עבור השחקן הנבחר
  useEffect(() => {
    if (selectedPlayerName && games.length > 0) {
      let sum = 0;
      games.forEach(game => {
        const playerInGame = game.players.find(p => p.name === selectedPlayerName);
        if (playerInGame) {
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

  if (!user || user.isAnonymous) {
    return (
      <div className="page-container personal-tracking-container">
        <h2 style={{ textAlign: 'center', color: 'var(--secondary-color)' }}>גישה מוגבלת</h2>
        <p style={{ textAlign: 'center', color: '#FFFFFF' }}>
          מעקב אישי זמין רק למשתמשים רשומים. אנא התחבר כדי לצפות בו.
        </p>
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
