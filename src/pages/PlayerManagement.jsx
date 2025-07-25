import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../firebase.js';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus, faUserMinus, faUsers, faSave, faTimes, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
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

  // מצבי Modal
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('alert'); // 'alert' or 'confirm'
  const [modalAction, setModalAction] = useState(null); // פונקציה שתופעל באישור המודאל

  // פונקציה להצגת מודאל
  const openModal = (message, type = 'alert', action = null) => {
    setModalMessage(message);
    setModalType(type);
    setModalAction(() => action);
    setShowModal(true);
  };

  // פונקציה לטיפול באישור מודאל
  const handleModalConfirm = () => {
    if (modalAction) {
      modalAction();
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

  // קבלת ה-appId מהמשתנה הגלובלי __app_id
  const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setUserId(currentUser.uid);
        setLoadingAuth(false);
        if (!currentUser.isAnonymous) {
          fetchPlayers(currentUser.uid);
        } else {
          setErrorPlayers('כדי לנהל שחקנים, עליך להיות משתמש רשום.');
          setLoadingPlayers(false);
        }
      } else {
        navigate('/');
      }
    });
    return () => unsubscribe();
  }, [navigate, userId]); // הוספת userId כתלות

  const fetchPlayers = async (currentUserId) => {
    setLoadingPlayers(true);
    setErrorPlayers(null);
    try {
      const playersColRef = collection(db, `artifacts/${appId}/users/${currentUserId}/players`);
      const playerSnapshot = await getDocs(playersColRef);
      const playersList = playerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPlayers(playersList);
    } catch (e) {
      console.error("שגיאה בטעינת שחקנים: ", e);
      setErrorPlayers('שגיאה בטעינת שחקנים. אנא נסה שוב מאוחר יותר.');
    } finally {
      setLoadingPlayers(false);
    }
  };

  const handleAddPlayer = async (e) => {
    e.preventDefault();
    if (!user || user.isAnonymous) {
      openModal('כדי להוסיף שחקנים, עליך להיות משתמש רשום.', 'alert');
      return;
    }
    const name = newPlayerName.trim();
    if (!name) {
      openModal('יש להזין שם שחקן.', 'alert');
      return;
    }
    if (players.some(player => player.name === name)) {
      openModal('שם השחקן כבר קיים.', 'alert');
      return;
    }

    try {
      await addDoc(collection(db, `artifacts/${appId}/users/${userId}/players`), { name });
      setNewPlayerName('');
      openModal('שחקן נוסף בהצלחה!', 'alert', () => fetchPlayers(userId)); // רענן את הרשימה
    } catch (e) {
      console.error("שגיאה בהוספת שחקן: ", e);
      openModal(`שגיאה בהוספת שחקן: ${e.message}`, 'alert');
    }
  };

  const handleDeletePlayer = (playerId) => {
    if (!user || user.isAnonymous) {
      openModal('כדי למחוק שחקנים, עליך להיות משתמש רשום.', 'alert');
      return;
    }
    openModal(
      'האם אתה בטוח שברצונך למחוק שחקן זה? פעולה זו בלתי הפיכה.',
      'confirm',
      async () => {
        try {
          await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/players`, playerId));
          openModal('שחקן נמחק בהצלחה!', 'alert', () => fetchPlayers(userId)); // רענן את הרשימה
        } catch (e) {
          console.error("שגיאה במחיקת שחקן: ", e);
          openModal(`שגיאה במחיקת שחקן: ${e.message}`, 'alert');
        }
      }
    );
  };

  if (loadingAuth) {
    return (
      <div className="player-management-container">
        <p style={{ textAlign: 'center' }}>טוען נתוני משתמש...</p>
      </div>
    );
  }

  return (
    <div className="player-management-container">
      <h2><FontAwesomeIcon icon={faUsers} /> ניהול שחקנים קבועים</h2>
      <p>הוסף ומחק שחקנים קבועים שיופיעו אוטומטית במשחקים שלך.</p>

      <div className="section add-player-section">
        <h3><FontAwesomeIcon icon={faUserPlus} /> הוסף שחקן חדש</h3>
        <form onSubmit={handleAddPlayer} className="add-player-form">
          <input
            type="text"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            placeholder="שם שחקן חדש"
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

export default PlayerManagement;