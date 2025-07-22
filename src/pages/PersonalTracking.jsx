import React, { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faUserCircle } from '@fortawesome/free-solid-svg-icons';
import './PersonalTracking.css'; // ייבוא קובץ ה-CSS החדש

function PersonalTracking() {
  const [user, setUser] = useState(null); // מצב עבור פרטי המשתמש המחובר
  const [loadingAuth, setLoadingAuth] = useState(true); // מצב לטעינת אימות
  const [games, setGames] = useState([]); // מצב לאחסון כל המשחקים שאוחזרו
  const [loadingGames, setLoadingGames] = useState(true); // מצב לטעינת המשחקים
  const [playerNames, setPlayerNames] = useState([]); // רשימה ייחודית של שמות שחקנים מכל המשחקים
  const [selectedPlayerName, setSelectedPlayerName] = useState(''); // שם השחקן שנבחר על ידי המשתמש
  const [totalProfitLoss, setTotalProfitLoss] = useState(0); // סך הרווח/הפסד עבור השחקן הנבחר
  const navigate = useNavigate(); // הוק לניווט בין דפים

  // useEffect לטיפול באימות המשתמש
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // אם המשתמש מחובר, שמור את פרטיו
        setUser(currentUser);
      } else {
        // אם המשתמש לא מחובר, הפנה לדף הבית/התחברות
        navigate('/');
      }
      setLoadingAuth(false); // סיים טעינת אימות
    });

    // פונקציית ניקוי לביטול ההאזנה בעת הסרת הקומפוננטה
    return () => unsubscribe();
  }, [navigate]); // התלות ב-navigate מבטיחה שהאפקט יופעל מחדש רק אם navigate משתנה (נדיר)

  // useEffect לאחזור משחקים מ-Firestore וחלץ שמות שחקנים
  useEffect(() => {
    const fetchGames = async () => {
      // ודא שהמשתמש מחובר לפני ניסיון לאחזר נתונים
      if (user) {
        setLoadingGames(true); // התחל טעינת משחקים
        try {
          // צור שאילתה לאחזור כל המשחקים בקולקציית 'cashGames' של המשתמש הנוכחי
          const q = query(collection(db, 'users', user.uid, 'cashGames'));
          const querySnapshot = await getDocs(q); // בצע את השאילתה
          const fetchedGames = querySnapshot.docs.map(doc => ({
            id: doc.id, // הוסף את ה-ID של המסמך
            ...doc.data() // הוסף את שאר נתוני המסמך
          }));
          setGames(fetchedGames); // שמור את המשחקים שאוחזרו במצב

          // חלץ שמות שחקנים ייחודיים מכל המשחקים
          const names = new Set(); // השתמש ב-Set כדי להבטיח ייחודיות
          fetchedGames.forEach(game => {
            game.players.forEach(player => {
              names.add(player.name); // הוסף את שם השחקן ל-Set
            });
          });
          setPlayerNames(Array.from(names)); // המר את ה-Set למערך ושמור במצב

        } catch (error) {
          console.error('שגיאה באחזור משחקים:', error); // הדפס שגיאה אם האחזור נכשל
        } finally {
          setLoadingGames(false); // סיים טעינת משחקים
        }
      }
    };

    fetchGames(); // קרא לפונקציית אחזור המשחקים
  }, [user]); // אפקט זה יופעל מחדש כאשר אובייקט המשתמש משתנה (כלומר, כאשר המשתמש מתחבר)

  // useEffect לחישוב סך הרווח/הפסד כאשר שם השחקן הנבחר או רשימת המשחקים משתנים
  useEffect(() => {
    if (selectedPlayerName && games.length > 0) {
      let sum = 0;
      // עבור על כל המשחקים
      games.forEach(game => {
        // מצא את אובייקט השחקן התואם לשם השחקן הנבחר במשחק הנוכחי
        const playerInGame = game.players.find(p => p.name === selectedPlayerName);
        if (playerInGame) {
          // אם השחקן נמצא במשחק, חשב את הרווח/הפסד שלו והוסף לסכום הכולל
          sum += (playerInGame.cashOut - playerInGame.buyIn);
        }
      });
      setTotalProfitLoss(sum); // עדכן את סך הרווח/הפסד במצב
    } else {
      setTotalProfitLoss(0); // אפס את הסכום אם אין שחקן נבחר או אין משחקים
    }
  }, [selectedPlayerName, games]); // אפקט זה יופעל מחדש כאשר selectedPlayerName או games משתנים

  // הצג מצב טעינה בזמן אימות או אחזור משחקים
  if (loadingAuth || loadingGames) {
    return (
      <div className="page-container personal-tracking-container">
        <p style={{ textAlign: 'center', color: 'var(--text-color)' }}>טוען נתונים...</p>
      </div>
    );
  }

  // הצג הודעת הפניה אם המשתמש לא מחובר
  if (!user) {
    return (
      <div className="page-container personal-tracking-container">
        <p style={{ textAlign: 'center', color: 'var(--text-color)' }}>מפנה לדף הכניסה...</p>
      </div>
    );
  }

  // רכיב ה-UI של עמוד המעקב האישי
  return (
    <div className="page-container personal-tracking-container">
      <h2><FontAwesomeIcon icon={faChartLine} /> מעקב אישי</h2>

      {/* קטע לבחירת שם השחקן */}
      <div className="form-section">
        <label htmlFor="playerNameSelect">בחר את השם שלך:</label>
        <select
          id="playerNameSelect"
          value={selectedPlayerName}
          onChange={(e) => setSelectedPlayerName(e.target.value)}
        >
          <option value="">בחר שם...</option> {/* אפשרות ברירת מחדל */}
          {playerNames.map((name, index) => (
            <option key={index} value={name}>{name}</option> // רשימת שמות השחקנים
          ))}
        </select>
      </div>

      {/* הצג את התוצאות רק אם נבחר שם שחקן */}
      {selectedPlayerName && (
        <div className="tracking-results">
          <h3><FontAwesomeIcon icon={faUserCircle} /> סיכום עבור {selectedPlayerName}:</h3>
          {/* הצג את סך הרווח/הפסד עם עיצוב מתאים (חיובי/שלילי) */}
          <p className={`total-profit-loss ${totalProfitLoss >= 0 ? 'positive' : 'negative'}`}>
            סה"כ רווח/הפסד: {totalProfitLoss.toFixed(2)} ₪
          </p>

          <h4>היסטוריית משחקים:</h4>
          {/* ודא שיש משחקים עבור השחקן הנבחר לפני ההצגה */}
          {games.filter(game => game.players.some(p => p.name === selectedPlayerName)).length > 0 ? (
            <ul className="game-history-list">
              {games
                // סנן רק את המשחקים בהם השחקן הנבחר השתתף
                .filter(game => game.players.some(p => p.name === selectedPlayerName))
                // מיין את המשחקים לפי תאריך יורד (החדש ביותר ראשון)
                .sort((a, b) => {
                  // ודא ששדות התאריך קיימים לפני הגישה אליהם
                  const dateA = a.date && a.date.seconds ? new Date(a.date.seconds * 1000) : new Date(0);
                  const dateB = b.date && b.date.seconds ? new Date(b.date.seconds * 1000) : new Date(0);
                  return dateB - dateA;
                })
                .map(game => {
                  // מצא את אובייקט השחקן הספציפי במשחק הנוכחי
                  const playerInGame = game.players.find(p => p.name === selectedPlayerName);
                  // חשב את הרווח/הפסד עבור משחק זה
                  const gameProfitLoss = playerInGame.cashOut - playerInGame.buyIn;
                  // פורמט את התאריך לתצוגה ידידותית למשתמש
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
                        {/* הצג רווח/הפסד עבור משחק זה עם עיצוב מתאים */}
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
