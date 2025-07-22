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
      // הנתיב תוקן: artifacts/${appId}/users/${userId}/cashGames
      const gamesCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/cashGames`);
      const q = query(gamesCollectionRef, orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      const gamesList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate().toLocaleString(),
        images: doc.data().images || [],
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
        // הנתיב תוקן: artifacts/${appId}/users/${user.uid}/cashGames/${selectedGameId}
        const gameDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/cashGames`, selectedGameId);
        
        const currentDoc = cashGames.find(game => game.id === selectedGameId);
        const existingImages = currentDoc ? currentDoc.images : [];

        if (base64Image.length * 0.75 > 1024 * 1024) {
          alert('התמונה גדולה מדי. אנא העלה תמונה קטנה יותר (עד 1MB).');
          setUploadingImage(false);
          return;
        }

        await updateDoc(gameDocRef, {
          images: [...existingImages, base64Image],
        });
        alert('התמונה הועלתה בהצלחה למשחק!');
        setNewImageFile(null);
        setShowImageModal(false);
        fetchCashGames(user.uid);
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
    const confirmed = window.confirm('האם אתה בטוח שברצונך למחוק תמונה זו?');
    if (!confirmed) return;

    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id'; // קבלת appId
    try {
      // הנתיב תוקן: artifacts/${appId}/users/${user.uid}/cashGames/${gameId}
      const gameDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/cashGames`, gameId);
      const gameToUpdate = cashGames.find(game => game.id === gameId);
      if (gameToUpdate) {
        const updatedImages = gameToUpdate.images.filter((_, idx) => idx !== imageIndex);
        await updateDoc(gameDocRef, { images: updatedImages });
        alert('התמונה נמחקה בהצלחה!');
        fetchCashGames(user.uid);
      }
    } catch (error) {
      console.error('שגיאה במחיקת תמונה:', error);
      alert('שגיאה במחיקת תמונה.');
    }
  };

  const handleDeleteGame = async (gameId) => {
    if (!user || user.isAnonymous) {
      alert('יש להתחבר כדי למחוק משחקים.');
      return;
    }

    const confirmed = window.confirm('האם אתה בטוח שברצונך למחוק משחק זה לצמיתות? פעולה זו אינה ניתנת לביטול.');
    if (!confirmed) return;

    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id'; // קבלת appId
    try {
      // הנתיב תוקן: artifacts/${appId}/users/${user.uid}/cashGames/${gameId}
      const gameDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/cashGames`, gameId);
      await deleteDoc(gameDocRef);
      alert('המשחק נמחק בהצלחה!');
      fetchCashGames(user.uid);
    } catch (error) {
      console.error('שגיאה במחיקת משחק:', error);
      alert('שגיאה במחיקת המשחק. נסה שוב מאוחר יותר.');
    }
  };

  if (loadingAuth) {
    return (
      <div className="page-container sessions-container">
        <p style={{ textAlign: 'center', color: 'var(--text-color)' }}>טוען...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page-container sessions-container">
        <p style={{ textAlign: 'center', color: 'var(--text-color)' }}>מפנה לדף הכניסה...</p>
      </div>
    );
  }

  return (
    <div className="page-container sessions-container">
      <h2><FontAwesomeIcon icon={faHistory} /> משחקים שמורים</h2> {/* שינוי טקסט */}

      {loadingGames ? (
        <p className="loading-message">טוען היסטוריית משחקים...</p>
      ) : errorGames ? (
        <p className="error-message">{errorGames}</p>
      ) : cashGames.length === 0 ? (
        <p className="no-data-message">אין משחקי קאש שמורים להצגה. התחל משחק חדש כדי לשמור!</p>
      ) : (
        <div className="games-list">
          {cashGames.map(game => (
            <div key={game.id} className="game-card">
              <div className="game-header">
                <h3>משחק מתאריך: <FontAwesomeIcon icon={faCalendarAlt} /> {game.date}</h3>
                <p><FontAwesomeIcon icon={faCoins} /> יחס צ'יפים לשקל: {game.chipsPerShekel}</p>
                {!user.isAnonymous && (
                  <button onClick={() => handleDeleteGame(game.id)} className="delete-game-button">
                    <FontAwesomeIcon icon={faTrashAlt} /> מחק משחק
                  </button>
                )}
              </div>
              <div className="players-table-container">
                <table className="players-table">
                  <thead>
                    <tr>
                      <th>שם שחקן</th>
                      <th>השקעה כוללת (₪)</th>
                      <th>סכום יציאה (₪)</th>
                      <th>רווח/הפסד (₪)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {game.players.map((player, index) => {
                      const profitLoss = player.cashOut - player.buyIn;
                      return (
                        <tr key={index}>
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
              
              {game.images && game.images.length > 0 && (
                <div className="game-images-section">
                  <h4><FontAwesomeIcon icon={faCamera} /> תמונות מהמשחק:</h4>
                  <div className="game-images-grid">
                    {game.images.map((image, index) => (
                      <div key={index} className="game-image-item">
                        <img src={image} alt={`Game image ${index + 1}`} />
                        <button onClick={() => handleRemoveGameImage(game.id, index)} className="remove-image-button">
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