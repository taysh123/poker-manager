import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus, faSave, faTimes, faEdit, faTrashAlt, faCoins, faUsers, faMoneyBillWave, faHandshake, faCheckCircle, faUpload, faCamera, faArrowRightArrowLeft, faChartBar } from '@fortawesome/free-solid-svg-icons';
import './CashGame.css';

// רכיב Modal פשוט להודעות אישור ושגיאה
const CustomModal = ({ message, onConfirm, onCancel, type }) => {
  if (!message) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content bg-gray-800 text-gray-100 rounded-xl p-6 shadow-2xl max-w-sm w-full mx-4">
        <p className="text-center text-lg">{message}</p>
        <div className="modal-actions mt-6 flex justify-around space-x-4">
          {type === 'confirm' && (
            <>
              <button onClick={onConfirm} className="modal-button confirm-button bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-full transition-colors duration-200">אישור</button>
              <button onClick={onCancel} className="modal-button cancel-button bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-full transition-colors duration-200">ביטול</button>
            </>
          )}
          {type === 'alert' && (
            <button onClick={onCancel} className="modal-button confirm-button bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full transition-colors duration-200 w-full">הבנתי</button>
          )}
        </div>
      </div>
    </div>
  );
};

// פונקציית עזר למציאת פתרון חובות אופטימלי
const calculateSettlements = (players) => {
  const settlements = [];
  const totalProfitLoss = players.reduce((sum, p) => sum + p.profitLoss, 0);

  // ודא שסך הרווחים וההפסדים הוא קרוב לאפס (עם טולרנס)
  if (Math.abs(totalProfitLoss) > 0.01) {
    console.warn(`Total profit/loss is not zero: ${totalProfitLoss}`);
  }

  const debtors = players.filter(p => p.profitLoss < 0).sort((a, b) => a.profitLoss - b.profitLoss);
  const creditors = players.filter(p => p.profitLoss > 0).sort((a, b) => b.profitLoss - a.profitLoss);

  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amountToSettle = Math.min(Math.abs(debtor.profitLoss), creditor.profitLoss);

    if (amountToSettle > 0.01) {
      settlements.push({
        debtor: debtor.name,
        creditor: creditor.name,
        amount: amountToSettle,
      });

      debtor.profitLoss += amountToSettle;
      creditor.profitLoss -= amountToSettle;
    }

    if (Math.abs(debtor.profitLoss) < 0.01) {
      debtorIndex++;
    }
    if (Math.abs(creditor.profitLoss) < 0.01) {
      creditorIndex++;
    }
  }

  return settlements;
};

const CashGame = () => {
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const navigate = useNavigate();

  const [standardBuyIn, setStandardBuyIn] = useState('');
  const [standardChips, setStandardChips] = useState('');
  const [chipsPerShekel, setChipsPerShekel] = useState('');
  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerBuyIn, setNewPlayerBuyIn] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showCalculations, setShowCalculations] = useState(false);
  const [settlements, setSettlements] = useState([]);
  const [modalMessage, setModalMessage] = useState(null);
  const [modalType, setModalType] = useState('alert');
  const [isGameSaved, setIsGameSaved] = useState(false);
  const [existingPlayers, setExistingPlayers] = useState([]);
  const [selectedExistingPlayer, setSelectedExistingPlayer] = useState('');
  const [images, setImages] = useState([]);
  const [newImageFile, setNewImageFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [modalAction, setModalAction] = useState(null);

  const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
  const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setUserId(currentUser.uid);
        setLoadingAuth(false);
        if (!currentUser.isAnonymous) {
          fetchExistingPlayers(currentUser.uid);
        }
      } else {
        await signInAnonymously(auth);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // עדכן את כמות הצ'יפים הסטנדרטית כאשר סכום הכניסה הסטנדרטי או יחס הצ'יפים משתנה
    if (standardBuyIn && chipsPerShekel) {
      setStandardChips(Number(standardBuyIn) * Number(chipsPerShekel));
    } else {
      setStandardChips('');
    }
  }, [standardBuyIn, chipsPerShekel]);

  const fetchExistingPlayers = async (currentUserId) => {
    try {
      const q = query(collection(db, `artifacts/${appId}/users/${currentUserId}/players`));
      const querySnapshot = await getDocs(q);
      const playersList = querySnapshot.docs.map(doc => doc.data().name);
      setExistingPlayers(playersList);
    } catch (error) {
      console.error("Error fetching existing players:", error);
    }
  };

  const showCustomModal = (message, type, action = null) => {
    setModalMessage(message);
    setModalType(type);
    if (action) {
      // Create a closure for the action to be called later
      setModalAction(() => action);
    } else {
      setModalAction(null);
    }
  };

  const closeModal = () => {
    setModalMessage(null);
    setModalType('alert');
    setModalAction(null);
  };
  
  const handleInputChange = (setter) => (e) => {
    let value = e.target.value;
    // הסר אפסים מובילים אם הערך אינו "0" עצמו
    if (value.length > 1 && value.startsWith('0')) {
      value = value.substring(1);
    }
    // ודא שהקלט הוא מספר או ריק
    if (value === '' || /^\d+(\.\d*)?$/.test(value)) {
      setter(value);
    }
  };

  const addPlayer = () => {
    if (newPlayerName && newPlayerBuyIn) {
      const newPlayer = {
        name: newPlayerName,
        buyIn: Number(newPlayerBuyIn),
        buyIns: [Number(newPlayerBuyIn)],
        cashOut: 0,
        chipsAdded: 0,
        isEditing: false,
        profitLoss: 0,
      };
      setPlayers([...players, newPlayer]);
      setNewPlayerName('');
      setNewPlayerBuyIn('');
    } else if (newPlayerName && standardBuyIn) {
      // הוסף שחקן עם כניסה סטנדרטית
      const newPlayer = {
        name: newPlayerName,
        buyIn: Number(standardBuyIn),
        buyIns: [Number(standardBuyIn)],
        cashOut: 0,
        chipsAdded: 0,
        isEditing: false,
        profitLoss: 0,
      };
      setPlayers([...players, newPlayer]);
      setNewPlayerName('');
    } else {
      showCustomModal('אנא הזן שם שחקן וסכום כניסה.', 'alert');
    }
  };

  const addExistingPlayer = () => {
    if (selectedExistingPlayer && !players.find(p => p.name === selectedExistingPlayer)) {
      const buyIn = standardBuyIn ? Number(standardBuyIn) : 0;
      const newPlayer = {
        name: selectedExistingPlayer,
        buyIn: buyIn,
        buyIns: [buyIn],
        cashOut: 0,
        chipsAdded: 0,
        isEditing: false,
        profitLoss: 0,
      };
      setPlayers([...players, newPlayer]);
      setSelectedExistingPlayer('');
    } else if (players.find(p => p.name === selectedExistingPlayer)) {
      showCustomModal('שחקן זה כבר נמצא במשחק.', 'alert');
    }
  };

  const addStandardBuyIn = (playerName) => {
    setPlayers(players.map(player => {
      if (player.name === playerName) {
        const newBuyIn = Number(player.buyIn) + Number(standardBuyIn);
        return {
          ...player,
          buyIn: newBuyIn,
          buyIns: [...player.buyIns, Number(standardBuyIn)],
        };
      }
      return player;
    }));
  };

  const handlePlayerValueChange = (index, field, value) => {
    const newPlayers = [...players];
    // הסר אפסים מובילים
    if (value.length > 1 && value.startsWith('0')) {
      value = value.substring(1);
    }
    // ודא שהקלט הוא מספר
    if (value === '' || /^\d+(\.\d*)?$/.test(value)) {
      newPlayers[index][field] = value;
      setPlayers(newPlayers);
    }
  };
  
  const toggleEditPlayer = (index) => {
    const newPlayers = [...players];
    newPlayers[index].isEditing = !newPlayers[index].isEditing;
    setPlayers(newPlayers);
  };
  
  const removePlayer = (index) => {
    const newPlayers = players.filter((_, i) => i !== index);
    setPlayers(newPlayers);
  };

  const toggleCalculations = () => {
    if (!chipsPerShekel) {
      showCustomModal('אנא הזן יחס צ\'יפים לשקל לפני ביצוע חישובים.', 'alert');
      return;
    }
    if (players.some(p => !p.buyIn || !p.cashOut)) {
      showCustomModal('אנא ודא שלכל השחקנים יש סכומי כניסה ויציאה.', 'alert');
      return;
    }

    const calculatedPlayers = players.map(p => ({
      ...p,
      profitLoss: (Number(p.cashOut) / Number(chipsPerShekel)) - Number(p.buyIn)
    }));
    setPlayers(calculatedPlayers);
    setSettlements(calculateSettlements(calculatedPlayers));
    setShowCalculations(true);
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        showCustomModal(`הקובץ ${file.name} גדול מדי (מעל 1MB).`, 'alert');
        setNewImageFile(null);
        return;
      }
      setNewImageFile(file);
    }
  };

  const handleUploadImage = async () => {
    if (!newImageFile || !userId || user.isAnonymous) {
      showCustomModal('בחר קובץ תמונה וודא שאתה מחובר.', 'alert');
      return;
    }

    setUploadingImage(true);
    const reader = new FileReader();
    reader.readAsDataURL(newImageFile);
    reader.onloadend = () => {
      setImages([...images, reader.result]);
      setNewImageFile(null);
      setUploadingImage(false);
      showCustomModal('התמונה הועלתה בהצלחה!', 'alert');
    };
    reader.onerror = () => {
      showCustomModal('שגיאה בקריאת קובץ התמונה.', 'alert');
      setUploadingImage(false);
    };
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
  };

  const saveGame = async () => {
    if (!user || user.isAnonymous) {
      showCustomModal('כניסת אורח אינה תומכת בשמירת משחקים. אנא התחבר/הרשם.', 'alert');
      return;
    }

    if (players.length === 0 || !chipsPerShekel) {
      showCustomModal('אנא הוסף שחקנים והגדר יחס צ\'יפים לפני השמירה.', 'alert');
      return;
    }

    try {
      const totalProfitLoss = players.reduce((sum, p) => sum + p.profitLoss, 0);

      const gameData = {
        gameType: 'Cash Game',
        date: serverTimestamp(),
        chipsPerShekel: Number(chipsPerShekel),
        players: players.map(p => ({
          name: p.name,
          buyIn: p.buyIn,
          cashOut: Number(p.cashOut),
          profitLoss: (Number(p.cashOut) / Number(chipsPerShekel)) - Number(p.buyIn)
        })),
        settlements,
        totalProfitLoss,
        userId: userId,
        images,
      };

      const gamesCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/cashGames`);
      await addDoc(gamesCollectionRef, gameData);

      // Save player names to a separate collection for future use
      const playersCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/players`);
      for (const player of players) {
        await setDoc(doc(playersCollectionRef, player.name), { name: player.name });
      }

      setIsGameSaved(true);
      showCustomModal('המשחק נשמר בהצלחה!', 'alert', () => navigate('/sessions'));
    } catch (error) {
      console.error('Error saving game:', error);
      showCustomModal('שגיאה בשמירת המשחק. אנא נסה שוב.', 'alert');
    }
  };

  if (loadingAuth) {
    return <div className="flex justify-center items-center h-screen bg-gray-900 text-white">טוען...</div>;
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-gray-100">
      <CustomModal message={modalMessage} onConfirm={modalAction} onCancel={closeModal} type={modalType} />
      
      <div className="container mx-auto p-4 md:p-8 flex-grow">
        
        {/* כותרת */}
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-8 text-yellow-500">
          <FontAwesomeIcon icon={faMoneyBillWave} className="mr-3" />
          משחק קאש חדש
        </h2>

        {/* טופס הגדרות כלליות */}
        <div className="bg-gray-800 rounded-xl p-6 md:p-8 shadow-lg mb-8 transition-all duration-300">
          <h3 className="text-2xl font-bold mb-4 text-center text-yellow-400">
            <FontAwesomeIcon icon={faCoins} className="mr-2" />
            הגדרות כלליות
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1">יחס צ'יפים לשקל:</label>
              <input
                type="text"
                className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                value={chipsPerShekel}
                onChange={handleInputChange(setChipsPerShekel)}
                placeholder="לדוגמה: 1, 2, 0.5"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">כניסה סטנדרטית (₪):</label>
              <input
                type="text"
                className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                value={standardBuyIn}
                onChange={handleInputChange(setStandardBuyIn)}
                placeholder="לדוגמה: 50"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">כניסה סטנדרטית (צ'יפים):</label>
              <input
                type="text"
                className="w-full bg-gray-700 text-gray-400 p-3 rounded-lg border border-gray-600 cursor-not-allowed"
                value={standardChips}
                readOnly
              />
            </div>
          </div>
        </div>

        {/* טופס הוספת שחקנים */}
        <div className="bg-gray-800 rounded-xl p-6 md:p-8 shadow-lg mb-8 transition-all duration-300">
          <h3 className="text-2xl font-bold mb-4 text-center text-yellow-400">
            <FontAwesomeIcon icon={faUsers} className="mr-2" />
            הוסף שחקנים
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="שם שחקן חדש"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
            />
            <div className="flex space-x-2">
              <input
                type="text"
                className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="כניסה ידנית (₪)"
                value={newPlayerBuyIn}
                onChange={handleInputChange(setNewPlayerBuyIn)}
              />
              <button onClick={addPlayer} className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-full transition-colors duration-200">
                <FontAwesomeIcon icon={faPlus} />
              </button>
            </div>
          </div>
          
          {existingPlayers.length > 0 && (
            <div className="flex flex-col md:flex-row gap-4">
              <select
                className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                value={selectedExistingPlayer}
                onChange={(e) => setSelectedExistingPlayer(e.target.value)}
              >
                <option value="">בחר שחקן קיים</option>
                {existingPlayers.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <button onClick={addExistingPlayer} className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full transition-colors duration-200">
                <FontAwesomeIcon icon={faPlus} />
              </button>
            </div>
          )}
        </div>
        
        {/* רשימת שחקנים וטופס עריכה */}
        {players.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-6 md:p-8 shadow-lg mb-8 transition-all duration-300">
            <h3 className="text-2xl font-bold mb-4 text-center text-yellow-400">
              <FontAwesomeIcon icon={faUsers} className="mr-2" />
              שחקנים במשחק
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-gray-700 rounded-lg shadow-inner">
                <thead>
                  <tr className="bg-gray-600 text-gray-200 uppercase text-sm leading-normal">
                    <th className="py-3 px-6 text-left">שם</th>
                    <th className="py-3 px-6 text-left">כניסות (₪)</th>
                    <th className="py-3 px-6 text-left">יציאה (צ'יפים)</th>
                    <th className="py-3 px-6 text-center">פעולות</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300 text-sm font-light">
                  {players.map((player, index) => (
                    <tr key={index} className="border-b border-gray-600 hover:bg-gray-600">
                      <td className="py-3 px-6 text-left whitespace-nowrap">{player.name}</td>
                      <td className="py-3 px-6 text-left">
                        {player.isEditing ? (
                          <input
                            type="text"
                            className="w-24 bg-gray-800 text-white p-1 rounded border border-gray-600 focus:outline-none"
                            value={player.buyIn}
                            onChange={(e) => handlePlayerValueChange(index, 'buyIn', e.target.value)}
                          />
                        ) : (
                          <div className="flex items-center">
                            <span className="mr-2">{player.buyIn} ₪</span>
                            {standardBuyIn && (
                              <button onClick={() => addStandardBuyIn(player.name)} className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 rounded-full transition-colors duration-200">
                                <FontAwesomeIcon icon={faPlus} /> {standardBuyIn} ₪
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-6 text-left">
                        {player.isEditing ? (
                          <input
                            type="text"
                            className="w-24 bg-gray-800 text-white p-1 rounded border border-gray-600 focus:outline-none"
                            value={player.cashOut}
                            onChange={(e) => handlePlayerValueChange(index, 'cashOut', e.target.value)}
                          />
                        ) : (
                          <span>{player.cashOut}</span>
                        )}
                      </td>
                      <td className="py-3 px-6 text-center">
                        <div className="flex item-center justify-center space-x-2">
                          <button onClick={() => toggleEditPlayer(index)} className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-full transition-colors duration-200">
                            <FontAwesomeIcon icon={player.isEditing ? faCheckCircle : faEdit} />
                          </button>
                          <button onClick={() => removePlayer(index)} className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition-colors duration-200">
                            <FontAwesomeIcon icon={faTrashAlt} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* בוטון חישוב */}
        {players.length > 0 && (
          <div className="flex justify-center mb-8">
            <button
              onClick={toggleCalculations}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full transition-colors duration-200 text-lg shadow-lg"
            >
              <FontAwesomeIcon icon={faChartBar} className="mr-2" />
              בצע חישובים
            </button>
          </div>
        )}

        {/* אזור תוצאות */}
        {showCalculations && (
          <div className="bg-gray-800 rounded-xl p-6 md:p-8 shadow-lg mb-8 transition-all duration-300">
            <h3 className="text-2xl font-bold mb-4 text-center text-yellow-400">
              <FontAwesomeIcon icon={faHandshake} className="mr-2" />
              תוצאות וסיכומים
            </h3>
            <div className="mb-6">
              <h4 className="text-xl font-bold mb-2 text-yellow-300">
                <FontAwesomeIcon icon={faUsers} className="mr-2" />
                רווח/הפסד לשחקן (₪)
              </h4>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {players.map((p, index) => (
                  <li key={index} className={`p-4 rounded-lg shadow-inner ${p.profitLoss >= 0 ? 'bg-green-800' : 'bg-red-800'}`}>
                    <span className="font-semibold">{p.name}:</span>
                    <span className="ml-2">
                      {p.profitLoss.toFixed(2)} ₪
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            
            {settlements.length > 0 && (
              <div>
                <h4 className="text-xl font-bold mb-2 text-yellow-300">
                  <FontAwesomeIcon icon={faArrowRightArrowLeft} className="mr-2" />
                  הסדר חובות
                </h4>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {settlements.map((s, index) => (
                    <li key={index} className="p-4 rounded-lg bg-gray-700 shadow-inner">
                      <span className="font-semibold text-gray-300">{s.debtor}</span> משלם ל-
                      <span className="font-semibold text-gray-300">{s.creditor}</span>:
                      <span className="ml-2 text-lg text-green-400">{s.amount.toFixed(2)} ₪</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* העלאת תמונות */}
        {!user.isAnonymous && (
          <div className="bg-gray-800 rounded-xl p-6 md:p-8 shadow-lg mb-8">
            <h3 className="text-2xl font-bold mb-4 text-center text-yellow-400">
              <FontAwesomeIcon icon={faCamera} className="mr-2" />
              הוסף תמונות למשחק
            </h3>
            <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-500 file:text-white hover:file:bg-yellow-600"
              />
              <button
                onClick={handleUploadImage}
                disabled={!newImageFile || uploadingImage}
                className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-full transition-colors duration-200 disabled:opacity-50"
              >
                {uploadingImage ? 'מעלה...' : 'העלה תמונה'}
              </button>
            </div>
            
            {images.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img src={image} alt={`Game image ${index}`} className="w-full h-auto rounded-lg shadow-md" />
                    <button onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* כפתור שמירה */}
        {showCalculations && (
          <div className="flex justify-center mt-8">
            <button
              onClick={saveGame}
              disabled={isGameSaved}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-12 rounded-full transition-colors duration-200 text-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FontAwesomeIcon icon={faSave} className="mr-3" />
              {isGameSaved ? 'נשמר בהצלחה!' : 'שמור משחק'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default CashGame;
