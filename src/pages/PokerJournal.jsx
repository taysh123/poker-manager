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
      // הסרתי orderBy('createdAt', 'desc') כדי למנוע שגיאות אינדקס בפיירסטור.
      // המיון יתבצע בזיכרון.
      const querySnapshot = await getDocs(journalCollectionRef);
      const entriesList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate().toLocaleString('he-IL'), // המרה לפורמט תאריך מקומי
      }));
      // מיון בזיכרון לאחר קבלת הנתונים
      entriesList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setJournalEntries(entriesList);
    } catch (err) {
      console.error("שגיאה בשליפת רשומות יומן:", err);
      setErrorEntries("שגיאה בטעינת רשומות היומן: " + err.message);
    } finally {
      setLoadingEntries(false);
    }
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (!user || user.isAnonymous) {
      openModal('יש להתחבר כדי להוסיף רשומות יומן.', 'alert');
      return;
    }
    if (!newEntryTitle.trim() || !newEntryContent.trim()) {
      openModal('אנא הזן כותרת ותוכן לרשומה.', 'alert');
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
      fetchJournalEntries(userId); // רענן את רשימת הרשומות
      openModal('רשומה נוספה בהצלחה!', 'alert');
    } catch (err) {
      console.error("שגיאה בהוספת רשומה:", err);
      openModal("שגיאה בהוספת רשומה: " + err.message, 'alert');
    }
  };

  const handleDeleteEntry = (entryId) => {
    if (!user || user.isAnonymous) {
      openModal('יש להתחבר כדי למחוק רשומות יומן.', 'alert');
      return;
    }
    openModal('האם אתה בטוח שברצונך למחוק רשומה זו לצמיתות?', 'confirm', async () => {
      try {
        const entryDocRef = doc(db, `artifacts/${appId}/users/${userId}/pokerJournal`, entryId);
        await deleteDoc(entryDocRef);
        fetchJournalEntries(userId); // רענן את רשימת הרשומות
        openModal('רשומה נמחקה בהצלחה!', 'alert');
      } catch (err) {
        console.error("שגיאה במחיקת רשומה:", err);
        openModal("שגיאה במחיקת רשומה: " + err.message, 'alert');
      } finally {
        closeModal();
      }
    });
  };

  if (loadingAuth) {
    return (
      <div className="poker-journal-container">
        <h2>טוען...</h2>
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
        תיעד את הידיים, המחשבות והניתוחים שלך מכל סשן פוקר.
      </p>

      <div className="section add-entry-section">
        <h3><FontAwesomeIcon icon={faPlus} /> הוסף רשומה חדשה</h3>
        <form onSubmit={handleAddEntry} className="add-entry-form">
          <input
            type="text"
            value={newEntryTitle}
            onChange={(e) => setNewEntryTitle(e.target.value)}
            placeholder="כותרת הרשומה (לדוגמה: יד מפתח, טעות נפוצה)"
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