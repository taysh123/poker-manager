import React, { useEffect, useState, useRef } from 'react';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoins, faUsers, faPlus, faTimes, faHandshake, faExchangeAlt, faPercentage, faWallet, faCamera, faUpload, faUser } from '@fortawesome/free-solid-svg-icons'; // נוסף faUser

import './CashGame.css';

// רכיב Modal פשוט להודעות אישור ושגיאה
const CustomModal = ({ message, onConfirm, onCancel, type }) => {
  if (!message) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <p>{message}</p>
        <div className="modal-actions">
          {type === 'confirm' && (
            <>
              <button onClick={onConfirm} className="modal-button confirm-button">אישור</button>
              <button onClick={onCancel} className="modal-button cancel-button">ביטול</button>
            </>
          )}
          {type === 'alert' && (
            <button onClick={onCancel} className="modal-button confirm-button">הבנתי</button>
          )}
        </div>
      </div>
    </div>
  );
};

function CashGame() {
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const navigate = useNavigate();

  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerBuyIn, setNewPlayerBuyIn] = useState(''); // סכום כניסה בשקלים
  const [chipRatio, setChipRatio] = useState(1); // יחס שקל לצ'יפ
  const [debts, setDebts] = useState([]);
  const [gameImages, setGameImages] = useState([]); // מצב לתמונות המשחק
  const fileInputRef = useRef(null);

  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('alert');
  const [modalAction, setModalAction] = useState(null);

  const [savedPlayers, setSavedPlayers] = useState([]); // רשימת שחקנים קבועים מ-Firestore
  const [loadingSavedPlayers, setLoadingSavedPlayers] = useState(true);
  const [selectedSavedPlayer, setSelectedSavedPlayer] = useState('');

  // קבלת ה-appId מהמשתנה הגלובלי __app_id
  const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setUserId(currentUser.uid);
        setLoadingAuth(false);

        // טען שחקנים קבועים
        if (!currentUser.isAnonymous) {
          try {
            const playersColRef = collection(db, `artifacts/${appId}/users/${currentUser.uid}/players`);
            const playerSnapshot = await getDocs(playersColRef);
            const fetchedPlayers = playerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSavedPlayers(fetchedPlayers);
          } catch (error) {
            console.error("שגיאה בטעינת שחקנים קבועים:", error);
            // הצג הודעת שגיאה למשתמש
            showCustomModal("שגיאה בטעינת שחקנים קבועים.", 'alert');
          } finally {
            setLoadingSavedPlayers(false);
          }
        } else {
          setLoadingSavedPlayers(false);
        }
      } else {
        navigate('/'); // חזור לדף הבית אם המשתמש לא מחובר
      }
    });

    return () => unsubscribe();
  }, [navigate, appId]);

  // פונקציה להצגת מודאל מותאם אישית
  const showCustomModal = (message, type, action = null) => {
    setModalMessage(message);
    setModalType(type);
    setModalAction(() => action); // שמור את הפעולה כפונקציה
    setShowModal(true);
  };

  // פונקציה לסגירת המודאל
  const closeModal = () => {
    setShowModal(false);
    setModalMessage('');
    setModalType('alert');
    setModalAction(null);
  };

  // הוספת שחקן חדש למשחק
  const addPlayer = () => {
    const name = newPlayerName.trim();
    const buyIn = parseFloat(newPlayerBuyIn);

    if (!name || isNaN(buyIn) || buyIn <= 0) {
      showCustomModal('יש להזין שם וכניסה תקינה (בשקלים).', 'alert');
      return;
    }
    if (players.some(p => p.name === name)) {
      showCustomModal('שם השחקן כבר קיים ברשימה.', 'alert');
      return;
    }

    setPlayers([...players, { name, buyIn, cashOut: 0 }]); // buyIn נשמר בשקלים
    setNewPlayerName('');
    setNewPlayerBuyIn('');
    setSelectedSavedPlayer(''); // איפוס בחירת שחקן קבוע
  };

  // הוספת שחקן קבוע למשחק
  const addSavedPlayerToGame = () => {
    if (!selectedSavedPlayer) {
      showCustomModal('אנא בחר שחקן קבוע להוספה.', 'alert');
      return;
    }
    if (players.some(p => p.name === selectedSavedPlayer)) {
      showCustomModal('שחקן זה כבר נמצא ברשימת השחקנים הנוכחית.', 'alert');
      return;
    }

    // הוסף שחקן קבוע עם buyIn ו-cashOut התחלתיים 0
    setPlayers([...players, { name: selectedSavedPlayer, buyIn: 0, cashOut: 0 }]);
    setSelectedSavedPlayer('');
  };

  // עדכון סכום יציאה (Cash Out) של שחקן
  const handleCashOutChange = (index, value) => {
    const updatedPlayers = [...players];
    updatedPlayers[index].cashOut = parseFloat(value) || 0;
    setPlayers(updatedPlayers);
  };

  // הסרת שחקן מהרשימה
  const removePlayer = (indexToRemove) => {
    showCustomModal('האם אתה בטוח שברצונך למחוק שחקן זה מהמשחק?', 'confirm', () => {
      setPlayers(players.filter((_, index) => index !== indexToRemove));
      closeModal();
    });
  };

  // חישוב חובות
  const calculateDebts = () => {
    const settlements = [];
    const profits = players.map(p => ({
      name: p.name,
      // חישוב רווח/הפסד בשקלים
      amount: (p.cashOut / chipRatio) - p.buyIn,
    }));

    const debtors = profits.filter(p => p.amount < 0).map(p => ({ ...p, amount: -p.amount }));
    const creditors = profits.filter(p => p.amount > 0);

    let i = 0, j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];

      const payment = Math.min(debtor.amount, creditor.amount);

      settlements.push({
        debtor: debtor.name,
        creditor: creditor.name,
        amount: payment,
      });

      debtor.amount -= payment;
      creditor.amount -= payment;

      if (debtor.amount <= 0.001) i++;
      if (creditor.amount <= 0.001) j++;
    }
    setDebts(settlements);
  };

  // טיפול בהעלאת תמונות
  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    const newImages = [];
    files.forEach(file => {
      // הגבלת גודל קובץ ל-1MB
      if (file.size > 1024 * 1024) {
        showCustomModal(`הקובץ ${file.name} גדול מדי (מעל 1MB) ולא יועלה.`, 'alert');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        newImages.push(e.target.result); // Base64 string
        if (newImages.length === files.length) {
          setGameImages(prevImages => [...prevImages, ...newImages]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // הסרת תמונה
  const handleRemoveImage = (indexToRemove) => {
    showCustomModal('האם אתה בטוח שברצונך למחוק תמונה זו?', 'confirm', () => {
      setGameImages(prevImages => prevImages.filter((_, index) => index !== indexToRemove));
      closeModal();
    });
  };

  // חישוב וסגירת משחק (שמירה ב-Firestore)
  const handleCalculateAndSave = async () => {
    if (players.length === 0) {
      showCustomModal('אין שחקנים במשחק כדי לשמור.', 'alert');
      return;
    }

    calculateDebts(); // וודא שחובות מחושבים לפני השמירה

    // חישוב רווח/הפסד כולל
    const totalProfitLoss = players.reduce((sum, p) => sum + ((p.cashOut / chipRatio) - p.buyIn), 0);

    // הכנת נתוני השחקנים לשמירה
    const playersToSave = players.map(p => ({
      name: p.name,
      buyIn: p.buyIn, // נשמר בשקלים
      cashOut: p.cashOut, // נשמר בצ'יפים
      profitLoss: (p.cashOut / chipRatio) - p.buyIn, // רווח/הפסד בשקלים
    }));

    const gameData = {
      date: new Date(),
      gameType: 'Cash Game',
      chipsPerShekel: chipRatio,
      players: playersToSave,
      settlements: debts, // חובות בין שחקנים
      totalProfitLoss: totalProfitLoss,
      images: gameImages, // שמירת תמונות כ-Base64
      userId: userId, // שמור את ה-userId של המשתמש
      appId: appId, // שמור את ה-appId
    };

    showCustomModal('האם אתה בטוח שברצונך לסגור ולשמור את המשחק?', 'confirm', async () => {
      try {
        if (!userId) {
          showCustomModal("שגיאה: משתמש לא מזוהה. אנא התחבר.", 'alert');
          return;
        }
        const gamesCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/cashGames`);
        await addDoc(gamesCollectionRef, gameData);
        showCustomModal('המשחק נשמר בהצלחה!', 'alert', () => navigate('/sessions'));
      } catch (e) {
        console.error("שגיאה בשמירת המשחק: ", e);
        showCustomModal(`שגיאה בשמירת המשחק: ${e.message}`, 'alert');
      } finally {
        closeModal();
      }
    });
  };

  if (loadingAuth || loadingSavedPlayers) {
    return (
      <div className="cash-game-container">
        <p style={{ textAlign: 'center' }}>טוען...</p>
      </div>
    );
  }

  return (
    <div className="cash-game-container">
      <CustomModal
        message={modalMessage}
        onConfirm={modalAction}
        onCancel={closeModal}
        type={modalType}
      />

      <h2><FontAwesomeIcon icon={faCoins} /> משחק קאש חדש</h2>

      <div className="section chip-ratio-section">
        <h3><FontAwesomeIcon icon={faWallet} /> הגדרות כלליות</h3>
        <div className="input-group">
          <label htmlFor="chipRatio">יחס צ'יפים לשקל:</label>
          <input
            type="number"
            id="chipRatio"
            value={chipRatio}
            onChange={(e) => setChipRatio(parseFloat(e.target.value) || 1)}
            min="0.01"
            step="0.01"
            placeholder="לדוגמה: 10 (10 צ'יפים לשקל)"
          />
        </div>
      </div>

      <div className="section add-player-section">
        <h3><FontAwesomeIcon icon={faUsers} /> הוסף שחקנים</h3>
        <div className="add-player-form">
          {/* הוספת שחקן חדש */}
          <div className="player-input-group">
            <input
              type="text"
              placeholder="שם שחקן חדש"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
            />
            <input
              type="number"
              placeholder="כניסה (₪)"
              value={newPlayerBuyIn}
              onChange={(e) => setNewPlayerBuyIn(e.target.value)}
              min="0"
            />
            <button onClick={addPlayer} className="add-player-btn">
              <FontAwesomeIcon icon={faPlus} /> הוסף שחקן
            </button>
          </div>

          {/* הוספת שחקן קבוע */}
          {savedPlayers.length > 0 && (
            <div className="player-input-group saved-player-group">
              <select
                value={selectedSavedPlayer}
                onChange={(e) => setSelectedSavedPlayer(e.target.value)}
              >
                <option value="">בחר שחקן קבוע</option>
                {savedPlayers.map(player => (
                  <option key={player.id} value={player.name}>{player.name}</option>
                ))}
              </select>
              <button onClick={addSavedPlayerToGame} className="add-player-btn secondary-btn">
                <FontAwesomeIcon icon={faUser} /> הוסף שחקן קיים
              </button>
            </div>
          )}
        </div>
      </div>

      {players.length > 0 && (
        <div className="section current-players-section">
          <h3><FontAwesomeIcon icon={faHandshake} /> שחקנים נוכחיים במשחק</h3>
          <div className="players-table-container">
            <table className="players-table">
              <thead>
                <tr>
                  <th>שם שחקן</th>
                  <th>כניסה (₪)</th>
                  <th>יציאה (צ'יפים)</th>
                  <th>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player, index) => (
                  <tr key={index}>
                    <td>{player.name}</td>
                    <td>{player.buyIn.toFixed(2)}</td> {/* הצגת כניסה בשקלים */}
                    <td>
                      <input
                        type="number"
                        value={player.cashOut}
                        onChange={(e) => handleCashOutChange(index, e.target.value)}
                        min="0"
                        placeholder="צ'יפים"
                      />
                    </td>
                    <td>
                      <button onClick={() => removePlayer(index)} className="remove-btn">
                        <FontAwesomeIcon icon={faTimes} /> הסר
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="section image-upload-section">
        <h3><FontAwesomeIcon icon={faCamera} /> תמונות מהמשחק</h3>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          ref={fileInputRef}
          style={{ display: 'none' }} // הסתר את האינפוט המקורי
        />
        <button onClick={() => fileInputRef.current.click()} className="upload-image-btn">
          <FontAwesomeIcon icon={faUpload} /> העלה תמונות
        </button>
        <div className="image-preview-grid">
          {gameImages.map((image, index) => (
            <div key={index} className="image-preview-item">
              <img src={image} alt={`Game Image ${index + 1}`} />
              <button onClick={() => handleRemoveImage(index)} className="remove-image-button">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          ))}
        </div>
        {gameImages.length > 0 && (
          <p className="image-note">
            הערה: תמונות אלו ישמרו עם המשחק. וודא שגודלן אינו עולה על 1MB למסמך.
          </p>
        )}
      </div>

      <button onClick={handleCalculateAndSave} className="calculate-btn">
        <FontAwesomeIcon icon={faPercentage} /> חשב וסגור משחק
      </button>

      {debts.length > 0 && (
        <div className="section debts-section">
          <h3><FontAwesomeIcon icon={faExchangeAlt} /> חובות בין שחקנים</h3>
          <table className="debts-table">
            <thead>
              <tr>
                <th>חייב</th>
                <th>מקבל</th>
                <th>סכום (₪)</th>
              </tr>
            </thead>
            <tbody>
              {debts.map((d, i) => (
                <tr key={i}>
                  <td>{d.debtor}</td>
                  <td>{d.creditor}</td>
                  <td className="debt-amount">{d.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="debt-note">
            הערה: חישוב החובות מתבצע בשקלים.
          </p>
        </div>
      )}
    </div>
  );
}

export default CashGame;