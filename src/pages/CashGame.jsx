import React, { useEffect, useState, useRef } from 'react';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoins, faUsers, faPlus, faTimes, faHandshake, faExchangeAlt, faPercentage, faWallet, faCamera, faUpload } from '@fortawesome/free-solid-svg-icons';
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

// פונקציית עזר לחישוב חובות בצורה מפושטת
function calculateDebts(players) {
  const netAmounts = {}; // { playerName: netProfitLoss }

  // 1. קבע רווח/הפסד נקי של כל שחקן
  players.forEach(p => {
    netAmounts[p.name] = (netAmounts[p.name] || 0) + (p.cashOut - p.totalBuyIn);
  });

  const gainers = []; // שחקנים שצריכים לקבל כסף
  const losers = [];  // שחקנים שצריכים לשלם כסף

  for (const name in netAmounts) {
    if (netAmounts[name] > 0) {
      gainers.push({ name, amount: netAmounts[name] });
    } else if (netAmounts[name] < 0) {
      losers.push({ name, amount: -netAmounts[name] }); // שמור כערך חיובי
    }
  }

  // מיין את המרוויחים והמפסידים כדי להתחיל עם הסכומים הגדולים ביותר
  gainers.sort((a, b) => b.amount - a.amount);
  losers.sort((a, b) => b.amount - a.amount);

  const debts = [];

  let gIndex = 0;
  let lIndex = 0;

  while (gIndex < gainers.length && lIndex < losers.length) {
    const gainer = gainers[gIndex];
    const loser = losers[lIndex];

    const settlementAmount = Math.min(gainer.amount, loser.amount);

    if (settlementAmount > 0.01) { // הימנע מחובות זניחים
      debts.push({
        debtor: loser.name,
        creditor: gainer.name,
        amount: settlementAmount
      });

      gainer.amount -= settlementAmount;
      loser.amount -= settlementAmount;
    }

    if (gainer.amount <= 0.01) {
      gIndex++;
    }
    if (loser.amount <= 0.01) {
      lIndex++;
    }
  }

  return debts;
}

function CashGame() {
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null); // מצב לשמירת ה-userId
  const [loadingAuth, setLoadingAuth] = useState(true);
  const navigate = useNavigate();

  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerBuyIn, setNewPlayerBuyIn] = useState('');
  const [chipsPerShekel, setChipsPerShekel] = useState('');
  const [gameImages, setGameImages] = useState([]);
  const fileInputRef = useRef(null);

  const [debts, setDebts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('alert');
  const [modalAction, setModalAction] = useState(null);

  // useEffect לאימות משתמש וטעינת שחקנים קבועים
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setUserId(currentUser.uid); // שמור את ה-UID
        if (!currentUser.isAnonymous) {
          await fetchRegularPlayers(currentUser.uid);
        } else {
          // אם משתמש אנונימי, אולי נרצה להציג הודעה או להגביל פונקציונליות
          console.log("משתמש אנונימי מחובר. לא נטענים שחקנים קבועים.");
        }
      } else {
        navigate('/');
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  // פונקציה לטעינת שחקנים קבועים מ-Firestore
  const fetchRegularPlayers = async (currentUserId) => {
    if (!currentUserId) {
      console.warn("אין User ID, לא ניתן לטעון שחקנים קבועים.");
      return;
    }
    try {
      const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
      const playersCollectionRef = collection(db, `artifacts/${appId}/users/${currentUserId}/players`);
      const playerSnapshot = await getDocs(playersCollectionRef);
      const regularPlayers = playerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // הוסף שחקנים קבועים כברירת מחדל עם buyIn ו-cashOut אפס
      const initialPlayers = regularPlayers.map(p => ({
        id: p.id,
        name: p.name,
        buyIn: 0,
        cashOut: 0,
        totalBuyIn: 0 // כדי לעקוב אחרי סך הכניסות במשחק אחד
      }));
      setPlayers(initialPlayers);
    } catch (error) {
      console.error("שגיאה בטעינת שחקנים קבועים:", error);
      // ניתן להציג הודעת שגיאה למשתמש
      openModal("שגיאה בטעינת שחקנים קבועים: " + error.message, 'alert');
    }
  };

  const openModal = (message, type, action = null) => {
    setModalMessage(message);
    setModalType(type);
    setModalAction(() => action); // שמור את הפעולה כפונקציה
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalMessage('');
    setModalType('alert');
    setModalAction(null);
  };

  const handleAddPlayer = () => {
    if (newPlayerName.trim() === '' || isNaN(parseFloat(newPlayerBuyIn))) {
      openModal('אנא הזן שם שחקן וסכום כניסה חוקי.', 'alert');
      return;
    }
    if (players.some(p => p.name === newPlayerName.trim())) {
      openModal('שחקן בשם זה כבר קיים במשחק.', 'alert');
      return;
    }

    const buyInAmount = parseFloat(newPlayerBuyIn);
    setPlayers([...players, {
      id: Date.now().toString(), // ID זמני עבור הרשימה המקומית
      name: newPlayerName.trim(),
      buyIn: buyInAmount,
      cashOut: 0, // מתחילים עם 0 כסף ביציאה
      totalBuyIn: buyInAmount // סך הכניסות הראשוני הוא הכניסה הנוכחית
    }]);
    setNewPlayerName('');
    setNewPlayerBuyIn('');
  };

  const handleUpdatePlayerBuyIn = (id, value) => {
    const updatedPlayers = players.map(p => {
      if (p.id === id) {
        const newBuyIn = parseFloat(value) || 0;
        return { ...p, buyIn: newBuyIn, totalBuyIn: newBuyIn }; // מעדכן גם את totalBuyIn
      }
      return p;
    });
    setPlayers(updatedPlayers);
  };

  const handleUpdatePlayerCashOut = (id, value) => {
    const updatedPlayers = players.map(p => {
      if (p.id === id) {
        return { ...p, cashOut: parseFloat(value) || 0 };
      }
      return p;
    });
    setPlayers(updatedPlayers);
  };

  const handleDeletePlayer = (id) => {
    openModal('האם אתה בטוח שברצונך למחוק שחקן זה מהמשחק הנוכחי?', 'confirm', () => {
      setPlayers(players.filter(p => p.id !== id));
      closeModal();
    });
  };

  const handleAddRebuy = (id) => {
    openModal('האם אתה בטוח שברצונך להוסיף Re-Buy לשחקן זה?', 'confirm', () => {
      const rebuyAmount = parseFloat(prompt('הכנס סכום Re-Buy:')) || 0;
      if (rebuyAmount > 0) {
        const updatedPlayers = players.map(p => {
          if (p.id === id) {
            return { ...p, buyIn: p.buyIn + rebuyAmount, totalBuyIn: p.totalBuyIn + rebuyAmount };
          }
          return p;
        });
        setPlayers(updatedPlayers);
      }
      closeModal();
    });
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    const newImages = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newImages.push(reader.result);
        if (newImages.length === files.length) {
          setGameImages(prevImages => [...prevImages, ...newImages]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (indexToRemove) => {
    setGameImages(prevImages => prevImages.filter((_, index) => index !== indexToRemove));
  };

  const handleCalculateAndSave = async () => {
    if (players.length === 0) {
      openModal('אנא הוסף שחקנים למשחק לפני החישוב.', 'alert');
      return;
    }
    if (isNaN(parseFloat(chipsPerShekel)) || parseFloat(chipsPerShekel) <= 0) {
      openModal('אנא הזן יחס צ\'יפים לשקל חוקי (חייב להיות מספר חיובי).', 'alert');
      return;
    }

    const allPlayersHaveCashOut = players.every(p => !isNaN(p.cashOut) && p.cashOut >= 0);
    if (!allPlayersHaveCashOut) {
      openModal('אנא ודא שכל השחקנים הזינו סכום יציאה חוקי (מספר חיובי או אפס).', 'alert');
      return;
    }

    // חישוב חובות
    const calculatedDebts = calculateDebts(players);
    setDebts(calculatedDebts);

    // שמירת המשחק ב-Firestore
    if (user && userId) {
      try {
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        const sessionsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/sessions`);
        await addDoc(sessionsCollectionRef, {
          date: new Date(),
          players: players.map(p => ({
            name: p.name,
            buyIn: p.buyIn,
            cashOut: p.cashOut,
            totalBuyIn: p.totalBuyIn // שמור את סך הכניסות
          })),
          chipsPerShekel: parseFloat(chipsPerShekel),
          debts: calculatedDebts,
          gameImages: gameImages // שמור תמונות כ-Base64
        });
        openModal('המשחק נשמר בהצלחה! החובות חושבו.', 'alert', () => navigate('/sessions'));
      } catch (error) {
        console.error("שגיאה בשמירת המשחק:", error);
        openModal("שגיאה בשמירת המשחק: " + error.message, 'alert');
      }
    } else {
      openModal('שגיאה: משתמש לא מאומת. לא ניתן לשמור את המשחק.', 'alert');
    }
  };

  if (loadingAuth) {
    return (
      <div className="cash-game-container">
        <h2>טוען...</h2>
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

      <h2><FontAwesomeIcon icon={faCoins} /> ניהול משחק קאש</h2>
      <p className="text-center text-gray-600 mb-8">
        הזן את פרטי השחקנים, הכניסות והיציאות שלהם כדי לחשב רווחים וחובות.
      </p>

      <div className="section chips-ratio-section">
        <h3><FontAwesomeIcon icon={faWallet} /> יחס צ'יפים לשקל</h3>
        <input
          type="number"
          value={chipsPerShekel}
          onChange={(e) => setChipsPerShekel(e.target.value)}
          placeholder="יחס צ'יפים לשקל (לדוגמה: 100)"
          min="0.01"
          step="0.01"
        />
      </div>

      <div className="section add-player-section">
        <h3><FontAwesomeIcon icon={faUsers} /> הוסף שחקן למשחק</h3>
        <div className="add-player-form">
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
            step="0.01"
          />
          <button onClick={handleAddPlayer}>
            <FontAwesomeIcon icon={faPlus} /> הוסף
          </button>
        </div>
      </div>

      {players.length === 0 ? (
        <p style={{ textAlign: 'center' }}>אין שחקנים במשחק. הוסף שחקנים כדי להתחיל!</p>
      ) : (
        <div className="section players-in-game-section">
          <h3><FontAwesomeIcon icon={faHandshake} /> שחקנים במשחק ({players.length})</h3>
          <div className="players-table-container">
            <table className="players-table">
              <thead>
                <tr>
                  <th>שם שחקן</th>
                  <th>כניסה (₪)</th>
                  <th>יציאה (₪)</th>
                  <th>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {players.map(player => (
                  <tr key={player.id}>
                    <td>{player.name}</td>
                    <td>
                      <input
                        type="number"
                        value={player.buyIn}
                        onChange={(e) => handleUpdatePlayerBuyIn(player.id, e.target.value)}
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={player.cashOut}
                        onChange={(e) => handleUpdatePlayerCashOut(player.id, e.target.value)}
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td className="player-actions">
                      <button onClick={() => handleAddRebuy(player.id)} className="rebuy-btn">
                        <FontAwesomeIcon icon={faPlus} /> Re-Buy
                      </button>
                      <button onClick={() => handleDeletePlayer(player.id)} className="delete-btn">
                        <FontAwesomeIcon icon={faTimes} /> מחק
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
        <h3><FontAwesomeIcon icon={faCamera} /> תמונות מהמשחק (אופציונלי)</h3>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          ref={fileInputRef}
          style={{ display: 'none' }} // הסתר את האינפוט המקורי
        />
        <button onClick={() => fileInputRef.current.click()} className="upload-button">
          <FontAwesomeIcon icon={faUpload} /> העלה תמונות
        </button>
        <div className="image-preview-grid">
          {gameImages.map((image, index) => (
            <div key={index} className="image-preview-item">
              <img src={image} alt={`Game ${index + 1}`} />
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
            הערה: החובות מחושבים כדי למזער את מספר ההעברות הנדרשות.
          </p>
        </div>
      )}
    </div>
  );
}

export default CashGame;