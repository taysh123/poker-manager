import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHistory, faCalendarAlt, faCoins, faUsers, faCamera, faPlus, faTimes, faTrashAlt, faChartBar, faUser, faMoneyBillWave, faArrowRightArrowLeft } from '@fortawesome/free-solid-svg-icons';
import './Sessions.css';

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

function Sessions() {
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const navigate = useNavigate();

  const [cashGames, setCashGames] = useState([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [errorGames, setErrorGames] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [newImageFile, setNewImageFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [modalMessage, setModalMessage] = useState(null);
  const [modalType, setModalType] = useState('alert');
  const [confirmDeleteGameId, setConfirmDeleteGameId] = useState(null);

  const [playerStats, setPlayerStats] = useState({}); // מצב חדש לסטטיסטיקות שחקנים

  const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

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
      // הערה: orderBy עלול לדרוש אינדקסים ב-Firestore. אם יש שגיאות, ניתן להסיר את ה-orderBy ולמיין ב-JS.
      const q = query(gamesCollectionRef, orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      const gamesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCashGames(gamesList);
      calculatePlayerStatistics(gamesList); // קריאה לפונקציית חישוב הסטטיסטיקות
    } catch (error) {
      console.error("שגיאה בטעינת משחקי קאש:", error);
      setErrorGames('שגיאה בטעינת משחקים שמורים. נסה לרענן את הדף.');
    } finally {
      setLoadingGames(false);
    }
  };

  // פונקציה לחישוב סטטיסטיקות שחקנים מצטברות
  const calculatePlayerStatistics = (fetchedSessions) => {
    const stats = {};

    fetchedSessions.forEach(session => {
      session.players.forEach(player => {
        if (!stats[player.name]) {
          stats[player.name] = {
            totalBuyInShekels: 0,
            totalCashOutChips: 0, // סך יציאות בצ'יפים (נתון גולמי)
            totalCashOutShekels: 0, // סך יציאות בשקלים (לאחר המרה)
            netProfitShekels: 0, // רווח נקי בשקלים
            gamesPlayed: 0,
            chipRatioSum: 0, // לסכום יחסי הצ'יפים לחישוב ממוצע
          };
        }

        const chipRatio = session.chipsPerShekel || 1; // ודא שיחס הצ'יפים קיים, אחרת השתמש ב-1
        const cashOutInShekels = player.cashOut / chipRatio; // המר יציאה מצ'יפים לשקלים

        stats[player.name].totalBuyInShekels += player.buyIn;
        stats[player.name].totalCashOutChips += player.cashOut;
        stats[player.name].totalCashOutShekels += cashOutInShekels;
        stats[player.name].netProfitShekels += (cashOutInShekels - player.buyIn);
        stats[player.name].gamesPlayed += 1;
        stats[player.name].chipRatioSum += chipRatio;
      });
    });

    // חישוב ממוצעים וסיום הסטטיסטיקות
    for (const playerName in stats) {
      const playerStat = stats[playerName];
      playerStat.averageBuyInShekels = playerStat.totalBuyInShekels / playerStat.gamesPlayed;
      playerStat.averageCashOutShekels = playerStat.totalCashOutShekels / playerStat.gamesPlayed;
      playerStat.averageChipRatio = playerStat.chipRatioSum / playerStat.gamesPlayed;
    }

    setPlayerStats(stats);
  };

  const handleAddImageClick = (gameId) => {
    if (user && user.isAnonymous) {
      setModalMessage('כניסת אורח אינה תומכת בהוספת תמונות. אנא התחבר/הרשם.');
      setModalType('alert');
      return;
    }
    setSelectedGameId(gameId);
    setShowImageModal(true);
  };

  const handleImageFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit
        setModalMessage(`הקובץ ${file.name} גדול מדי (מעל 1MB).`);
        setModalType('alert');
        setNewImageFile(null);
        return;
      }
      setNewImageFile(file);
    }
  };

  const handleUploadImageToGame = async () => {
    if (!newImageFile || !selectedGameId || !user || user.isAnonymous) {
      setModalMessage('בחר קובץ תמונה וודא שאתה מחובר.');
      setModalType('alert');
      return;
    }

    setUploadingImage(true);
    const reader = new FileReader();
    reader.readAsDataURL(newImageFile);
    reader.onloadend = async () => {
      try {
        const gameRef = doc(db, `artifacts/${appId}/users/${userId}/cashGames`, selectedGameId);
        const currentImages = cashGames.find(game => game.id === selectedGameId)?.images || []; // שימוש ב-`images` כפי שנשמר ב-CashGame.jsx
        await updateDoc(gameRef, {
          images: [...currentImages, reader.result] // שמירה כ-`images`
        });
        setModalMessage('התמונה הועלתה בהצלחה!');
        setModalType('alert');
        setShowImageModal(false);
        setNewImageFile(null);
        fetchCashGames(userId); // רענן את רשימת המשחקים
      } catch (error) {
        console.error("שגיאה בהעלאת תמונה:", error);
        setModalMessage('שגיאה בהעלאת תמונה. נסה שוב.');
        setModalType('alert');
      } finally {
        setUploadingImage(false);
      }
    };
    reader.onerror = (error) => {
      console.error("Error reading file:", error);
      setModalMessage('שגיאה בקריאת קובץ התמונה.');
      setModalType('alert');
      setUploadingImage(false);
    };
  };

  const handleRemoveImage = (gameId, imageIndex) => {
    if (!user || user.isAnonymous) {
      setModalMessage('כניסת אורח אינה תומכת במחיקת תמונות. אנא התחבר/הרשם.');
      setModalType('alert');
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
        const updatedImages = gameToUpdate.images.filter((_, index) => index !== imageIndex); // שימוש ב-`images`
        await updateDoc(gameRef, { images: updatedImages });
        setModalMessage('התמונה נמחקה בהצלחה!');
        setModalType('alert');
        fetchCashGames(userId); // רענן את רשימת המשחקים
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
      setModalMessage('כניסת אורח אינה תומכת במחיקת משחקים. אנא התחבר/הרשם.');
      setModalType('alert');
      return;
    }
    setConfirmDeleteGameId(gameId); // שימוש חוזר באותו סטייט, אך עם ID של משחק
    setModalMessage('האם אתה בטוח שברצונך למחוק משחק זה? פעולה זו בלתי הפיכה.');
    setModalType('confirm');
  };

  const confirmDeleteGame = async () => {
    if (!confirmDeleteGameId || !user || user.isAnonymous) return;

    try {
      await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/cashGames`, confirmDeleteGameId));
      setModalMessage('המשחק נמחק בהצלחה!');
      setModalType('alert');
      fetchCashGames(userId); // רענן את רשימת המשחקים
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

  if (loadingAuth) {
    return (
      <div className="sessions-container">
        <h2>טוען...</h2>
      </div>
    );
  }

  return (
    <div className="sessions-container">
      <h2><FontAwesomeIcon icon={faHistory} /> משחקים שמורים</h2>
      <p className="text-center text-gray-600 mb-8">
        צפה ונהל את כל משחקי הקאש שנשמרו בעבר.
      </p>

      {loadingGames ? (
        <p style={{ textAlign: 'center' }}>טוען משחקים שמורים...</p>
      ) : errorGames ? (
        <p className="error-message">{errorGames}</p>
      ) : cashGames.length === 0 ? (
        <p style={{ textAlign: 'center' }}>אין משחקים שמורים להצגה. צור משחק קאש ושמור אותו כדי לראות אותו כאן!</p>
      ) : (
        <div className="games-grid">
          {cashGames.map(game => (
            <div key={game.id} className="game-card">
              <h4><FontAwesomeIcon icon={faCalendarAlt} /> תאריך: {game.date ? new Date(game.date.seconds * 1000).toLocaleDateString('he-IL') : 'לא ידוע'}</h4>
              <p><FontAwesomeIcon icon={faCoins} /> יחס צ'יפים: {game.chipsPerShekel}</p>
              <p className={game.totalProfitLoss >= 0 ? 'profit' : 'loss'}>
                <FontAwesomeIcon icon={faMoneyBillWave} /> רווח/הפסד כולל: {game.totalProfitLoss ? game.totalProfitLoss.toFixed(2) : '0.00'} ₪
              </p>
              <h5><FontAwesomeIcon icon={faUsers} /> שחקנים:</h5>
              <ul className="player-list">
                {game.players.map((player, pIndex) => (
                  <li key={pIndex}>
                    {player.name}: כניסה {player.buyIn.toFixed(2)} ₪, יציאה {player.cashOut.toFixed(2)} צ'יפים
                    {/* חישוב רווח/הפסד לשחקן ספציפי במשחק זה */}
                    {player.profitLoss !== undefined && (
                      <span className={player.profitLoss >= 0 ? 'profit' : 'loss'}>
                        ({player.profitLoss.toFixed(2)} ₪)
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              {game.settlements && game.settlements.length > 0 && (
                <>
                  <h5><FontAwesomeIcon icon={faArrowRightArrowLeft} /> חובות:</h5>
                  <ul className="debt-list">
                    {game.settlements.map((debt, dIndex) => (
                      <li key={dIndex}>
                        {debt.debtor} חייב ל-{debt.creditor}: {debt.amount.toFixed(2)} ₪
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {game.images && game.images.length > 0 && (
                <div className="game-images-section">
                  <h5><FontAwesomeIcon icon={faCamera} /> תמונות מהמשחק:</h5>
                  <div className="game-images-grid">
                    {game.images.map((image, index) => (
                      <div key={index} className="game-image-item">
                        <img src={image} alt={`Game Image ${index + 1}`} />
                        <button onClick={() => handleRemoveImage(game.id, index)} className="remove-image-button">
                          <FontAwesomeIcon icon={faTimes} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!user.isAnonymous && (
                <button onClick={() => handleAddImageClick(game.id)} className="add-image-to-game-button">
                  <FontAwesomeIcon icon={faCamera} /> הוסף תמונה למשחק זה
                </button>
              )}
              
              {!user.isAnonymous && (
                <button onClick={() => handleDeleteGame(game.id)} className="delete-game-button">
                  <FontAwesomeIcon icon={faTrashAlt} /> מחק משחק
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* טבלת סטטיסטיקות שחקנים מצטברות */}
      {Object.keys(playerStats).length > 0 && (
        <div className="section player-statistics-section">
          <h3><FontAwesomeIcon icon={faChartBar} /> סטטיסטיקות שחקנים</h3>
          <div className="player-stats-table-container">
            <table className="player-stats-table">
              <thead>
                <tr>
                  <th>שם שחקן</th>
                  <th>משחקים שוחקו</th>
                  <th>סך כניסות (₪)</th>
                  <th>סך יציאות (₪)</th>
                  <th>רווח נקי (₪)</th>
                  <th>ממוצע כניסה (₪)</th>
                  <th>ממוצע יציאה (₪)</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(playerStats).map(([name, stats]) => (
                  <tr key={name}>
                    <td><FontAwesomeIcon icon={faUser} /> {name}</td>
                    <td>{stats.gamesPlayed}</td>
                    <td>{stats.totalBuyInShekels.toFixed(2)} ₪</td>
                    <td>{stats.totalCashOutShekels.toFixed(2)} ₪</td>
                    <td className={stats.netProfitShekels >= 0 ? 'profit' : 'loss'}>
                      {stats.netProfitShekels.toFixed(2)} ₪
                    </td>
                    <td>{stats.averageBuyInShekels.toFixed(2)} ₪</td>
                    <td>{stats.averageCashOutShekels.toFixed(2)} ₪</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showImageModal && (
        <div className="image-upload-modal-overlay">
          <div className="image-upload-modal">
            <h3>הוסף תמונה למשחק</h3>
            <input type="file" accept="image/*" onChange={handleImageFileChange} />
            <div className="modal-buttons">
              <button onClick={handleUploadImageToGame} disabled={!newImageFile || uploadingImage}>
                {uploadingImage ? 'מעלה...' : 'העלה תמונה'}
              </button>
              <button onClick={() => { setShowImageModal(false); setNewImageFile(null); }} className="cancel-button">
                ביטול
              </button>
            </div>
            <p className="image-note-modal">
              הערה: גודל תמונה מומלץ עד 1MB. תמונות גדולות עלולות להיכשל בשמירה.
            </p>
          </div>
        </div>
      )}
      <CustomModal
        message={modalMessage}
        onConfirm={
          modalType === 'confirm' && typeof confirmDeleteGameId === 'string'
            ? confirmDeleteGame // Confirming game deletion
            : modalType === 'confirm' && typeof confirmDeleteGameId === 'object'
              ? confirmRemoveImage // Confirming image deletion
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
    </div>
  );
}

export default Sessions;