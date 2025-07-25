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
  const [userId, setUserId] = useState(null); // מצב לשמירת ה-userId
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

  // קבלת ה-appId מהמשתנה הגלובלי __app_id
  const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

  // useEffect לאימות משתמש וטעינת שחקנים
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setUserId(currentUser.uid); // שמור את ה-UID
        if (!currentUser.isAnonymous) {
          fetchPlayers(currentUser.uid);
        } else {
          setLoadingPlayers(false);
          setErrorPlayers('משתמש אנונימי אינו יכול לנהל שחקנים קבועים. אנא התחבר/הירשם.');
        }
      } else {
        navigate('/');
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const openModal = (message, type, action = null) => {
    setModalMessage(message);
    setModalType(type);
    setModalAction(() => action); // שמור את הפעולה כפונקציה
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalMessage('');
    setModalType('alert');
    setModalAction(null);
  };

  const fetchPlayers = async (currentUserId) => {
    if (!currentUserId) {
      console.warn("אין User ID, לא ניתן לטעון שחקנים.");
      setLoadingPlayers(false);
      return;
    }
    setLoadingPlayers(true);
    setErrorPlayers(null);
    try {
      const playersCollectionRef = collection(db, `artifacts/${appId}/users/${currentUserId}/players`);
      const playerSnapshot = await getDocs(playersCollectionRef);
      const fetchedPlayers = playerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPlayers(fetchedPlayers);
    } catch (err) {
      console.error("שגיאה בטעינת שחקנים:", err);
      setErrorPlayers("שגיאה בטעינת שחקנים: " + err.message);
    } finally {
      setLoadingPlayers(false);
    }
  };

  const handleAddPlayer = async (event) => {
    event.preventDefault();
    if (newPlayerName.trim() === '') {
      openModal('שם שחקן לא יכול להיות ריק.', 'alert');
      return;
    }
    if (players.some(p => p.name === newPlayerName.trim())) {
      openModal('שחקן בשם זה כבר קיים ברשימה.', 'alert');
      return;
    }

    if (!user || !userId) {
      openModal('שגיאה: משתמש לא מאומת. לא ניתן להוסיף שחקן.', 'alert');
      return;
    }

    try {
      const playersCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/players`);
      const docRef = await addDoc(playersCollectionRef, {
        name: newPlayerName.trim(),
        createdAt: new Date()
      });
      setPlayers([...players, { id: docRef.id, name: newPlayerName.trim() }]);
      setNewPlayerName('');
      openModal('שחקן נוסף בהצלחה!', 'alert');
    } catch (error) {
      console.error("שגיאה בהוספת שחקן:", error);
      openModal("שגיאה בהוספת שחקן: " + error.message, 'alert');
    }
  };

  const handleDeletePlayer = (playerId) => {
    openModal('האם אתה בטוח שברצונך למחוק שחקן זה לצמיתות?', 'confirm', async () => {
      if (!user || !userId) {
        openModal('שגיאה: משתמש לא מאומת. לא ניתן למחוק שחקן.', 'alert');
        closeModal();
        return;
      }
      try {
        const playerDocRef = doc(db, `artifacts/${appId}/users/${userId}/players`, playerId);
        await deleteDoc(playerDocRef);
        setPlayers(players.filter(p => p.id !== playerId));
        openModal('שחקן נמחק בהצלחה!', 'alert');
      } catch (error) {
        console.error("שגיאה במחיקת שחקן:", error);
        openModal("שגיאה במחיקת שחקן: " + error.message, 'alert');
      } finally {
        closeModal();
      }
    });
  };

  if (loadingAuth) {
    return (
      <div className="player-management-container">
        <h2>טוען אימות...</h2>
      </div>
    );
  }

  if (!user || user.isAnonymous) {
    return (
      <div className="player-management-container">
        <p className="error-message text-center">
          <FontAwesomeIcon icon={faUsers} /> כדי לנהל שחקנים קבועים, עליך להתחבר או להירשם.
        </p>
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

      <h2><FontAwesomeIcon icon={faUsers} /> ניהול שחקנים קבועים</h2>
      <p className="text-center text-gray-600 mb-8">
        הוסף, ערוך ומחק שחקנים קבועים שיופיעו אוטומטית במשחקים.
      </p>

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