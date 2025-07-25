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

// פונקציית עזר לחישוב חובות
function calculateDebts(players) {
  const gains = {};
  const losses = {};
  const debts = [];

  // 1. קבע רווח/הפסד של כל שחקן
  players.forEach(p => {
    const profit = p.cashOut - p.totalBuyIn;
    if (profit > 0) {
      gains[p.name] = profit;
    } else if (profit < 0) {
      losses[p.name] = -profit;
    }
  });

  const gainers = Object.entries(gains).sort(([, a], [, b]) => b - a);
  const losers = Object.entries(losses).sort(([, a], [, b]) => b - a);

  let gIndex = 0;
  let lIndex = 0;

  while (gIndex < gainers.length && lIndex < losers.length) {
    const [gainerName, gainerAmount] = gainers[gIndex];
    const [loserName, loserAmount] = losers[lIndex];

    const settlementAmount = Math.min(gainerAmount, loserAmount);

    if (settlementAmount > 0.01) { // Only add if amount is significant
      debts.push({
        debtor: loserName,
        creditor: gainerName,
        amount: settlementAmount
      });
    }

    gainers[gIndex][1] -= settlementAmount;
    losers[lIndex][1] -= settlementAmount;

    if (gainers[gIndex][1] <= 0.01) gIndex++;
    if (losers[lIndex][1] <= 0.01) lIndex++;
  }

  return debts;
}


function CashGame() {
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const navigate = useNavigate();

  const [chipRatio, setChipRatio] = useState(1);
  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerBuyIn, setNewPlayerBuyIn] = useState('');
  const [debts, setDebts] = useState([]);
  const [savedPlayers, setSavedPlayers] = useState([]);
  const [gameImages, setGameImages] = useState([]); // לשמירת תמונות מקודדות ב-Base64
  const imageInputRef = useRef(null); // Ref עבור אלמנט ה-input file
  const [modalMessage, setModalMessage] = useState(null);
  const [modalType, setModalType] = useState('alert');
  const [showConfirmSaveModal, setShowConfirmSaveModal] = useState(false);

  const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

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
          setModalMessage('כניסת אורח אינה תומכת בשמירת שחקנים קבועים או משחקים. אנא התחבר/הרשם.');
          setModalType('alert');
        }
      } else {
        navigate('/');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const fetchSavedPlayers = async (currentUserId) => {
    try {
      const playersCollectionRef = collection(db, `artifacts/${appId}/users/${currentUserId}/players`);
      const querySnapshot = await getDocs(playersCollectionRef);
      const playersList = querySnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
      setSavedPlayers(playersList);
    } catch (error) {
      console.error("שגיאה בטעינת שחקנים קבועים:", error);
      setModalMessage('שגיאה בטעינת שחקנים קבועים. נסה לרענן את הדף.');
      setModalType('alert');
    }
  };

  const addPlayer = () => {
    const name = newPlayerName.trim();
    const buyIn = parseFloat(newPlayerBuyIn);

    if (!name || isNaN(buyIn) || buyIn <= 0) {
      setModalMessage('יש להזין שם שחקן וסכום כניסה תקין.');
      setModalType('alert');
      return;
    }
    if (players.some(p => p.name === name)) {
      setModalMessage('שם השחקן כבר קיים ברשימה.');
      setModalType('alert');
      return;
    }
    setPlayers([...players, { name, buyIns: [buyIn], totalBuyIn: buyIn, cashOut: 0, chipRatio: chipRatio }]);
    setNewPlayerName('');
    setNewPlayerBuyIn('');
  };

  const addSavedPlayerToGame = (playerName) => {
    if (players.some(p => p.name === playerName)) {
      setModalMessage('שחקן זה כבר נמצא במשחק.');
      setModalType('alert');
      return;
    }
    setPlayers([...players, { name: playerName, buyIns: [0], totalBuyIn: 0, cashOut: 0, chipRatio: chipRatio }]);
    setModalMessage(`השחקן ${playerName} נוסף למשחק.`);
    setModalType('alert');
  };

  const handleBuyInChange = (index, value) => {
    const updatedPlayers = [...players];
    const newBuyIn = parseFloat(value);
    if (!isNaN(newBuyIn) && newBuyIn >= 0) {
      updatedPlayers[index].buyIns = [newBuyIn]; // נניח שרק כניסה אחת מוצגת כאן
      updatedPlayers[index].totalBuyIn = newBuyIn;
      setPlayers(updatedPlayers);
    }
  };

  const handleCashOutChange = (index, value) => {
    const updatedPlayers = [...players];
    const newCashOut = parseFloat(value);
    if (!isNaN(newCashOut) && newCashOut >= 0) {
      updatedPlayers[index].cashOut = newCashOut;
      setPlayers(updatedPlayers);
    }
  };

  const deletePlayer = (indexToDelete) => {
    setPlayers(players.filter((_, index) => index !== indexToDelete));
    setDebts([]); // איפוס חובות כששחקן נמחק
  };

  const handleCalculateAndSave = () => {
    if (players.length === 0) {
      setModalMessage('אין שחקנים במשחק כדי לחשב חובות.');
      setModalType('alert');
      return;
    }
    if (user && user.isAnonymous) {
      setModalMessage('כניסת אורח אינה תומכת בשמירת משחקים. אנא התחבר/הרשם.');
      setModalType('alert');
      return;
    }

    setShowConfirmSaveModal(true);
    setModalMessage('האם ברצונך לחשב חובות ולסגור את המשחק? פעולה זו תשמור את המשחק.');
    setModalType('confirm');
  };

  const confirmSaveGame = async () => {
    setShowConfirmSaveModal(false);
    const calculatedDebts = calculateDebts(players);
    setDebts(calculatedDebts);

    try {
      const gamesCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/cashGames`);
      await addDoc(gamesCollectionRef, {
        date: new Date(),
        chipsPerShekel: chipRatio,
        players: players.map(p => ({
          name: p.name,
          buyIn: p.totalBuyIn,
          cashOut: p.cashOut,
          chipRatio: p.chipRatio
        })),
        debts: calculatedDebts.map(d => ({
          debtor: d.debtor,
          creditor: d.creditor,
          amount: d.amount
        })),
        gameImages: gameImages, // שמירת תמונות
      });
      setModalMessage('המשחק נשמר בהצלחה!');
      setModalType('alert');
      // ניתן לאפס את המצב כאן או לנתב לדף אחר
      setPlayers([]);
      setNewPlayerName('');
      setNewPlayerBuyIn('');
      setDebts([]);
      setGameImages([]);
    } catch (error) {
      console.error("שגיאה בשמירת המשחק:", error);
      setModalMessage('שגיאה בשמירת המשחק. נסה שוב.');
      setModalType('alert');
    }
  };

  const cancelSaveGame = () => {
    setShowConfirmSaveModal(false);
    setModalMessage(null);
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    files.forEach(file => {
      if (file.size > 1024 * 1024) { // 1MB limit
        setModalMessage(`הקובץ ${file.name} גדול מדי (מעל 1MB).`);
        setModalType('alert');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setGameImages(prevImages => [...prevImages, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (indexToRemove) => {
    setGameImages(prevImages => prevImages.filter((_, index) => index !== indexToRemove));
  };

  const closeModal = () => {
    setModalMessage(null);
    setModalType('alert'); // Reset to alert type for general messages
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
      <h2><FontAwesomeIcon icon={faCoins} /> ניהול משחק קאש</h2>
      <p className="text-center text-gray-600 mb-8">
        נהל את הכניסות, היציאות והחובות בין השחקנים במשחק הקאש שלך.
      </p>

      <div className="section chip-ratio-section">
        <h3><FontAwesomeIcon icon={faWallet} /> יחס צ'יפים לכסף אמיתי</h3>
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
        <h3><FontAwesomeIcon icon={faUsers} /> הוסף שחקנים למשחק</h3>
        <form onSubmit={(e) => { e.preventDefault(); addPlayer(); }} className="add-player-form">
          <div className="player-input-group">
            <input
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              placeholder="שם שחקן חדש"
            />
            <input
              type="number"
              value={newPlayerBuyIn}
              onChange={(e) => setNewPlayerBuyIn(e.target.value)}
              placeholder="כניסה ראשונית (₪)"
              min="0"
            />
            <button type="submit">
              <FontAwesomeIcon icon={faPlus} /> הוסף שחקן
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
        <div className="section players-in-game-section">
          <h3><FontAwesomeIcon icon={faHandshake} /> שחקנים במשחק ({players.length})</h3>
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
                    <td>
                      <input
                        type="number"
                        value={player.totalBuyIn}
                        onChange={(e) => handleBuyInChange(index, e.target.value)}
                        min="0"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={player.cashOut}
                        onChange={(e) => handleCashOutChange(index, e.target.value)}
                        min="0"
                      />
                    </td>
                    <td>
                      <button onClick={() => deletePlayer(index)} className="delete-btn">
                        <FontAwesomeIcon icon={faTimes} />
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
        <h3><FontAwesomeIcon icon={faCamera} /> הוסף תמונות מהמשחק</h3>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          ref={imageInputRef}
          style={{ display: 'none' }} // הסתר את האינפוט המקורי
        />
        <button onClick={() => imageInputRef.current.click()} className="upload-button">
          <FontAwesomeIcon icon={faUpload} /> בחר תמונות
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
            * החישוב מבוסס על יחס הצ'יפים הנוכחי ונועד לפשט את החובות בין שחקנים.
          </p>
        </div>
      )}
      <CustomModal
        message={modalMessage}
        onConfirm={showConfirmSaveModal ? confirmSaveGame : closeModal}
        onCancel={showConfirmSaveModal ? cancelSaveGame : closeModal}
        type={modalType}
      />
    </div>
  );
}

export default CashGame;
