import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoins, faUsers, faSave, faTimes, faPlus, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import './CashGame.css'; // ודא שקובץ ה-CSS מיובא כראוי

function CashGame() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const navigate = useNavigate();

  // מצבים עבור פרטי המשחק
  const [chipsPerShekel, setChipsPerShekel] = useState('');
  const [players, setPlayers] = useState([{ name: '', buyIn: '', cashOut: '' }]);
  const [gameSavedMessage, setGameSavedMessage] = useState('');
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [isCashOutAutoCalculated, setIsCashOutAutoCalculated] = useState(false); // מצב חדש לניהול חישוב אוטומטי

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        navigate('/'); // מפנה לדף הבית אם המשתמש לא מחובר
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  // פונקציה לטיפול בשינויים בשדות השחקנים
  const handlePlayerChange = (index, event) => {
    const { name, value } = event.target;
    const newPlayers = [...players];
    
    // המרה למספרים עבור buyIn ו-cashOut
    if (name === 'buyIn' || name === 'cashOut') {
      newPlayers[index][name] = value === '' ? '' : parseFloat(value);
    } else {
      newPlayers[index][name] = value;
    }
    setPlayers(newPlayers);

    // לוגיקה לחישוב אוטומטי של Cash Out עבור השחקן האחרון
    // נבדוק אם יש לפחות שני שחקנים וזהו לא השחקן האחרון ששינה את שדה ה-cashOut
    if (players.length >= 2 && name === 'cashOut' && index !== players.length - 1) {
      calculateLastPlayerCashOut(newPlayers);
    } else if (players.length >= 2 && name === 'cashOut' && index === players.length - 1) {
      // אם השחקן האחרון משנה ידנית את ה-cashOut שלו, נבטל את החישוב האוטומטי
      setIsCashOutAutoCalculated(false);
    } else if (players.length >= 2 && name === 'buyIn') {
      // אם שדה buyIn כלשהו משתנה, ננסה לחשב שוב
      calculateLastPlayerCashOut(newPlayers);
    }
  };

  // פונקציה לחישוב אוטומטי של Cash Out עבור השחקן האחרון
  const calculateLastPlayerCashOut = (currentPlayers) => {
    if (currentPlayers.length < 2) {
      setIsCashOutAutoCalculated(false);
      return;
    }

    const lastPlayerIndex = currentPlayers.length - 1;
    let totalGameBuyIn = 0;
    let sumOfOtherPlayersCashOut = 0;
    let allOthersCashOutFilled = true;

    // חישוב סך כל ה-buyIn של כל השחקנים
    for (const player of currentPlayers) {
      if (typeof player.buyIn === 'number' && !isNaN(player.buyIn)) {
        totalGameBuyIn += player.buyIn;
      }
    }

    // חישוב סך ה-cashOut של כל השחקנים למעט האחרון, ובדיקה אם כולם מולאו
    for (let i = 0; i < lastPlayerIndex; i++) {
      if (typeof currentPlayers[i].cashOut === 'number' && !isNaN(currentPlayers[i].cashOut)) {
        sumOfOtherPlayersCashOut += currentPlayers[i].cashOut;
      } else {
        allOthersCashOutFilled = false; // אם יש שחקן ש-cashOut שלו לא מולא
        break;
      }
    }

    // אם כל שדות ה-cashOut של השחקנים האחרים מולאו
    if (allOthersCashOutFilled && typeof currentPlayers[lastPlayerIndex].buyIn === 'number' && !isNaN(currentPlayers[lastPlayerIndex].buyIn)) {
      const calculatedCashOut = totalGameBuyIn - sumOfOtherPlayersCashOut;
      const newPlayers = [...currentPlayers];
      newPlayers[lastPlayerIndex].cashOut = parseFloat(calculatedCashOut.toFixed(2)); // עיגול לשני מקומות עשרוניים
      setPlayers(newPlayers);
      setIsCashOutAutoCalculated(true); // סמן שהחישוב אוטומטי
    } else {
      setIsCashOutAutoCalculated(false); // בטל סימון אם לא ניתן לחשב אוטומטית
    }
  };

  // פונקציה להוספת שחקן חדש
  const addPlayer = () => {
    setPlayers([...players, { name: '', buyIn: '', cashOut: '' }]);
    setIsCashOutAutoCalculated(false); // ביטול חישוב אוטומטי כשמוסיפים שחקן חדש
  };

  // פונקציה למחיקת שחקן
  const removePlayer = (index) => {
    const newPlayers = players.filter((_, i) => i !== index);
    setPlayers(newPlayers);
    // לאחר מחיקה, ננסה לחשב מחדש את ה-cashOut של השחקן האחרון אם יש מספיק נתונים
    if (newPlayers.length >= 2) {
      calculateLastPlayerCashOut(newPlayers);
    } else {
      setIsCashOutAutoCalculated(false);
    }
  };

  // פונקציה לטיפול בשמירת המשחק
  const handleSaveGame = async () => {
    if (!user || user.isAnonymous) {
      alert('יש להתחבר כדי לשמור משחקים.');
      return;
    }

    // בדיקות ולידציה בסיסיות
    if (!chipsPerShekel || isNaN(parseFloat(chipsPerShekel))) {
      alert('אנא הזן יחס צ׳יפים לשקל תקין.');
      return;
    }

    if (players.length === 0) {
      alert('אנא הוסף לפחות שחקן אחד.');
      return;
    }

    // ולידציה שכל השדות של השחקנים מולאו כראוי
    for (const player of players) {
      if (!player.name || isNaN(player.buyIn) || isNaN(player.cashOut)) {
        alert('אנא ודא שכל שדות השחקנים (שם, השקעה, יציאה) מולאו כראוי.');
        return;
      }
    }

    // חישוב סך הרווח/הפסד של המשחק
    const totalBuyIn = players.reduce((sum, p) => sum + parseFloat(p.buyIn), 0);
    const totalCashOut = players.reduce((sum, p) => sum + parseFloat(p.cashOut), 0);
    const totalProfitLoss = totalCashOut - totalBuyIn;

    // הצג אזהרה אם המשחק אינו מאוזן (סכום רווח/הפסד אינו אפס)
    if (Math.abs(totalProfitLoss) > 0.01) { // סף קטן לטיפול בשגיאות עיגול
      setShowConfirmationModal(true);
      return; // עצור כאן, המשתמש יחליט במודאל
    }

    // אם המשחק מאוזן, שמור ישירות
    saveGameToFirestore();
  };

  const saveGameToFirestore = async () => {
    if (!user || user.isAnonymous) {
      alert('יש להתחבר כדי לשמור משחקים.');
      return;
    }

    try {
      // הכנת נתוני השחקנים לשמירה
      const playersToSave = players.map(player => ({
        name: player.name,
        buyIn: parseFloat(player.buyIn),
        cashOut: parseFloat(player.cashOut),
      }));

      // שמירת המשחק בקולקציית cashGames של המשתמש המחובר
      await addDoc(collection(db, 'users', user.uid, 'cashGames'), {
        chipsPerShekel: parseFloat(chipsPerShekel),
        players: playersToSave,
        date: serverTimestamp(), // חותמת זמן של שרת
      });

      setGameSavedMessage('המשחק נשמר בהצלחה!');
      // איפוס טפסים לאחר שמירה מוצלחת
      setChipsPerShekel('');
      setPlayers([{ name: '', buyIn: '', cashOut: '' }]);
      setIsCashOutAutoCalculated(false); // איפוס מצב חישוב אוטומטי
      setShowConfirmationModal(false); // סגור מודאל אם היה פתוח
      setTimeout(() => setGameSavedMessage(''), 3000); // הסתר הודעה לאחר 3 שניות
    } catch (error) {
      console.error('שגיאה בשמירת המשחק:', error);
      setGameSavedMessage('שגיאה בשמירת המשחק. אנא נסה שוב.');
    }
  };

  const handleConfirmSave = () => {
    saveGameToFirestore(); // שמור את המשחק גם אם לא מאוזן
  };

  const handleCancelSave = () => {
    setShowConfirmationModal(false); // בטל את השמירה
  };

  if (loadingAuth) {
    return (
      <div className="page-container cash-game-container">
        <p style={{ textAlign: 'center', color: 'var(--text-color)' }}>טוען...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page-container cash-game-container">
        <p style={{ textAlign: 'center', color: 'var(--text-color)' }}>מפנה לדף הכניסה...</p>
      </div>
    );
  }

  return (
    <div className="page-container cash-game-container">
      <h2><FontAwesomeIcon icon={faCoins} /> ניהול משחק מזומן</h2>

      {gameSavedMessage && <div className="game-saved-message">{gameSavedMessage}</div>}

      <div className="form-section">
        <label htmlFor="chipsPerShekel">יחס צ'יפים לשקל:</label>
        <input
          type="number"
          id="chipsPerShekel"
          value={chipsPerShekel}
          onChange={(e) => setChipsPerShekel(e.target.value)}
          placeholder="לדוגמה: 0.1 (10 צ'יפים לשקל)"
          step="0.01"
        />
      </div>

      <h3><FontAwesomeIcon icon={faUsers} /> שחקנים:</h3>
      <div className="players-list">
        {players.map((player, index) => (
          <div key={index} className="player-input-row">
            <input
              type="text"
              name="name"
              value={player.name}
              onChange={(e) => handlePlayerChange(index, e)}
              placeholder="שם שחקן"
            />
            <input
              type="number"
              name="buyIn"
              value={player.buyIn}
              onChange={(e) => handlePlayerChange(index, e)}
              placeholder="השקעה כוללת (₪)"
              step="0.01"
            />
            <input
              type="number"
              name="cashOut"
              value={player.cashOut}
              onChange={(e) => handlePlayerChange(index, e)}
              placeholder="סכום יציאה (₪)"
              step="0.01"
              // הגדרת readOnly עבור השחקן האחרון אם ה-cashOut מחושב אוטומטית
              readOnly={index === players.length - 1 && isCashOutAutoCalculated}
              style={index === players.length - 1 && isCashOutAutoCalculated ? { backgroundColor: '#444', cursor: 'default' } : {}}
            />
            <button onClick={() => removePlayer(index)} className="remove-player-button">
              <FontAwesomeIcon icon={faTrashAlt} />
            </button>
          </div>
        ))}
      </div>
      <button onClick={addPlayer} className="add-player-button">
        <FontAwesomeIcon icon={faPlus} /> הוסף שחקן
      </button>

      <button onClick={handleSaveGame} className="save-game-button">
        <FontAwesomeIcon icon={faSave} /> שמור משחק
      </button>

      {/* מודאל אישור שמירה */}
      {showConfirmationModal && (
        <div className="confirmation-modal-overlay">
          <div className="confirmation-modal">
            <h3>אזהרה: המשחק אינו מאוזן!</h3>
            <p>סך הרווחים/הפסדים של השחקנים אינו מתאפס.</p>
            <p>האם ברצונך לשמור את המשחק בכל זאת?</p>
            <div className="modal-buttons">
              <button onClick={handleConfirmSave} className="confirm-button">
                כן, שמור
              </button>
              <button onClick={handleCancelSave} className="cancel-button">
                לא, בטל
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CashGame;