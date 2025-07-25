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
        if (!currentUser.isAnonymous) {
          fetchPlayerNames(currentUser.uid);
        } else {
          setLoadingGames(false);
          setError('מעקב אישי אינו זמין במצב אורח. אנא התחבר כדי לצפות בו.');
        }
      } else {
        navigate('/');
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    // טען משחקים רק אם המשתמש מאומת ויש שחקן נבחר
    if (user && userId && selectedPlayerName) {
      fetchGamesForPlayer(userId, selectedPlayerName);
    } else if (user && userId && playerNames.length > 0 && !selectedPlayerName) {
      // אם יש משתמש אבל לא נבחר שחקן, בחר את הראשון כברירת מחדל
      setSelectedPlayerName(playerNames[0]);
    }
  }, [user, userId, selectedPlayerName, playerNames]);

  const fetchPlayerNames = async (currentUserId) => {
    if (!currentUserId) {
      console.warn("אין User ID, לא ניתן לטעון שמות שחקנים.");
      setLoadingGames(false);
      return;
    }
    setLoadingGames(true);
    setError(null);
    try {
      const playersCollectionRef = collection(db, `artifacts/${appId}/users/${currentUserId}/players`);
      const playerSnapshot = await getDocs(playersCollectionRef);
      const names = playerSnapshot.docs.map(doc => doc.data().name);
      setPlayerNames(names);
      if (names.length > 0 && !selectedPlayerName) {
        setSelectedPlayerName(names[0]);
      }
    } catch (err) {
      console.error("שגיאה בטעינת שמות שחקנים:", err);
      setError("שגיאה בטעינת שמות שחקנים. אנא נסה שוב.");
    } finally {
      setLoadingGames(false);
    }
  };

  const fetchGamesForPlayer = async (currentUserId, playerName) => {
    if (!currentUserId || !playerName) {
      console.warn("אין User ID או שם שחקן, לא ניתן לטעון משחקים.");
      setLoadingGames(false);
      return;
    }
    setLoadingGames(true);
    setError(null);
    try {
      const gamesCollectionRef = collection(db, `artifacts/${appId}/users/${currentUserId}/sessions`); // נתיב לקולקציית המשחקים
      const q = query(gamesCollectionRef);
      const querySnapshot = await getDocs(q);

      let playerGames = [];
      let currentTotalProfitLoss = 0;

      querySnapshot.forEach((doc) => {
        const gameData = doc.data();
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

  if (!user || user.isAnonymous) {
    return (
      <div className="personal-tracking-container">
        <h2 style={{ textAlign: 'center', color: 'var(--secondary-color)' }}>גישה מוגבלת</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-color)' }}>
          מעקב אישי זמין רק למשתמשים רשומים. אנא התחבר כדי לצפות בו.
        </p>
      </div>
    );
  }

  if (loadingGames) {
    return (
      <div className="personal-tracking-container">
        <p style={{ textAlign: 'center', color: 'var(--text-color)' }}>טוען נתונים...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="personal-tracking-container">
        <h2 style={{ textAlign: 'center', color: 'var(--danger-color)' }}><FontAwesomeIcon icon={faInfoCircle} /> שגיאה</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-color)' }}>{error}</p>
      </div>
    );
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
          <p className="error-message">{error}</p>
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
          <p className="error-message">{error}</p>
        ) : games.length > 0 ? (
          <ul className="games-list">
            {games
                .sort((a, b) => {
                  const dateA = a.date && a.date.seconds ? new Date(a.date.seconds * 1000) : new Date(0);
                  const dateB = b.date && b.date.seconds ? new Date(b.date.seconds * 1000) : new Date(0);
                  return dateB - dateA;
                })
                .map(game => {
                  const playerInGame = game.players.find(p => p.name === selectedPlayerName);
                  if (!playerInGame) return null;

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
          ) : (
            <p>לא נמצאו משחקים עבור שם השחקן שנבחר.</p>
          )}
      </div>
    </div>
  );
}

export default PersonalTracking;
