import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHistory, faCalendarAlt, faCoins, faUsers, faCamera, faTimes, faTrashAlt, faChartBar, faUser, faMoneyBillWave, faArrowRightArrowLeft, faEuroSign, faShekelSign } from '@fortawesome/free-solid-svg-icons';
import './Sessions.css';

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

function Sessions() {
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const navigate = useNavigate();

  const [cashGames, setCashGames] = useState([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [errorGames, setErrorGames] = useState(null);
  const [modalMessage, setModalMessage] = useState(null);
  const [modalType, setModalType] = useState('alert');
  const [confirmDeleteGameId, setConfirmDeleteGameId] = useState(null);

  const [playerStats, setPlayerStats] = useState({});

  const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
  const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setUserId(currentUser.uid);
        setLoadingAuth(false);
        if (!currentUser.isAnonymous) {
          fetchCashGames(currentUser.uid);
        } else {
          setLoadingGames(false);
          setErrorGames('משחקים שמורים אינם זמינים למשתמשי אורח. אנא התחבר/הרשם.');
        }
      } else {
        navigate('/');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const fetchCashGames = async (currentUserId) => {
    setLoadingGames(true);
    setErrorGames(null);
    try {
      const gamesCollectionRef = collection(db, `artifacts/${appId}/users/${currentUserId}/cashGames`);
      const q = query(gamesCollectionRef);
      const querySnapshot = await getDocs(q);
      const gamesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // נבצע את המיון בזיכרון במקום ב-Firestore כדי למנוע צורך באינדקסים
      const sortedGames = gamesList.sort((a, b) => b.date.seconds - a.date.seconds);
      setCashGames(sortedGames);
      calculatePlayerStatistics(sortedGames);
    } catch (error) {
      console.error("שגיאה בטעינת משחקי קאש:", error);
      setErrorGames('שגיאה בטעינת משחקים שמורים. נסה לרענן את הדף.');
    } finally {
      setLoadingGames(false);
    }
  };

  const calculatePlayerStatistics = (fetchedSessions) => {
    const stats = {};
    if (!fetchedSessions || fetchedSessions.length === 0) {
      setPlayerStats({});
      return;
    }

    fetchedSessions.forEach(session => {
      const chipsPerShekel = session.chipsPerShekel || 1;
      session.players.forEach(player => {
        if (!stats[player.name]) {
          stats[player.name] = {
            totalBuyInShekels: 0,
            totalCashOutShekels: 0,
            netProfitShekels: 0,
            gamesPlayed: 0,
            totalExits: 0, // חדש: סך הכל יציאות כדי לחשב ממוצע יציאה
          };
        }
        
        const cashOutInShekels = player.cashOut / chipsPerShekel;

        stats[player.name].totalBuyInShekels += player.buyIn;
        stats[player.name].totalCashOutShekels += cashOutInShekels;
        stats[player.name].netProfitShekels += (cashOutInShekels - player.buyIn);
        stats[player.name].gamesPlayed += 1;
        stats[player.name].totalExits += player.cashOut; // חדש: סוכם את כמות היציאות (צ'יפים)
      });
    });

    for (const playerName in stats) {
      const playerStat = stats[playerName];
      playerStat.averageBuyInShekels = playerStat.totalBuyInShekels / playerStat.gamesPlayed;
      playerStat.averageCashOutShekels = playerStat.totalCashOutShekels / playerStat.gamesPlayed;
      playerStat.averageExitChips = playerStat.totalExits / playerStat.gamesPlayed; // חדש: ממוצע יציאה בצ'יפים
    }

    setPlayerStats(stats);
  };

  const handleRemoveImage = (gameId, imageIndex) => {
    if (!user || user.isAnonymous) {
      showCustomModal('כניסת אורח אינה תומכת במחיקת תמונות. אנא התחבר/הרשם.', 'alert');
      return;
    }
    setConfirmDeleteGameId({ gameId, imageIndex });
    setModalMessage('האם אתה בטוח שברצונך למחוק תמונה זו?');
    setModalType('confirm');
  };

  const confirmRemoveImage = async () => {
    if (!confirmDeleteGameId || !user || user.isAnonymous) return;

    const { gameId, imageIndex } = confirmDeleteGameId;
    try {
      const gameRef = doc(db, `artifacts/${appId}/users/${userId}/cashGames`, gameId);
      const gameToUpdate = cashGames.find(game => game.id === gameId);
      if (gameToUpdate) {
        const updatedImages = gameToUpdate.images.filter((_, index) => index !== imageIndex);
        await updateDoc(gameRef, { images: updatedImages });
        setModalMessage('התמונה נמחקה בהצלחה!');
        setModalType('alert');
        fetchCashGames(userId);
      }
    } catch (error) {
      console.error("שגיאה במחיקת תמונה:", error);
      setModalMessage('שגיאה במחיקת תמונה. נסה שוב.');
      setModalType('alert');
    } finally {
      setConfirmDeleteGameId(null);
    }
  };

  const cancelRemoveImage = () => {
    setConfirmDeleteGameId(null);
    setModalMessage(null);
  };

  const handleDeleteGame = (gameId) => {
    if (user && user.isAnonymous) {
      showCustomModal('כניסת אורח אינה תומכת במחיקת משחקים. אנא התחבר/הרשם.', 'alert');
      return;
    }
    setConfirmDeleteGameId(gameId);
    setModalMessage('האם אתה בטוח שברצונך למחוק משחק זה? פעולה זו בלתי הפיכה.');
    setModalType('confirm');
  };

  const confirmDeleteGame = async () => {
    if (!confirmDeleteGameId || !user || user.isAnonymous) return;

    try {
      await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/cashGames`, confirmDeleteGameId));
      setModalMessage('המשחק נמחק בהצלחה!');
      setModalType('alert');
      fetchCashGames(userId);
    } catch (error) {
      console.error("שגיאה במחיקת משחק:", error);
      setModalMessage('שגיאה במחיקת משחק. נסה שוב.');
      setModalType('alert');
    } finally {
      setConfirmDeleteGameId(null);
    }
  };

  const cancelDeleteGame = () => {
    setConfirmDeleteGameId(null);
    setModalMessage(null);
  };

  const closeModal = () => {
    setModalMessage(null);
    setModalType('alert');
  };

  if (loadingAuth || loadingGames) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900 text-white">
        <h2>טוען...</h2>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-gray-100">
      <CustomModal
        message={modalMessage}
        onConfirm={
          modalType === 'confirm' && typeof confirmDeleteGameId === 'string'
            ? confirmDeleteGame
            : modalType === 'confirm' && typeof confirmDeleteGameId === 'object'
              ? confirmRemoveImage
              : closeModal
        }
        onCancel={
          modalType === 'confirm' && typeof confirmDeleteGameId === 'string'
            ? cancelDeleteGame
            : modalType === 'confirm' && typeof confirmDeleteGameId === 'object'
              ? cancelRemoveImage
              : closeModal
        }
        type={modalType}
      />
      
      <div className="container mx-auto p-4 md:p-8 flex-grow">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-8 text-yellow-500">
          <FontAwesomeIcon icon={faHistory} className="mr-3" />
          משחקים שמורים
        </h2>
        
        {cashGames.length === 0 ? (
          <p className="text-center text-xl text-gray-400">אין משחקים שמורים להצגה.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {cashGames.map(game => (
              <div key={game.id} className="game-card bg-gray-800 rounded-xl p-6 shadow-lg transition-all duration-300 hover:scale-105">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-xl font-bold text-yellow-400 flex items-center">
                      <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
                      תאריך: {game.date ? new Date(game.date.seconds * 1000).toLocaleDateString('he-IL') : 'לא ידוע'}
                    </h4>
                    <p className="text-gray-400 text-sm mt-1">
                      <FontAwesomeIcon icon={faCoins} className="mr-1" />
                      יחס צ'יפים: {game.chipsPerShekel}
                    </p>
                  </div>
                  {!user.isAnonymous && (
                    <button onClick={() => handleDeleteGame(game.id)} className="text-red-500 hover:text-red-600 transition-colors duration-200">
                      <FontAwesomeIcon icon={faTrashAlt} size="lg" />
                    </button>
                  )}
                </div>
                
                <p className={`text-lg font-bold ${game.totalProfitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  <FontAwesomeIcon icon={faShekelSign} className="mr-2" />
                  רווח/הפסד כולל: {game.totalProfitLoss ? game.totalProfitLoss.toFixed(2) : '0.00'} ₪
                </p>
                
                <div className="mt-4">
                  <h5 className="text-lg font-bold text-yellow-300 mb-2 flex items-center">
                    <FontAwesomeIcon icon={faUsers} className="mr-2" />
                    שחקנים
                  </h5>
                  <ul className="space-y-2">
                    {game.players.map((player, pIndex) => (
                      <li key={pIndex} className="bg-gray-700 rounded-lg p-3">
                        <span className="font-semibold">{player.name}:</span>
                        <span className="ml-2 text-gray-300">
                          כניסה {player.buyIn.toFixed(2)} ₪, יציאה {player.cashOut} צ'יפים
                        </span>
                        {player.profitLoss !== undefined && (
                          <span className={`ml-2 font-bold ${player.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            ({player.profitLoss.toFixed(2)} ₪)
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
                
                {game.settlements && game.settlements.length > 0 && (
                  <div className="mt-4">
                    <h5 className="text-lg font-bold text-yellow-300 mb-2 flex items-center">
                      <FontAwesomeIcon icon={faArrowRightArrowLeft} className="mr-2" />
                      הסדר חובות
                    </h5>
                    <ul className="space-y-2">
                      {game.settlements.map((debt, dIndex) => (
                        <li key={dIndex} className="bg-gray-700 rounded-lg p-3">
                          <span className="font-semibold text-gray-300">{debt.debtor}</span> משלם ל-
                          <span className="font-semibold text-gray-300">{debt.creditor}</span>:
                          <span className="ml-2 text-lg text-green-400">{debt.amount.toFixed(2)} ₪</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {game.images && game.images.length > 0 && (
                  <div className="mt-4">
                    <h5 className="text-lg font-bold text-yellow-300 mb-2 flex items-center">
                      <FontAwesomeIcon icon={faCamera} className="mr-2" />
                      תמונות מהמשחק
                    </h5>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {game.images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img src={image} alt={`Game Image ${index + 1}`} className="w-full h-auto rounded-lg shadow-md" />
                          <button onClick={() => handleRemoveImage(game.id, index)} className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <FontAwesomeIcon icon={faTimes} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* טבלת סטטיסטיקות שחקנים מצטברות */}
        {Object.keys(playerStats).length > 0 && (
          <div className="bg-gray-800 rounded-xl p-6 md:p-8 shadow-lg mt-8 transition-all duration-300">
            <h3 className="text-2xl font-bold mb-4 text-center text-yellow-400">
              <FontAwesomeIcon icon={faChartBar} className="mr-2" />
              סטטיסטיקות שחקנים
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-gray-700 rounded-lg shadow-inner">
                <thead>
                  <tr className="bg-gray-600 text-gray-200 uppercase text-sm leading-normal">
                    <th className="py-3 px-6 text-left">שם שחקן</th>
                    <th className="py-3 px-6 text-left">משחקים</th>
                    <th className="py-3 px-6 text-left">סך כניסות (₪)</th>
                    <th className="py-3 px-6 text-left">סך יציאות (צ'יפים)</th>
                    <th className="py-3 px-6 text-left">רווח נקי (₪)</th>
                    <th className="py-3 px-6 text-left">ממוצע כניסה (₪)</th>
                    <th className="py-3 px-6 text-left">ממוצע יציאה (צ'יפים)</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300 text-sm font-light">
                  {Object.entries(playerStats).map(([name, stats]) => (
                    <tr key={name} className="border-b border-gray-600 hover:bg-gray-600">
                      <td className="py-3 px-6 text-left whitespace-nowrap">
                        <FontAwesomeIcon icon={faUser} className="mr-2" />
                        {name}
                      </td>
                      <td className="py-3 px-6 text-left">{stats.gamesPlayed}</td>
                      <td className="py-3 px-6 text-left">{stats.totalBuyInShekels.toFixed(2)} ₪</td>
                      <td className="py-3 px-6 text-left">{stats.totalExits.toFixed(2)} צ'יפים</td>
                      <td className={`py-3 px-6 text-left font-bold ${stats.netProfitShekels >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {stats.netProfitShekels.toFixed(2)} ₪
                      </td>
                      <td className="py-3 px-6 text-left">{stats.averageBuyInShekels.toFixed(2)} ₪</td>
                      <td className="py-3 px-6 text-left">{stats.averageExitChips.toFixed(2)} צ'יפים</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Sessions;
