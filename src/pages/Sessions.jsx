import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth'; // אין צורך ב-signInAnonymously כאן
import { db } from '../firebase'; // ודא שנתיב זה נכון לקובץ ה-firebase שלך
import { useNavigate } from 'react-router-dom'; // ייבוא useNavigate
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHistory, faCalendarAlt, faCoins, faUsers, faMoneyBillWave, faDollarSign } from '@fortawesome/free-solid-svg-icons';
import './Sessions.css'; // ייבוא קובץ ה-CSS החדש

function Sessions() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const navigate = useNavigate(); // ייבוא useNavigate

  const [savedGames, setSavedGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setLoadingAuth(false);
        // טען משחקים שמורים רק אם המשתמש אינו אנונימי
        if (!currentUser.isAnonymous) {
          fetchSavedGames(currentUser.uid);
        } else {
          setLoading(false);
          setError('משחקים שמורים אינם זמינים במצב אורח. אנא התחבר כדי לצפות בהם.');
        }
      } else {
        // אם אין משתמש מחובר, נווט לדף הכניסה הראשי
        navigate('/');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const fetchSavedGames = async (userId) => {
    setLoading(true);
    setError(null);
    try {
      const cashGamesCollection = collection(db, 'users', userId, 'cashGames');
      const querySnapshot = await getDocs(cashGamesCollection);
      
      const gamesList = querySnapshot.docs.map(doc => {
        const gameData = doc.data();
        const playersWithProfit = gameData.players.map(player => ({
          ...player,
          profit: player.cashOut - player.buyIn,
        }));

        return {
          id: doc.id,
          date: gameData.date ? new Date(gameData.date.seconds * 1000).toLocaleDateString('he-IL') : 'תאריך לא ידוע',
          chipsPerShekel: gameData.chipsPerShekel || 'לא צוין',
          players: playersWithProfit,
        };
      }).sort((a, b) => new Date(b.date) - new Date(a.date));

      setSavedGames(gamesList);
      setLoading(false);
    } catch (err) {
      console.error('שגיאה בשליפת משחקים שמורים:', err);
      setError('שגיאה בטעינת המשחקים השמורים. נסה שוב מאוחר יותר.');
      setLoading(false);
    }
  };

  if (loadingAuth) {
    return (
      <div className="page-container sessions-container">
        <p style={{ textAlign: 'center', color: 'var(--text-color)' }}>טוען...</p>
      </div>
    );
  }

  // אם אין משתמש (אפילו לא אורח), או אם המשתמש הוא אורח, נציג הודעה מתאימה
  if (!user || user.isAnonymous) {
    return (
      <div className="page-container sessions-container">
        <h2 style={{ textAlign: 'center', color: 'var(--secondary-color)' }}>
          <FontAwesomeIcon icon={faHistory} /> משחקים שמורים
        </h2>
        <p style={{ textAlign: 'center', color: '#FFFFFF' }}>
          משחקים שמורים זמינים רק למשתמשים רשומים. אנא התחבר כדי לצפות בהם.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-container sessions-container">
        <h2><FontAwesomeIcon icon={faHistory} /> משחקים שמורים</h2>
        <p className="loading-message">טוען משחקים...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container sessions-container">
        <h2><FontAwesomeIcon icon={faHistory} /> משחקים שמורים</h2>
        <p className="error-message">{error}</p>
      </div>
    );
  }

  return (
    <div className="page-container sessions-container">
      <h2><FontAwesomeIcon icon={faHistory} /> משחקים שמורים</h2>

      {savedGames.length === 0 ? (
        <p className="no-data-message">אין משחקים שמורים להצגה. התחל לשחק משחקי קאש כדי לשמור אותם!</p>
      ) : (
        <div className="games-list">
          {savedGames.map(game => (
            <div key={game.id} className="game-card section">
              <div className="game-header">
                <h3><FontAwesomeIcon icon={faCalendarAlt} /> תאריך: {game.date}</h3>
                <p><FontAwesomeIcon icon={faCoins} /> יחס צ'יפים לשקל: {game.chipsPerShekel}</p>
              </div>
              
              <div className="players-table-container">
                <table className="players-table">
                  <thead>
                    <tr>
                      <th><FontAwesomeIcon icon={faUsers} /> שם שחקן</th>
                      <th><FontAwesomeIcon icon={faMoneyBillWave} /> סה"כ כניסות (₪)</th>
                      <th><FontAwesomeIcon icon={faCoins} /> סה"כ יציאות (₪)</th>
                      <th><FontAwesomeIcon icon={faDollarSign} /> רווח/הפסד (₪)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {game.players.map((player, idx) => (
                      <tr key={idx}>
                        <td>{player.name}</td>
                        <td>{player.buyIn.toFixed(2)}</td>
                        <td>{player.cashOut.toFixed(2)}</td>
                        <td className={player.profit >= 0 ? 'profit' : 'loss'}>
                          {player.profit.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Sessions;