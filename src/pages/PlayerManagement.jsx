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
  const [loadingAuth, setLoadingAuth] = useState(true);
  const navigate = useNavigate();

  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [errorPlayers, setErrorPlayers] = useState(null);

  // מצב עבור המודל
  const [modal, setModal] = useState({
    isOpen: false,
    message: '',
    type: 'alert', // 'alert' or 'confirm'
    onConfirm: null,
    onCancel: null,
  });

  // פתיחת מודל התראה
  const showAlert = (message) => {
    setModal({
      isOpen: true,
      message,
      type: 'alert',
      onConfirm: null, // לא רלוונטי לאלרט
      onCancel: () => setModal({ ...modal, isOpen: false }),
    });
  };

  // פתיחת מודל אישור
  const showConfirm = (message, onConfirmCallback) => {
    setModal({
      isOpen: true,
      message,
      type: 'confirm',
      onConfirm: () => {
        onConfirmCallback();
        setModal({ ...modal, isOpen: false });
      },
      onCancel: () => setModal({ ...modal, isOpen: false }),
    });
  };

  useEffect(() => {
    const auth = getAuth();
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id'; // קבלת appId

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setLoadingAuth(false);
        // טען שחקנים רק אם המשתמש אינו אנונימי
        if (!currentUser.isAnonymous) {
          fetchPlayers(currentUser.uid, appId); // העבר appId לפונקציה
        } else {
          setLoadingPlayers(false);
          setErrorPlayers('ניהול שחקנים קבועים אינו זמין במצב אורח. אנא התחבר כדי לנהל שחקנים.');
        }
      } else {
        // אם אין משתמש מחובר, נווט לדף הכניסה הראשי
        navigate('/');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const fetchPlayers = async (userId, appId) => { // קבל appId כארגומנט
    setLoadingPlayers(true);
    setErrorPlayers(null);
    try {
      // הנתיב תוקן בהתאם לכללי האבטחה
      const playersCollection = collection(db, `artifacts/${appId}/users/${userId}/players`);
      const querySnapshot = await getDocs(playersCollection);
      const playersList = querySnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
      setPlayers(playersList);
      setLoadingPlayers(false);
    } catch (err) {
      console.error('שגיאה בשליפת שחקנים:', err);
      setErrorPlayers('שגיאה בטעינת השחקנים. נסה שוב מאוחר יותר.');
      setLoadingPlayers(false);
    }
  };

  const handleAddPlayer = async (e) => {
    e.preventDefault();
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id'; // קבלת appId

    if (!user) {
      showAlert('שגיאת אימות. אנא רענן את הדף.');
      return;
    }
    if (user.isAnonymous) {
      showAlert('במצב אורח, לא ניתן לשמור שחקנים קבועים. אנא התחבר.');
      return;
    }

    if (newPlayerName.trim() === '') {
      showAlert('שם השחקן לא יכול להיות ריק.');
      return;
    }
    if (players.some(p => p.name === newPlayerName.trim())) {
      showAlert('שחקן בשם זה כבר קיים.');
      return;
    }

    try {
      // הנתיב תוקן בהתאם לכללי האבטחה
      const playersCollection = collection(db, `artifacts/${appId}/users/${user.uid}/players`);
      const docRef = await addDoc(playersCollection, { name: newPlayerName.trim() });
      setPlayers([...players, { id: docRef.id, name: newPlayerName.trim() }]);
      setNewPlayerName('');
      showAlert('שחקן נוסף בהצלחה!');
    } catch (error) {
      console.error('שגיאה בהוספת שחקן:', error);
      showAlert(`שגיאה בהוספת שחקן: ${error.message || error}`);
    }
  };

  const handleDeletePlayer = async (playerId) => {
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id'; // קבלת appId

    if (!user) {
      showAlert('שגיאת אימות. אנא רענן את הדף.');
      return;
    }
    if (user.isAnonymous) {
      showAlert('במצב אורח, לא ניתן למחוק שחקנים קבועים. אנא התחבר.');
      return;
    }

    showConfirm('האם אתה בטוח שברצונך למחוק שחקן זה?', async () => {
      try {
        // הנתיב תוקן בהתאם לכללי האבטחה
        const playerDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/players`, playerId);
        await deleteDoc(playerDocRef);
        setPlayers(players.filter(player => player.id !== playerId));
        showAlert('שחקן נמחק בהצלחה!');
      } catch (error) {
        console.error('שגיאה במחיקת שחקן:', error);
        showAlert(`שגיאה במחיקת שחקן: ${error.message || error}`);
      }
    });
  };

  if (loadingAuth) {
    return (
      <div className="page-container player-management-container">
        <p style={{ textAlign: 'center', color: 'var(--text-color)' }}>טוען...</p>
      </div>
    );
  }

  if (!user) {
    // אם אין משתמש, ה-useEffect כבר יפנה לדף הכניסה.
    // למען הבטיחות, נציג הודעת טעינה או נחכה לניתוב.
    return (
      <div className="page-container player-management-container">
        <p style={{ textAlign: 'center', color: 'var(--text-color)' }}>מפנה לדף הכניסה...</p>
      </div>
    );
  }

  if (loadingPlayers) {
    return (
      <div className="page-container player-management-container">
        <h2><FontAwesomeIcon icon={faUsers} /> ניהול שחקנים</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-color)' }}>טוען שחקנים...</p>
      </div>
    );
  }

  if (errorPlayers) {
    return (
      <div className="page-container player-management-container">
        <h2><FontAwesomeIcon icon={faUsers} /> ניהול שחקנים</h2>
        <p style={{ textAlign: 'center', color: 'var(--danger-color)' }}>{errorPlayers}</p>
      </div>
    );
  }

  return (
    <div className="page-container player-management-container">
      <CustomModal
        isOpen={modal.isOpen}
        message={modal.message}
        type={modal.type}
        onConfirm={modal.onConfirm}
        onCancel={modal.onCancel}
      />

      <h2><FontAwesomeIcon icon={faUsers} /> ניהול שחקנים</h2>

      <div className="section add-player-section">
        <h3><FontAwesomeIcon icon={faUserPlus} /> הוסף שחקן חדש</h3>
        <form onSubmit={handleAddPlayer} className="add-player-form">
          <input
            type="text"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            placeholder="שם שחקן"
          />
          <button type="submit">
            <FontAwesomeIcon icon={faSave} /> הוסף שחקן
          </button>
        </form>
      </div>

      {players.length === 0 ? (
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
