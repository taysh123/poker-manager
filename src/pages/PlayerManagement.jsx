import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../firebase.js'; // ודא ש-db מיובא כראוי - הוספתי סיומת .js
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus, faUserMinus, faUsers, faSave, faTimes } from '@fortawesome/free-solid-svg-icons';
import './PlayerManagement.css';

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

function PlayerManagement() {
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const navigate = useNavigate();

  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [errorPlayers, setErrorPlayers] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('alert');
  const [modalAction, setModalAction] = useState(null);
  const [playerIdToDelete, setPlayerIdToDelete] = useState(null); // לשמירת ה-ID של השחקן למחיקה

  // קבלת ה-appId מהמשתנה הגלובלי __app_id
  const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setUserId(currentUser.uid);
        setLoadingAuth(false);
        if (!currentUser.isAnonymous) {
          fetchPlayers(currentUser.uid);
        } else {
          setLoadingPlayers(false);
          setErrorPlayers("התחבר כאורח אינו מאפשר ניהול שחקנים קבועים. אנא התחבר עם חשבון.");
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
    setPlayerIdToDelete(null); // איפוס ה-ID של השחקן למחיקה
  };

  // פונקציה לטעינת שחקנים מ-Firestore
  const fetchPlayers = async (currentUserId) => {
    setLoadingPlayers(true);
    setErrorPlayers(null);
    try {
      const playersColRef = collection(db, `artifacts/${appId}/users/${currentUserId}/players`);
      const playerSnapshot = await getDocs(playersColRef);
      const fetchedPlayers = playerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPlayers(fetchedPlayers);
    } catch (error) {
      console.error("שגיאה בטעינת שחקנים קבועים:", error);
      setErrorPlayers("שגיאה בטעינת שחקנים. אנא נסה שוב.");
    } finally {
      setLoadingPlayers(false);
    }
  };

  // טיפול בהוספת שחקן חדש
  const handleAddPlayer = async (e) => {
    e.preventDefault();
    if (!user || user.isAnonymous) {
      showCustomModal("אינך מורשה להוסיף שחקנים כאורח. אנא התחבר עם חשבון.", 'alert');
      return;
    }

    const playerName = newPlayerName.trim();
    if (!playerName) {
      showCustomModal('יש להזין שם שחקן.', 'alert');
      return;
    }

    if (players.some(p => p.name === playerName)) {
      showCustomModal('שם שחקן זה כבר קיים ברשימה.', 'alert');
      return;
    }

    try {
      const playersColRef = collection(db, `artifacts/${appId}/users/${userId}/players`);
      await addDoc(playersColRef, { name: playerName });
      setNewPlayerName('');
      showCustomModal('שחקן נוסף בהצלחה!', 'alert');
      fetchPlayers(userId); // רענן את רשימת השחקנים
    } catch (error) {
      console.error("שגיאה בהוספת שחקן:", error);
      showCustomModal(`שגיאה בהוספת שחקן: ${error.message}`, 'alert');
    }
  };

  // טיפול במחיקת שחקן
  const handleDeletePlayer = (id) => {
    if (!user || user.isAnonymous) {
      showCustomModal("אינך מורשה למחוק שחקנים כאורח. אנא התחבר עם חשבון.", 'alert');
      return;
    }

    setPlayerIdToDelete(id); // שמור את ה-ID של השחקן למחיקה
    showCustomModal('האם אתה בטוח שברצונך למחוק שחקן זה לצמיתות?', 'confirm', async () => {
      try {
        const playerDocRef = doc(db, `artifacts/${appId}/users/${userId}/players`, playerIdToDelete);
        await deleteDoc(playerDocRef);
        showCustomModal('שחקן נמחק בהצלחה!', 'alert');
        fetchPlayers(userId); // רענן את רשימת השחקנים
      } catch (error) {
        console.error("שגיאה במחיקת שחקן:", error);
        showCustomModal(`שגיאה במחיקת שחקן: ${error.message}`, 'alert');
      } finally {
        closeModal();
      }
    });
  };

  if (loadingAuth) {
    return (
      <div className="player-management-container">
        <p style={{ textAlign: 'center' }}>טוען...</p>
      </div>
    );
  }

  return (
    <div className="player-management-container">
      <CustomModal
        message={modalMessage}
        onConfirm={modalAction}
        onCancel={closeModal}
        type={modalType}
      />

      <h2><FontAwesomeIcon icon={faUsers} /> ניהול שחקנים</h2>

      <div className="section add-player-section">
        <h3><FontAwesomeIcon icon={faUserPlus} /> הוסף שחקן חדש</h3>
        <form onSubmit={handleAddPlayer} className="add-player-form">
          <input
            type="text"
            placeholder="שם שחקן"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            required
          />
          <button type="submit">
            <FontAwesomeIcon icon={faSave} /> הוסף שחקן
          </button>
        </form>
      </div>

      {loadingPlayers ? (
        <p style={{ textAlign: 'center' }}>טוען שחקנים קבועים...</p>
      ) : errorPlayers ? (
        <p className="error-message">{errorPlayers}</p>
      ) : players.length === 0 ? (
        <p style={{ textAlign: 'center' }}>אין שחקנים קבועים להצגה. הוסף שחקנים כדי להתחיל!</p>
      ) : (
        <div className="section players-list-section">
          <h3><FontAwesomeIcon icon={faUsers} /> שחקנים קבועים קיימים ({players.length})</h3>
          <div className="players-table-container">
            <table className="players-table">
              <thead>
                <tr>
                  <th>שם שחקן</th>
                  <th>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {players.map(player => (
                  <tr key={player.id}>
                    <td>{player.name}</td>
                    <td>
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
    </div>
  );
}

export default PlayerManagement;