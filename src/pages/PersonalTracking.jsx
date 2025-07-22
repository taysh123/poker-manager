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
  const [error, setError] = useState(null); // <--- הוספה: הגדרת מצב שגיאה
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // אם המשתמש מחובר, טען את שמות השחקנים
        fetchPlayerNames(currentUser.uid);
      } else {
        navigate('/');
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user && selectedPlayerName) {
      fetchGamesForPlayer(user.uid, selectedPlayerName);
    } else if (user && !selectedPlayerName && playerNames.length > 0) {
      // אם יש משתמש אבל לא נבחר שחקן, בחר את הראשון כברירת מחדל
      setSelectedPlayerName(playerNames[0]);
    }
  }, [user, selectedPlayerName, playerNames]); // תלויות: user, selectedPlayerName, playerNames

  const fetchPlayerNames = async (userId) => {
    setLoadingGames(true);
    setError(null); // איפוס שגיאות
    try {
      const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
      const playersCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/players`);
      const playerSnapshot = await getDocs(playersCollectionRef);
      const names = playerSnapshot.docs.map(doc => doc.data().name);
      setPlayerNames(names);
      if (names.length > 0 && !selectedPlayerName) {
        setSelectedPlayerName(names[0]); // בחר את השחקן הראשון כברירת מחדל
      }
    } catch (err) {
      console.error("שגיאה בטעינת שמות שחקנים:", err);
      setError("שגיאה בטעינת שמות שחקנים. אנא נסה שוב.");
    } finally {
      setLoadingGames(false);
    }
  };

  const fetchGamesForPlayer = async (userId, playerName) => {
    setLoadingGames(true);
    setError(null); // איפוס שגיאות
    try {
      const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
      const gamesCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/sessions`); // נתיב לקולקציית המשחקים
      const q = query(gamesCollectionRef); // אין צורך ב-where אם נסנן ב-JS
      const querySnapshot = await getDocs(q);

      let playerGames = [];
      let currentTotalProfitLoss = 0;

      querySnapshot.forEach((doc) => {
        const gameData = doc.data();
        // ודא ש-gameData.players קיים ושהוא מערך
        if (gameData.players && Array.isArray(gameData.players)) {
          const playerInGame = gameData.players.find(p => p.name === playerName);
          if (playerInGame) {
            playerGames.push({ id: doc.id, ...gameData });
            currentTotalProfitLoss += (playerInGame.cashOut - playerInGame.buyIn);
          }
        }
      });
      setGames(playerGames);
      setTotalProfitLoss(currentTotalProfitLoss);
    } catch (err) {
      console.error("שגיאה בטעינת משחקים עבור השחקן:", err);
      setError("שגיאה בטעינת נתוני משחקים. אנא נסה שוב.");
    } finally {
      setLoadingGames(false);
    }
  };

  const handlePlayerChange = (event) => {
    setSelectedPlayerName(event.target.value);
  };

  if (loadingAuth) {
    return (
      <div className="personal-tracking-container">
        <h2>טוען אימות...</h2>
      </div>
    );
  }

  if (!user) {
    return null; // או הפניה לדף כניסה
  }

  return (
    <div className="personal-tracking-container">
      <h2><FontAwesomeIcon icon={faChartLine} /> מעקב אישי</h2>
      <p className="text-center text-gray-600 mb-8">
        כאן תוכל לעקוב אחר הביצועים האישיים של שחקן ספציפי לאורך זמן.
      </p>

      <div className="section player-selection-section">
        <h3><FontAwesomeIcon icon={faUserCircle} /> בחר שחקן</h3>
        {loadingGames ? (
          <p>טוען שחקנים...</p>
        ) : error ? (
          <p className="error-message">{error}</p> // הצגת הודעת שגיאה
        ) : playerNames.length === 0 ? (
          <p>אין שחקנים זמינים. אנא הוסף שחקנים דרך "ניהול שחקנים" תחילה.</p>
        ) : (
          <select
            value={selectedPlayerName}
            onChange={handlePlayerChange}
            className="player-select"
          >
            {playerNames.map((name, index) => (
              <option key={index} value={name}>
                {name}
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedPlayerName && !loadingGames && (
        <div className="section summary-section">
          <h3>סיכום עבור {selectedPlayerName}</h3>
          <p className={`total-profit-loss ${totalProfitLoss >= 0 ? 'positive' : 'negative'}`}>
            סה"כ רווח/הפסד: {totalProfitLoss.toFixed(2)} ₪
          </p>
        </div>
      )}

      <div className="section games-list-section">
        <h3><FontAwesomeIcon icon={faChartLine} /> היסטוריית משחקים</h3>
        {loadingGames ? (
          <p>טוען משחקים...</p>
        ) : error ? (
          <p className="error-message">{error}</p> // הצגת הודעת שגיאה
        ) : games.length > 0 ? (
          <ul className="games-list">
            {games
                .sort((a, b) => {
                  // ודא ש-date קיים ושהוא אובייקט Timestamp של Firebase
                  const dateA = a.date && a.date.seconds ? new Date(a.date.seconds * 1000) : new Date(0);
                  const dateB = b.date && b.date.seconds ? new Date(b.date.seconds * 1000) : new Date(0);
                  return dateB - dateA; // מיון מהחדש לישן
                })
                .map(game => {
                  const playerInGame = game.players.find(p => p.name === selectedPlayerName);
                  if (!playerInGame) return null; // לוודא שהשחקן קיים במשחק הזה

                  const gameProfitLoss = playerInGame.cashOut - playerInGame.buyIn;
                  const gameDate = game.date ? new Date(game.date.seconds * 1000).toLocaleDateString('he-IL') : 'תאריך לא ידוע';

                  return (
                    <li key={game.id} className="game-item">
                      <div className="game-info">
                        <span>תאריך: {gameDate}</span>
                        <span>יחס צ'יפים: {game.chipsPerShekel}</span>
                      </div>
                      <div className="player-stats">
                        <span>השקעה: {playerInGame.buyIn.toFixed(2)} ₪</span>
                        <span>יציאה: {playerInGame.cashOut.toFixed(2)} ₪</span>
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
    </div>
  );
}

export default PersonalTracking;