import React, { useEffect, useState, useRef } from 'react';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore'; // הוספת doc, updateDoc, deleteDoc
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoins, faUsers, faPlus, faTimes, faHandshake, faExchangeAlt, faPercentage, faWallet, faCamera, faUpload, faTrashAlt } from '@fortawesome/free-solid-svg-icons'; // הוספת faTrashAlt
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

  const [chipRatio, setChipRatio] = useState(1);
  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerBuyIn, setNewPlayerBuyIn] = useState('');
  const [newPlayerCashOut, setNewPlayerCashOut] = useState('');
  const [debts, setDebts] = useState([]);
  const [gameImages, setGameImages] = useState([]);
  const imageInputRef = useRef(null);

  // מצבי Modal
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('alert'); // 'alert' or 'confirm'
  const [modalAction, setModalAction] = useState(null); // פונקציה שתופעל באישור המודאל

  // פונקציה להצגת מודאל
  const openModal = (message, type = 'alert', action = null) => {
    setModalMessage(message);
    setModalType(type);
    setModalAction(() => action); // שמור את הפונקציה בתוך פונקציה כדי למנוע קריאה מיידית
    setShowModal(true);
  };

  // פונקציה לטיפול באישור מודאל
  const handleModalConfirm = () => {
    if (modalAction) {
      modalAction(); // הפעל את הפונקציה שנשמרה
    }
    setShowModal(false);
    setModalAction(null);
    setModalMessage('');
  };

  // פונקציה לטיפול בביטול מודאל
  const handleModalCancel = () => {
    setShowModal(false);
    setModalAction(null);
    setModalMessage('');
  };

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setUserId(currentUser.uid);
        setLoadingAuth(false);
      } else {
        navigate('/');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // פונקציה לטיפול בשינוי קלט מספרי
  const handleNumericInputChange = (setter) => (e) => {
    const value = e.target.value;
    // מאפשר רק מספרים (כולל עשרוניים) וריק
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setter(value);
    }
  };

  const addPlayer = () => {
    if (!user) {
      openModal('יש להתחבר כדי להוסיף שחקנים.', 'alert');
      return;
    }

    const name = newPlayerName.trim();
    const buyIn = parseFloat(newPlayerBuyIn);
    const cashOut = parseFloat(newPlayerCashOut);

    if (!name || isNaN(buyIn) || buyIn < 0 || isNaN(cashOut) || cashOut < 0) {
      openModal('יש להזין שם שחקן, כניסה ויציאה תקינים (מספרים חיוביים).', 'alert');
      return;
    }

    if (players.some(p => p.name === name)) {
      openModal('שם השחקן כבר קיים ברשימה.', 'alert');
      return;
    }

    setPlayers([...players, { name, buyIn, cashOut }]);
    setNewPlayerName('');
    setNewPlayerBuyIn('');
    setNewPlayerCashOut('');
  };

  const updatePlayer = (index, field, value) => {
    const updatedPlayers = [...players];
    updatedPlayers[index][field] = value;
    setPlayers(updatedPlayers);
  };

  const deletePlayer = (indexToDelete) => {
    openModal(
      `האם אתה בטוח שברצונך למחוק את השחקן ${players[indexToDelete].name}?`,
      'confirm',
      () => setPlayers(players.filter((_, index) => index !== indexToDelete))
    );
  };

  const calculateDebts = () => {
    if (players.length === 0) {
      setDebts([]);
      return;
    }

    const profits = players.map(p => ({
      name: p.name,
      amount: (p.cashOut * chipRatio) - p.buyIn,
    }));

    const debtors = profits.filter(p => p.amount < 0).map(p => ({ ...p, amount: -p.amount }));
    const creditors = profits.filter(p => p.amount > 0);

    const newDebts = [];
    let i = 0, j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];

      const payment = Math.min(debtor.amount, creditor.amount);

      newDebts.push({
        debtor: debtor.name,
        creditor: creditor.name,
        amount: payment,
      });

      debtor.amount -= payment;
      creditor.amount -= payment;

      if (debtor.amount <= 0.001) i++;
      if (creditor.amount <= 0.001) j++;
    }
    setDebts(newDebts);
  };

  useEffect(() => {
    calculateDebts(); // חשב חובות מחדש בכל שינוי בשחקנים או ביחס צ'יפים
  }, [players, chipRatio]);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit
        openModal('גודל התמונה חורג מהמגבלה (1MB). אנא בחר תמונה קטנה יותר.', 'alert');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setGameImages(prevImages => [...prevImages, reader.result]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    openModal(
      'האם אתה בטוח שברצונך למחוק תמונה זו?',
      'confirm',
      () => setGameImages(prevImages => prevImages.filter((_, index) => index !== indexToRemove))
    );
  };

  const handleCalculateAndSave = async () => {
    if (!user) {
      openModal('יש להתחבר כדי לשמור משחקים.', 'alert');
      return;
    }
    if (players.length === 0) {
      openModal('אין שחקנים במשחק. אנא הוסף שחקנים לפני השמירה.', 'alert');
      return;
    }

    openModal(
      'האם אתה בטוח שברצונך לסיים ולשמור את המשחק?',
      'confirm',
      async () => {
        try {
          // Calculate final profit/loss for each player
          const playersWithProfitLoss = players.map(p => ({
            ...p,
            profitLoss: (p.cashOut * chipRatio) - p.buyIn
          }));

          const gameData = {
            userId: userId,
            date: new Date(),
            gameType: 'Cash Game',
            chipsPerShekel: parseFloat(chipRatio),
            players: playersWithProfitLoss,
            settlements: debts, // Save the calculated debts
            images: gameImages, // Save image data
          };

          const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
          await addDoc(collection(db, `artifacts/${appId}/users/${userId}/cashGames`), gameData);

          openModal('המשחק נשמר בהצלחה!', 'alert', () => {
            // איפוס המצב לאחר שמירה מוצלחת
            setChipRatio(1);
            setPlayers([]);
            setNewPlayerName('');
            setNewPlayerBuyIn('');
            setNewPlayerCashOut('');
            setDebts([]);
            setGameImages([]);
            navigate('/sessions'); // ניווט לדף הסשנים
          });

        } catch (e) {
          console.error("שגיאה בשמירת המשחק: ", e);
          openModal(`שגיאה בשמירת המשחק: ${e.message}`, 'alert');
        }
      }
    );
  };

  if (loadingAuth) {
    return (
      <div className="cash-game-container">
        <p style={{ textAlign: 'center' }}>טוען נתוני משתמש...</p>
      </div>
    );
  }

  return (
    <div className="cash-game-container">
      <h2><FontAwesomeIcon icon={faCoins} /> ניהול משחק קאש</h2>

      <div className="section chip-ratio-section">
        <h3><FontAwesomeIcon icon={faWallet} /> יחס צ'יפים לשקל</h3>
        <div className="input-group">
          <label htmlFor="chipRatio">כמה שקלים שווה כל צ'יפ?</label>
          <input
            id="chipRatio"
            type="number"
            value={chipRatio}
            onChange={handleNumericInputChange(setChipRatio)}
            min="0.01"
            step="0.01"
            placeholder="לדוגמה: 1"
          />
        </div>
      </div>

      <div className="section players-section">
        <h3><FontAwesomeIcon icon={faUsers} /> הוספת שחקן</h3>
        <form onSubmit={(e) => { e.preventDefault(); addPlayer(); }} className="add-player-form">
          <div className="player-input-group">
            <input
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              placeholder="שם שחקן"
              required
            />
            <input
              type="number"
              value={newPlayerBuyIn}
              onChange={handleNumericInputChange(setNewPlayerBuyIn)}
              placeholder="כניסה (₪)"
              min="0"
              required
            />
            <input
              type="number"
              value={newPlayerCashOut}
              onChange={handleNumericInputChange(setNewPlayerCashOut)}
              placeholder="יציאה (צ'יפים)"
              min="0"
              required
            />
          </div>
          <button type="submit">
            <FontAwesomeIcon icon={faPlus} /> הוסף שחקן
          </button>
        </form>

        {players.length > 0 && (
          <div className="players-table-container">
            <table className="players-table">
              <thead>
                <tr>
                  <th>שם שחקן</th>
                  <th>כניסה (₪)</th>
                  <th>יציאה (צ'יפים)</th>
                  <th>יציאה (₪)</th>
                  <th>רווח/הפסד (₪)</th>
                  <th>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        type="text"
                        value={player.name}
                        onChange={(e) => updatePlayer(index, 'name', e.target.value)}
                        className="table-input"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={player.buyIn}
                        onChange={handleNumericInputChange((val) => updatePlayer(index, 'buyIn', parseFloat(val)))}
                        className="table-input"
                        min="0"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={player.cashOut}
                        onChange={handleNumericInputChange((val) => updatePlayer(index, 'cashOut', parseFloat(val)))}
                        className="table-input"
                        min="0"
                      />
                    </td>
                    <td>{(player.cashOut * chipRatio).toFixed(2)}</td>
                    <td className={((player.cashOut * chipRatio) - player.buyIn) >= 0 ? 'text-green' : 'text-red'}>
                      {((player.cashOut * chipRatio) - player.buyIn).toFixed(2)}
                    </td>
                    <td>
                      <button onClick={() => deletePlayer(index)} className="delete-btn">
                        <FontAwesomeIcon icon={faTrashAlt} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="section image-upload-section">
        <h3><FontAwesomeIcon icon={faCamera} /> תמונות מהמשחק</h3>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          ref={imageInputRef}
          style={{ display: 'none' }} // הסתר את קלט הקבצים המקורי
        />
        <button onClick={() => imageInputRef.current.click()} className="upload-button">
          <FontAwesomeIcon icon={faUpload} /> בחר תמונה
        </button>
        <div className="image-preview-container">
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
            <FontAwesomeIcon icon={faHandshake} /> וודא שכל החובות נסגרים בסיום המשחק.
          </p>
        </div>
      )}

      {/* רכיב המודאל */}
      <CustomModal
        message={modalMessage}
        onConfirm={handleModalConfirm}
        onCancel={handleModalCancel}
        type={modalType}
      />
    </div>
  );
}

export default CashGame;