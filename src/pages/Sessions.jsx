import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHistory, faCalendarAlt, faCoins, faUsers, faCamera, faPlus, faTimes, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import './Sessions.css';

function Sessions() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const navigate = useNavigate();

  const [cashGames, setCashGames] = useState([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [errorGames, setErrorGames] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [newImageFile, setNewImageFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setLoadingAuth(false);
        if (!currentUser.isAnonymous) {
          fetchCashGames(currentUser.uid);
        } else {
          setLoadingGames(false);
          setErrorGames('היסטוריית משחקים אינה זמינה במצב אורח. אנא התחבר כדי לצפות במשחקים.');
        }
      } else {
        navigate('/');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const fetchCashGames = async (userId) => {
    setLoadingGames(true);
    setErrorGames(null);
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id'; // קבלת appId
    try {
      // הנתיב תוקן: artifacts/${appId}/users/${userId}/sessions
      const gamesCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/sessions`);
      const q = query(gamesCollectionRef, orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      const gamesList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate().toLocaleString('he-IL'), // המרה לפורמט תאריך מקומי
        gameImages: doc.data().gameImages || [], // וודא שקיים מערך תמונות
      }));
      setCashGames(gamesList);
      setLoadingGames(false);
    } catch (err) {
      console.error('שגיאה בשליפת משחקי קאש:', err);
      setErrorGames('שגיאה בטעינת היסטוריית המשחקים. נסה שוב מאוחר יותר.');
      setLoadingGames(false);
    }
  };

  const handleAddImageClick = (gameId) => {
    setSelectedGameId(gameId);
    setShowImageModal(true);
  };

  const handleImageFileChange = (e) => {
    setNewImageFile(e.target.files[0]);
  };

  const handleUploadImageToGame = async () => {
    if (!user || user.isAnonymous || !selectedGameId || !newImageFile) {
      alert('שגיאה: חסרים נתונים להעלאת תמונה.');
      return;
    }

    setUploadingImage(true);
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id'; // קבלת appId
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result;
        // הנתיב תוקן: artifacts/${appId}/users/${user.uid}/sessions/${selectedGameId}
        const gameDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/sessions`, selectedGameId);
        
        const currentDoc = cashGames.find(game => game.id === selectedGameId);
        const existingImages = currentDoc ? currentDoc.gameImages : []; // וודא שזה gameImages

        // בדיקת גודל תמונה לפני שמירה (1MB = 1024 * 1024 בתים)
        // Base64 string is approx 4/3 larger than binary data
        if (base64Image.length * 0.75 > 1024 * 1024) {
          alert('התמונה גדולה מדי. אנא העלה תמונה קטנה יותר (עד 1MB).');
          setUploadingImage(false);
          return;
        }

        await updateDoc(gameDocRef, {
          gameImages: [...existingImages, base64Image], // עדכן את gameImages
        });
        alert('התמונה הועלתה בהצלחה למשחק!');
        setNewImageFile(null);
        setShowImageModal(false);
        fetchCashGames(user.uid); // רענן את רשימת המשחקים
      };
      reader.readAsDataURL(newImageFile);
    } catch (error) {
      console.error('שגיאה בהעלאת תמונה למשחק:', error);
      alert('שגיאה בהעלאת תמונה למשחק.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveGameImage = async (gameId, imageIndex) => {
    if (!user || user.isAnonymous) {
      alert('יש להתחבר כדי למחוק תמונות.');
      return;
    }
    // החלפת alert ב-CustomModal
    const confirmDelete = () => {
      const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
      try {
        const gameDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/sessions`, gameId);
        const currentDoc = cashGames.find(game => game.id === gameId);
        const updatedImages = currentDoc.gameImages.filter((_, index) => index !== imageIndex);
        updateDoc(gameDocRef, { gameImages: updatedImages });
        alert('התמונה נמחקה בהצלחה!');
        fetchCashGames(user.uid); // רענן את רשימת המשחקים
      } catch (error) {
        console.error('שגיאה במחיקת תמונה:', error);
        alert('שגיאה במחיקת תמונה.');
      } finally {
        closeModal();
      }
    };
    openModal('האם אתה בטוח שברצונך למחוק תמונה זו?', 'confirm', confirmDelete);
  };

  const handleDeleteGame = async (gameId) => {
    if (!user || user.isAnonymous) {
      alert('יש להתחבר כדי למחוק משחקים.');
      return;
    }
    // החלפת alert ב-CustomModal
    const confirmDelete = async () => {
      const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
      try {
        const gameDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/sessions`, gameId);
        await deleteDoc(gameDocRef);
        alert('המשחק נמחק בהצלחה!');
        fetchCashGames(user.uid); // רענן את רשימת המשחקים
      } catch (error) {
        console.error('שגיאה במחיקת משחק:', error);
        alert('שגיאה במחיקת משחק.');
      } finally {
        closeModal();
      }
    };
    openModal('האם אתה בטוח שברצונך למחוק משחק זה לצמיתות?', 'confirm', confirmDelete);
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
      <CustomModal
        message={modalMessage}
        onConfirm={modalAction}
        onCancel={closeModal}
        type={modalType}
      />

      <h2><FontAwesomeIcon icon={faHistory} /> היסטוריית משחקים</h2>
      <p className="text-center text-gray-600 mb-8">
        כאן תוכל לצפות בכל משחקי הקאש ששמרת, כולל פרטי השחקנים, רווחים, חובות ותמונות.
      </p>

      {loadingGames ? (
        <p className="loading-message">טוען משחקים שמורים...</p>
      ) : errorGames ? (
        <p className="error-message">{errorGames}</p>
      ) : cashGames.length === 0 ? (
        <p className="no-data-message">
          אין משחקים שמורים להצגה. התחל משחק קאש חדש כדי לשמור נתונים.
        </p>
      ) : (
        <div className="games-list">
          {cashGames.map(game => (
            <div key={game.id} className="game-card">
              <div className="game-header">
                <p><FontAwesomeIcon icon={faCalendarAlt} /> תאריך: {game.date}</p>
                <p><FontAwesomeIcon icon={faCoins} /> יחס צ'יפים: {game.chipsPerShekel}</p>
                <button onClick={() => handleDeleteGame(game.id)} className="delete-game-button">
                  <FontAwesomeIcon icon={faTrashAlt} /> מחק משחק
                </button>
              </div>

              <h3><FontAwesomeIcon icon={faUsers} /> שחקנים במשחק</h3>
              <div className="players-table-container">
                <table className="players-table">
                  <thead>
                    <tr>
                      <th>שם שחקן</th>
                      <th>כניסה (₪)</th>
                      <th>יציאה (₪)</th>
                      <th>רווח/הפסד (₪)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {game.players.map((player, pIndex) => {
                      const profitLoss = player.cashOut - player.buyIn;
                      return (
                        <tr key={pIndex}>
                          <td>{player.name}</td>
                          <td>{player.buyIn.toFixed(2)}</td>
                          <td>{player.cashOut.toFixed(2)}</td>
                          <td className={profitLoss >= 0 ? 'profit' : 'loss'}>
                            {profitLoss.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {game.debts && game.debts.length > 0 && (
                <>
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
                      {game.debts.map((debt, dIndex) => (
                        <tr key={dIndex}>
                          <td>{debt.debtor}</td>
                          <td>{debt.creditor}</td>
                          <td>{debt.amount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              {game.gameImages && game.gameImages.length > 0 && (
                <div className="game-images-section">
                  <h3><FontAwesomeIcon icon={faCamera} /> תמונות מהמשחק</h3>
                  <div className="image-preview-grid">
                    {game.gameImages.map((image, imgIndex) => (
                      <div key={imgIndex} className="image-preview-item">
                        <img src={image} alt={`Game Image ${imgIndex + 1}`} />
                        <button onClick={() => handleRemoveGameImage(game.id, imgIndex)} className="remove-image-button">
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
            </div>
          ))}
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
    </div>
  );
}

export default Sessions;
