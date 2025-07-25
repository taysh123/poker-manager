import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook, faPlus, faTrashAlt, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import './PokerJournal.css';

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

function PokerJournal() {
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null); // מצב לשמירת ה-userId
  const [loadingAuth, setLoadingAuth] = useState(true);
  const navigate = useNavigate();

  const [journalEntries, setJournalEntries] = useState([]);
  const [newEntryTitle, setNewEntryTitle] = useState('');
  const [newEntryContent, setNewEntryContent] = useState('');
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [errorEntries, setErrorEntries] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('alert');
  const [modalAction, setModalAction] = useState(null);

  // קבלת ה-appId מהמשתנה הגלובלי __app_id
  const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setUserId(currentUser.uid); // שמור את ה-UID
        if (!currentUser.isAnonymous) {
          fetchJournalEntries(currentUser.uid);
        } else {
          setLoadingEntries(false);
          setErrorEntries('יומן פוקר אינו זמין במצב אורח. אנא התחבר כדי להוסיף רשומות.');
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
    setModalAction(() => action);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalMessage('');
    setModalType('alert');
    setModalAction(null);
  };

  const fetchJournalEntries = async (currentUserId) => {
    if (!currentUserId) {
      console.warn("אין User ID, לא ניתן לטעון רשומות יומן.");
      setLoadingEntries(false);
      return;
    }
    setLoadingEntries(true);
    setErrorEntries(null);
    try {
      const journalCollectionRef = collection(db, `artifacts/${appId}/users/${currentUserId}/pokerJournal`);
      const q = query(journalCollectionRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const entriesList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate().toLocaleString()
      }));
      setJournalEntries(entriesList);
    } catch (err) {
      console.error("שגיאה בשליפת רשומות יומן:", err);
      setErrorEntries("שגיאה בטעינת רשומות היומן: " + err.message);
    } finally {
      setLoadingEntries(false);
    }
  };

  const handleAddEntry = async (event) => {
    event.preventDefault();
    if (newEntryTitle.trim() === '' || newEntryContent.trim() === '') {
      openModal('כותרת ותוכן הרשומה לא יכולים להיות ריקים.', 'alert');
      return;
    }

    if (!user || !userId) {
      openModal('שגיאה: משתמש לא מאומת. לא ניתן להוסיף רשומה.', 'alert');
      return;
    }

    try {
      const journalCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/pokerJournal`);
      await addDoc(journalCollectionRef, {
        title: newEntryTitle.trim(),
        content: newEntryContent.trim(),
        createdAt: new Date(),
      });
      setNewEntryTitle('');
      setNewEntryContent('');
      openModal('רשומה נוספה בהצלחה!', 'alert');
      fetchJournalEntries(userId); // רענן את הרשימה
    } catch (error) {
      console.error("שגיאה בהוספת רשומה:", error);
      openModal("שגיאה בהוספת רשומה: " + error.message, 'alert');
    }
  };

  const handleDeleteEntry = (entryId) => {
    openModal('האם אתה בטוח שברצונך למחוק רשומה זו לצמיתות?', 'confirm', async () => {
      if (!user || !userId) {
        openModal('שגיאה: משתמש לא מאומת. לא ניתן למחוק רשומה.', 'alert');
        closeModal();
        return;
      }
      try {
        const entryDocRef = doc(db, `artifacts/${appId}/users/${userId}/pokerJournal`, entryId);
        await deleteDoc(entryDocRef);
        openModal('רשומה נמחקה בהצלחה!', 'alert');
        fetchJournalEntries(userId); // רענן את הרשימה
      } catch (error) {
        console.error("שגיאה במחיקת רשומה:", error);
        openModal("שגיאה במחיקת רשומה: " + error.message, 'alert');
      } finally {
        closeModal();
      }
    });
  };

  if (loadingAuth) {
    return (
      <div className="poker-journal-container">
        <h2>טוען אימות...</h2>
      </div>
    );
  }

  if (!user || user.isAnonymous) {
    return (
      <div className="poker-journal-container">
        <p className="error-message text-center">
          <FontAwesomeIcon icon={faBook} /> כדי לנהל יומן פוקר, עליך להתחבר או להירשם.
        </p>
      </div>
    );
  }

  return (
    <div className="poker-journal-container">
      <CustomModal
        message={modalMessage}
        onConfirm={modalAction}
        onCancel={closeModal}
        type={modalType}
      />

      <h2><FontAwesomeIcon icon={faBook} /> יומן פוקר</h2>
      <p className="text-center text-gray-600 mb-8">
        תעד ונתח את הידיים והסשנים שלך כדי לשפר את המשחק.
      </p>

      <div className="section add-entry-section">
        <h3><FontAwesomeIcon icon={faPlus} /> הוסף רשומה חדשה</h3>
        <form onSubmit={handleAddEntry} className="add-entry-form">
          <input
            type="text"
            value={newEntryTitle}
            onChange={(e) => setNewEntryTitle(e.target.value)}
            placeholder="כותרת הרשומה"
            required
          />
          <textarea
            value={newEntryContent}
            onChange={(e) => setNewEntryContent(e.target.value)}
            placeholder="תוכן הרשומה (ידיים, מחשבות, ניתוחים...)"
            rows="6"
            required
          ></textarea>
          <button type="submit">
            <FontAwesomeIcon icon={faPlus} /> הוסף רשומה
          </button>
        </form>
      </div>

      {loadingEntries ? (
        <p style={{ textAlign: 'center' }}>טוען רשומות יומן...</p>
      ) : errorEntries ? (
        <p className="error-message">{errorEntries}</p>
      ) : journalEntries.length === 0 ? (
        <p style={{ textAlign: 'center' }}>אין רשומות יומן להצגה. הוסף רשומה כדי להתחיל!</p>
      ) : (
        <div className="section journal-entries-list">
          <h3><FontAwesomeIcon icon={faBook} /> רשומות יומן קיימות</h3>
          <div className="entries-grid">
            {journalEntries.map(entry => (
              <div key={entry.id} className="journal-entry-card">
                <h4>{entry.title}</h4>
                <p className="entry-date"><FontAwesomeIcon icon={faCalendarAlt} /> {entry.createdAt}</p>
                <div className="entry-content">
                  <p>{entry.content}</p>
                </div>
                <button onClick={() => handleDeleteEntry(entry.id)} className="delete-btn">
                  <FontAwesomeIcon icon={faTrashAlt} /> מחק
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default PokerJournal;