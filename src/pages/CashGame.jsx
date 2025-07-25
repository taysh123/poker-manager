import React, { useEffect, useState, useRef } from 'react';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoins, faUsers, faPlus, faTimes, faHandshake, faExchangeAlt, faPercentage, faWallet, faCamera, faUpload, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import './CashGame.css';

// ייבוא פונקציית החישוב המעודכנת
import { calculateSettlements } from '../utils/calculations'; // ודא שנתיב זה נכון

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

  const [chipRatio, setChipRatio] = useState(1); // יחס צ'יפים לשקל
  const [players, setPlayers] = useState([]); // רשימת השחקנים הנוכחית במשחק
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerBuyIn, setNewPlayerBuyIn] = useState('');
  const [debts, setDebts] = useState([]); // חובות והתחשבנויות

  const [savedPlayers, setSavedPlayers] = useState([]); // שחקנים קבועים מ-Firestore
  const [gameImages, setGameImages] = useState([]); // לשמירת תמונות מקודדות ב-Base64
  const imageInputRef = useRef(null); // Ref עבור אלמנט ה-input file

  const [modalMessage, setModalMessage] = useState(null);
  const [modalType, setModalType] = useState('alert');
  const [showConfirmSaveModal, setShowConfirmSaveModal] = useState(false);

  // קבלת ה-appId מהמשתנה הגלובלי __app_id
  const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

  // פונקציה לפתיחת המודל
  const openModal = (message, type = 'alert', onConfirm = null, onCancel = null) => {
    setModalMessage(message);
    setModalType(type);
    setModalOnConfirm(() => onConfirm);
    setModalOnCancel(() => onCancel || (() => setModalMessage(null))); // סגור מודל בלחיצת ביטול/הבנתי
    setShowConfirmSaveModal(type === 'confirm'); // קובע אם להציג כפתורי אישור/ביטול
  };

  // פונקציה לסגירת המודל
  const closeModal = () => {
    setModalMessage(null);
    setModalType('alert');
    setModalOnConfirm(null);
    setModalOnCancel(null);
    setShowConfirmSaveModal(false);
  };

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setUserId(currentUser.uid);
        setLoadingAuth(false);
        if (!currentUser.isAnonymous) {
          await fetchSavedPlayers(currentUser.uid);
        } else {
          openModal('כאורח, לא תוכל לשמור שחקנים קבועים או משחקים. אנא התחבר/הירשם כדי לגשת לפונקציונליות מלאה.', 'alert');
        }
      } else {
        navigate('/'); // אם אין משתמש, נווט לדף הבית/התחברות
      }
    });

    return () => unsubscribe();
  }, [navigate, appId]); // הוספת appId כתלות

  const fetchSavedPlayers = async (currentUserId) => {
    try {
      const playersCollectionRef = collection(db, `artifacts/${appId}/users/${currentUserId}/players`);
      const querySnapshot = await getDocs(playersCollectionRef);
      const playersList = querySnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
      setSavedPlayers(playersList);
    } catch (error) {
      console.error("שגיאה בטעינת שחקנים קבועים:", error);
      openModal('שגיאה בטעינת שחקנים קבועים. נסה לרענן את הדף.', 'alert');
    }
  };

  // הוספת שחקן חדש למשחק
  const addPlayer = () => {
    const name = newPlayerName.trim();
    const buyIn = parseFloat(newPlayerBuyIn);

    if (!name || isNaN(buyIn) || buyIn <= 0) {
      openModal('יש להזין שם שחקן וסכום כניסה תקין (מספר חיובי).', 'alert');
      return;
    }

    if (players.some(p => p.name === name)) {
      openModal('שם השחקן כבר קיים ברשימה.', 'alert');
      return;
    }
    
    // חישוב צ'יפים בכניסה
    const chipsIn = buyIn / chipRatio;
    setPlayers([...players, { name, buyIn, cashOut: 0, chipsIn, chipsOut: 0 }]);
    setNewPlayerName('');
    setNewPlayerBuyIn('');
  };

  // הוספת שחקן שמור למשחק
  const addSavedPlayerToGame = (playerName) => {
    if (players.some(p => p.name === playerName)) {
      openModal('שחקן זה כבר נמצא במשחק.', 'alert');
      return;
    }
    // כשמוסיפים שחקן שמור, נניח כניסה ראשונית 0, וניתן לעדכן אותה בטבלה
    setPlayers([...players, { name: playerName, buyIn: 0, cashOut: 0, chipsIn: 0, chipsOut: 0 }]);
    openModal(`השחקן ${playerName} נוסף למשחק.`, 'alert');
  };

  // טיפול בשינוי סכום כניסה (Buy In) של שחקן
  const handleBuyInChange = (index, value) => {
    const updatedPlayers = [...players];
    const newBuyIn = parseFloat(value);
    if (!isNaN(newBuyIn) && newBuyIn >= 0) {
      updatedPlayers[index].buyIn = newBuyIn;
      updatedPlayers[index].chipsIn = newBuyIn / chipRatio; // עדכון צ'יפים בכניסה
      setPlayers(updatedPlayers);
    }
  };

  // טיפול בשינוי סכום יציאה (Cash Out) של שחקן
  const handleCashOutChange = (index, value) => {
    const updatedPlayers = [...players];
    const newCashOut = parseFloat(value);
    if (!isNaN(newCashOut) && newCashOut >= 0) {
      updatedPlayers[index].cashOut = newCashOut;
      updatedPlayers[index].chipsOut = newCashOut / chipRatio; // עדכון צ'יפים ביציאה
      setPlayers(updatedPlayers);
    }
  };

  // מחיקת שחקן מהרשימה הנוכחית
  const deletePlayer = (indexToDelete) => {
    setPlayers(players.filter((_, index) => index !== indexToDelete));
    setDebts([]); // איפוס חובות כששחקן נמחק
  };

  // טיפול בהעלאת תמונה
  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    const newImages = [];
    files.forEach(file => {
      if (file.size > 1024 * 1024) { // 1MB limit
        openModal(`הקובץ ${file.name} גדול מדי (מעל 1MB) ולא יועלה.`, 'alert');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        newImages.push(reader.result); // Base64 string
        if (newImages.length === files.length) {
          setGameImages(prevImages => [...prevImages, ...newImages]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // הסרת תמונה
  const handleRemoveImage = (indexToRemove) => {
    setGameImages(prevImages => prevImages.filter((_, index) => index !== indexToRemove));
  };

  // חישוב חובות ושמירת המשחק
  const handleCalculateAndSave = () => {
    if (!user || user.isAnonymous) {
      openModal('כאורח, אינך יכול לשמור משחקים. אנא התחבר/הירשם.', 'alert');
      return;
    }

    if (players.length === 0) {
      openModal('יש להוסיף לפחות שחקן אחד למשחק.', 'alert');
      return;
    }

    // וודא שכל השחקנים מילאו את שדה ה-Cash Out
    const allPlayersCashedOut = players.every(p => p.cashOut > 0);
    if (!allPlayersCashedOut) {
      openModal('יש להזין סכום יציאה (Cash Out) עבור כל השחקנים.', 'alert');
      return;
    }

    openModal('האם ברצונך לחשב חובות ולסגור את המשחק? פעולה זו תשמור את המשחק.', 'confirm', async () => {
      const settlements = calculateSettlements(players.map(p => ({
        name: p.name,
        buyIn: p.buyIn,
        cashOut: p.cashOut,
        chipRatio: chipRatio, // העבר את יחס הצ'יפים לפונקציית החישוב
      })));
      setDebts(settlements);

      try {
        const cashGamesCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/cashGames`);
        await addDoc(cashGamesCollectionRef, {
          date: new Date(),
          players: players.map(p => ({
            name: p.name,
            buyIn: p.buyIn,
            cashOut: p.cashOut,
            chipsIn: p.chipsIn, // שמירת צ'יפים בכניסה
            chipsOut: p.chipsOut, // שמירת צ'יפים ביציאה
          })),
          chipsPerShekel: chipRatio,
          settlements: settlements,
          gameImages: gameImages, // שמירת תמונות כ-Base64
          gameType: 'Cash Game',
          userId: userId, // שמירת ה-userId של יוצר המשחק
        });
        openModal('המשחק נשמר בהצלחה!', 'alert', null, () => {
          closeModal();
          // איפוס המצב לאחר שמירה מוצלחת
          setPlayers([]);
          setChipRatio(1);
          setDebts([]);
          setGameImages([]);
          setNewPlayerName('');
          setNewPlayerBuyIn('');
        });
      } catch (e) {
        console.error("שגיאה בשמירת המשחק: ", e);
        openModal('שגיאה בשמירת המשחק. אנא נסה שוב.', 'alert');
      }
    }, closeModal); // כפתור ביטול של המודל
  };

  if (loadingAuth) {
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
        onConfirm={modalOnConfirm}
        onCancel={modalOnCancel}
        type={modalType}
      />

      <h2><FontAwesomeIcon icon={faCoins} /> ניהול משחק קאש</h2>
      <p className="page-description">נהל את הכניסות והיציאות של שחקנים וחשב התחשבנויות בסיום המשחק.</p>

      <div className="section chip-ratio-section">
        <h3><FontAwesomeIcon icon={faPercentage} /> יחס צ'יפים לשקל</h3>
        <div className="input-group">
          <label htmlFor="chipRatio">צ'יפים ל-1 ₪:</label>
          <input
            id="chipRatio"
            type="number"
            value={chipRatio}
            onChange={(e) => setChipRatio(parseFloat(e.target.value) || 1)}
            min="0.1"
            step="0.1"
          />
        </div>
      </div>

      <div className="section add-player-section">
        <h3><FontAwesomeIcon icon={faPlus} /> הוסף שחקן</h3>
        <form onSubmit={(e) => { e.preventDefault(); addPlayer(); }} className="add-player-form">
          <div className="player-input-group">
            <input
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              placeholder="שם שחקן"
            />
            <input
              type="number"
              value={newPlayerBuyIn}
              onChange={(e) => setNewPlayerBuyIn(e.target.value)}
              placeholder="כניסה ראשונית (₪)"
              min="0"
            />
            <button type="submit" className="add-player-button">
              <FontAwesomeIcon icon={faUsers} /> הוסף שחקן
            </button>
          </div>
        </form>

        {savedPlayers.length > 0 && (
          <div className="saved-players-dropdown">
            <label htmlFor="selectSavedPlayer">או בחר שחקן קיים:</label>
            <select
              id="selectSavedPlayer"
              onChange={(e) => addSavedPlayerToGame(e.target.value)}
              value="" // Reset select after selection
            >
              <option value="" disabled>בחר שחקן קבוע</option>
              {savedPlayers.map(player => (
                <option key={player.id} value={player.name}>{player.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {players.length > 0 && (
        <div className="section current-players-section">
          <h3><FontAwesomeIcon icon={faHandshake} /> שחקנים במשחק ({players.length})</h3>
          <div className="players-table-container">
            <table className="players-table">
              <thead>
                <tr>
                  <th>שם שחקן</th>
                  <th>כניסה (₪)</th>
                  <th>צ'יפים בכניסה</th> {/* עמודה חדשה */}
                  <th>יציאה (₪)</th>
                  <th>צ'יפים ביציאה</th> {/* עמודה חדשה */}
                  <th>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player, index) => (
                  <tr key={index}>
                    <td>{player.name}</td>
                    <td>
                      <input
                        type="number"
                        value={player.buyIn}
                        onChange={(e) => handleBuyInChange(index, e.target.value)}
                        min="0"
                      />
                    </td>
                    <td>{player.chipsIn.toFixed(2)}</td> {/* הצגת צ'יפים בכניסה */}
                    <td>
                      <input
                        type="number"
                        value={player.cashOut}
                        onChange={(e) => handleCashOutChange(index, e.target.value)}
                        min="0"
                        placeholder="סכום יציאה"
                      />
                    </td>
                    <td>{player.chipsOut.toFixed(2)}</td> {/* הצגת צ'יפים ביציאה */}
                    <td>
                      <button onClick={() => deletePlayer(index)} className="delete-player-button">
                        <FontAwesomeIcon icon={faTrashAlt} />
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
          ref={imageInputRef}
          style={{ display: 'none' }} // הסתר את האינפוט המקורי
        />
        <button onClick={() => imageInputRef.current.click()} className="upload-image-button">
          <FontAwesomeIcon icon={faUpload} /> בחר תמונות
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
            הערה: אלו החישובים המינימליים לתשלום חובות בין השחקנים.
          </p>
        </div>
      )}
    </div>
  );
}

export default CashGame;