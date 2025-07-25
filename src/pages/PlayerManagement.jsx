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

  const [newPlayerName, setNewPlayerName] = useState('');
  const [players, setPlayers] = useState([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [errorPlayers, setErrorPlayers] = useState(null);

  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('alert');
  const [modalOnConfirm, setModalOnConfirm] = useState(null);
  const [modalOnCancel, setModalOnCancel] = useState(null);

  const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

  // פונקציה לפתיחת המודל
  const openModal = (message, type = 'alert', onConfirm = null, onCancel = null) => {
    setModalMessage(message);
    setModalType(type);
    setModalOnConfirm(() => onConfirm); // השתמש ב-callback כדי לשמור את הפונקציה
    setModalOnCancel(() => onCancel || (() => setModalMessage(''))); // אם אין onCancel ספציפי, סגור את המודל
  };

  // פונקציה לסגירת המודל
  const closeModal = () => {
    setModalMessage('');
    setModalType('alert');
    setModalOnConfirm(null);
    setModalOnCancel(null);
  };

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setUserId(currentUser.uid);
        if (!currentUser.isAnonymous) {
          fetchPlayers(currentUser.uid);
        } else {
          setErrorPlayers('כאורח, אינך יכול לנהל שחקנים קבועים. אנא התחבר/הירשם.');
          setLoadingPlayers(false);
        }
      } else {
        navigate('/');
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  const fetchPlayers = async (currentUserId) => {
    setLoadingPlayers(true);
    setErrorPlayers(null);
    try {
      const playersCollectionRef = collection(db, `artifacts/${appId}/users/${currentUserId}/players`);
      const playerSnapshot = await getDocs(playersCollectionRef);
      const playersList = playerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPlayers(playersList);
    } catch (err) {
      console.error("שגיאה בטעינת שחקנים:", err);
      setErrorPlayers('שגיאה בטעינת שחקנים. אנא נסה שוב מאוחר יותר.');
    } finally {
      setLoadingPlayers(false);
    }
  };

  const handleAddPlayer = async (e) => {
    e.preventDefault();
    if (!user || user.isAnonymous) {
      openModal('כאורח, אינך יכול להוסיף שחקנים. אנא התחבר/הירשם.', 'alert', null, closeModal);
      return;
    }
    const name = newPlayerName.trim();
    if (!name) {
      openModal('שם השחקן לא יכול להיות ריק.', 'alert', null, closeModal);
      return;
    }
    if (players.some(player => player.name === name)) {
      openModal('שחקן בשם זה כבר קיים.', 'alert', null, closeModal);
      return;
    }

    try {
      const playersCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/players`);
      await addDoc(playersCollectionRef, { name, createdAt: new Date() });
      setNewPlayerName('');
      fetchPlayers(userId); // רענן את רשימת השחקנים
      openModal('שחקן נוסף בהצלחה!', 'alert', null, closeModal);
    } catch (err) {
      console.error("שגיאה בהוספת שחקן:", err);
      openModal('שגיאה בהוספת שחקן. אנא נסה שוב.', 'alert', null, closeModal);
    }
  };

  const handleDeletePlayer = (playerId) => {
    if (!user || user.isAnonymous) {
      openModal('כאורח, אינך יכול למחוק שחקנים. אנא התחבר/הירשם.', 'alert', null, closeModal);
      return;
    }

    const confirmDelete = async () => {
      try {
        const playerDocRef = doc(db, `artifacts/${appId}/users/${userId}/players`, playerId);
        await deleteDoc(playerDocRef);
        fetchPlayers(userId); // רענן את רשימת השחקנים
        openModal('שחקן נמחק בהצלחה!', 'alert', null, closeModal);
      } catch (err) {
        console.error("שגיאה במחיקת שחקן:", err);
        openModal('שגיאה במחיקת שחקן. אנא נסה שוב.', 'alert', null, closeModal);
      }
      closeModal(); // סגור את המודל לאחר הפעולה
    };

    openModal('האם אתה בטוח שברצונך למחוק שחקן זה? פעולה זו בלתי הפיכה.', 'confirm', confirmDelete, closeModal);
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
        onConfirm={modalOnConfirm}
        onCancel={modalOnCancel}
        type={modalType}
      />

      <h2><FontAwesomeIcon icon={faUserPlus} /> ניהול שחקנים קבועים</h2>
      <p>הוסף ומחק שחקנים המשחקים איתך באופן קבוע כדי לנהל אותם בקלות במשחקים.</p>

      <div className="section add-player-section">
        <h3><FontAwesomeIcon icon={faUserPlus} /> הוסף שחקן חדש</h3>
        <form onSubmit={handleAddPlayer} className="add-player-form">
          <input
            type="text"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            placeholder="שם שחקן"
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
