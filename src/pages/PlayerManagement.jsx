import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth'; // ייבוא signInAnonymously
import { db } from '../firebase'; // ודא שנתיב זה נכון
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus, faUserMinus, faUsers, faSave, faTimes } from '@fortawesome/free-solid-svg-icons';
import './PlayerManagement.css';

function PlayerManagement() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [errorPlayers, setErrorPlayers] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setLoadingAuth(false);
        // טען שחקנים רק אם המשתמש אינו אנונימי
        if (!currentUser.isAnonymous) {
          fetchPlayers(currentUser.uid);
        } else {
          setLoadingPlayers(false);
          setErrorPlayers('ניהול שחקנים קבועים אינו זמין במצב אורח. אנא התחבר כדי לנהל שחקנים.'); // הודעה לאורחים
        }
      } else {
        // אם אין משתמש מחובר, ננסה להתחבר כאורח (אנונימי)
        signInAnonymously(auth)
          .then((guestUserCredential) => {
            setUser(guestUserCredential.user);
            console.log("Signed in anonymously as:", guestUserCredential.user.uid);
            setLoadingAuth(false);
            setLoadingPlayers(false);
            setErrorPlayers('ניהול שחקנים קבועים אינו זמין במצב אורח. אנא התחבר כדי לנהל שחקנים.'); // הודעה לאורחים
          })
          .catch((error) => {
            console.error("Error signing in anonymously:", error);
            setUser(null); 
            setLoadingAuth(false);
            setLoadingPlayers(false);
          });
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchPlayers = async (userId) => {
    setLoadingPlayers(true);
    setErrorPlayers(null);
    try {
      const playersCollection = collection(db, 'users', userId, 'players');
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
    if (!user) {
      alert('שגיאת אימות. אנא רענן את הדף.');
      return;
    }
    if (user.isAnonymous) {
      alert('במצב אורח, לא ניתן לשמור שחקנים קבועים. אנא התחבר.');
      return;
    }

    if (newPlayerName.trim() === '') {
      alert('שם השחקן לא יכול להיות ריק.');
      return;
    }
    if (players.some(p => p.name === newPlayerName.trim())) {
      alert('שחקן בשם זה כבר קיים.');
      return;
    }

    try {
      const playersCollection = collection(db, 'users', user.uid, 'players');
      const docRef = await addDoc(playersCollection, { name: newPlayerName.trim() });
      setPlayers([...players, { id: docRef.id, name: newPlayerName.trim() }]);
      setNewPlayerName('');
      alert('שחקן נוסף בהצלחה!');
    } catch (error) {
      console.error('שגיאה בהוספת שחקן:', error);
      alert('שגיאה בהוספת שחקן.');
    }
  };

  const handleDeletePlayer = async (playerId) => {
    if (!user) {
      alert('שגיאת אימות. אנא רענן את הדף.');
      return;
    }
    if (user.isAnonymous) {
      alert('במצב אורח, לא ניתן למחוק שחקנים קבועים. אנא התחבר.');
      return;
    }

    // במקום confirm(), נשתמש באלרט זמני
    const confirmed = window.confirm('האם אתה בטוח שברצונך למחוק שחקן זה?');
    if (!confirmed) return;

    try {
      const playerDocRef = doc(db, 'users', user.uid, 'players', playerId);
      await deleteDoc(playerDocRef);
      setPlayers(players.filter(player => player.id !== playerId));
      alert('שחקן נמחק בהצלחה!');
    } catch (error) {
      console.error('שגיאה במחיקת שחקן:', error);
      alert('שגיאה במחיקת שחקן.');
    }
  };

  if (loadingAuth) {
    return (
      <div className="page-container player-management-container">
        <p style={{ textAlign: 'center', color: 'var(--text-color)' }}>טוען...</p>
      </div>
    );
  }

  // אם אין משתמש (אפילו לא אורח), או אם המשתמש הוא אורח, נציג הודעה מתאימה
  if (!user || user.isAnonymous) {
    return (
      <div className="page-container player-management-container">
        <h2 style={{ textAlign: 'center', color: 'var(--secondary-color)' }}>גישה מוגבלת</h2>
        <p style={{ textAlign: 'center', color: '#FFFFFF' }}>
          ניהול שחקנים קבועים זמין רק למשתמשים רשומים. אנא התחבר כדי לנהל שחקנים.
        </p>
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
