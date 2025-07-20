import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../firebase'; // ודא שנתיב זה נכון לקובץ ה-firebase שלך
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHistory, faCalendarAlt, faCoins, faUsers, faMoneyBillWave, faDollarSign } from '@fortawesome/free-solid-svg-icons';
import './Sessions.css'; // ייבוא קובץ ה-CSS החדש

function Sessions() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true); // מצב לבדיקת טעינת אימות

  const [savedGames, setSavedGames] = useState([]);
  const [loading, setLoading] = useState(true); // מצב לטעינת נתוני המשחקים
  const [error, setError] = useState(null); // מצב לשגיאות בטעינת נתונים

  useEffect(() => {
    const auth = getAuth();
    // האזנה לשינויים במצב ההתחברות של המשתמש
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false); // בדיקת האימות הסתיימה
      if (currentUser) {
        // אם המשתמש מחובר, טען את המשחקים השמורים
        fetchSavedGames(currentUser.uid);
      } else {
        // אם המשתמש לא מחובר, הפסק טעינת נתונים והצג הודעת שגיאה
        setLoading(false);
        // הגדרת הודעת השגיאה בעברית
        setError('אנא התחבר כדי לצפות במשחקים השמורים.');
      }
    });

    // ניקוי ה-listener כאשר הרכיב נעלם
    return () => unsubscribe();
  }, []); // ריצה רק פעם אחת בטעינת הרכיב

  const fetchSavedGames = async (userId) => {
    setLoading(true); // התחל טעינת נתונים
    setError(null); // אמן שאין שגיאות קודמות
    try {
      const cashGamesCollection = collection(db, 'users', userId, 'cashGames');
      const querySnapshot = await getDocs(cashGamesCollection);
      
      const gamesList = querySnapshot.docs.map(doc => {
        const gameData = doc.data();
        // חישוב רווח/הפסד לכל שחקן
        const playersWithProfit = gameData.players.map(player => ({
          ...player,
          profit: player.cashOut - player.buyIn,
        }));

        return {
          id: doc.id,
          // המרה של Timestamp לאובייקט Date ועיצוב לתאריך עברי
          date: gameData.date ? new Date(gameData.date.seconds * 1000).toLocaleDateString('he-IL') : 'תאריך לא ידוע',
          chipsPerShekel: gameData.chipsPerShekel || 'לא צוין', // ברירת מחדל אם לא קיים
          players: playersWithProfit,
        };
      }).sort((a, b) => new Date(b.date) - new Date(a.date)); // מיון מהחדש לישן

      setSavedGames(gamesList);
      setLoading(false); // טעינת נתונים הסתיימה
    } catch (err) {
      console.error('שגיאה בשליפת משחקים שמורים:', err);
      setError('שגיאה בטעינת המשחקים השמורים. נסה שוב מאוחר יותר.');
      setLoading(false); // טעינת נתונים הסתיימה עם שגיאה
    }
  };

  // הצגת הודעת טעינה בזמן בדיקת אימות
  if (loadingAuth) {
    return (
      <div className="page-container sessions-container">
        <p style={{ textAlign: 'center', color: 'var(--text-color)' }}>טוען...</p>
      </div>
    );
  }

  // הצגת הודעת התחברות אם המשתמש אינו מאומת
  if (!user) {
    return (
      <div className="page-container sessions-container">
        {/* כותרת בעברית - "משחקים שמורים" */}
        <h2 style={{ textAlign: 'center', color: 'var(--secondary-color)' }}>
          <FontAwesomeIcon icon={faHistory} /> משחקים שמורים
        </h2>
        {/* הודעה בעברית ובצבע לבן */}
        <p style={{ textAlign: 'center', color: '#FFFFFF' }}>
          אנא התחבר כדי לגשת לדף המשחקים השמורים.
        </p>
      </div>
    );
  }

  // הצגת הודעת טעינה בזמן שליפת הנתונים (לאחר בדיקת אימות)
  if (loading) {
    return (
      <div className="page-container sessions-container">
        <h2><FontAwesomeIcon icon={faHistory} /> משחקים שמורים</h2>
        <p className="loading-message">טוען משחקים...</p>
      </div>
    );
  }

  // הצגת הודעת שגיאה אם טעינת הנתונים נכשלה
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