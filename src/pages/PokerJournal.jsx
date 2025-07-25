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
  const [userId, setUserId] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const navigate = useNavigate();

  const [journalEntries, setJournalEntries] = useState([]);
  const [newEntryTitle, setNewEntryTitle] = useState('');
  const [newEntryContent, setNewEntryContent] = useState('');
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [errorEntries, setErrorEntries] = useState(null);

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
          fetchJournalEntries(currentUser.uid);
        } else {
          setErrorEntries('כדי לנהל יומן פוקר, עליך להיות משתמש רשום.');
          setLoadingEntries(false);
        }
      } else {
        navigate('/');
      }
    });
    return () => unsubscribe();
  }, [navigate, userId]); // הוספת userId כתלות

  const fetchJournalEntries = async (currentUserId) => {
    setLoadingEntries(true);
    setErrorEntries(null);
    try {
      const journalColRef = collection(db, `artifacts/${appId}/users/${currentUserId}/journalEntries`);
      // הסרתי את orderBy() כדי למנוע שגיאות אינדקסים
      const q = query(journalColRef); // יצרתי שאילתה ללא orderBy
      const entrySnapshot = await getDocs(q);
      let entriesList = entrySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate().toLocaleDateString('he-IL') : 'תאריך לא ידוע'
      }));

      // מיין את הרשימה ב-JavaScript לאחר קבלת הנתונים
      entriesList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setJournalEntries(entriesList);
    } catch (e) {
      console.error("שגיאה בטעינת רשומות יומן: ", e);
      setErrorEntries('שגיאה בטעינת רשומות יומן. אנא נסה שוב מאוחר יותר.');
    } finally {
      setLoadingEntries(false);
    }
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (!user || user.isAnonymous) {
      openModal('כדי להוסיף רשומות יומן, עליך להיות משתמש רשום.', 'alert');
      return;
    }
    const title = newEntryTitle.trim();
    const content = newEntryContent.trim();
    if (!title || !content) {
      openModal('יש להזין כותרת ותוכן לרשומה.', 'alert');
      return;
    }

    try {
      await addDoc(collection(db, `artifacts/${appId}/users/${userId}/journalEntries`), {
        title,
        content,
        createdAt: new Date(),
      });
      setNewEntryTitle('');
      setNewEntryContent('');
      openModal('רשומה נוספה בהצלחה!', 'alert', () => fetchJournalEntries(userId));
    } catch (e) {
      console.error("שגיאה בהוספת רשומה: ", e);
      openModal(`שגיאה בהוספת רשומה: ${e.message}`, 'alert');
    }
  };

  const handleDeleteEntry = (entryId) => {
    if (!user || user.isAnonymous) {
      openModal('כדי למחוק רשומות יומן, עליך להיות משתמש רשום.', 'alert');
      return;
    }
    openModal(
      'האם אתה בטוח שברצונך למחוק רשומה זו? פעולה זו בלתי הפיכה.',
      'confirm',
      async () => {
        try {
          await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/journalEntries`, entryId));
          openModal('רשומה נמחקה בהצלחה!', 'alert', () => fetchJournalEntries(userId));
        } catch (e) {
          console.error("שגיאה במחיקת רשומה: ", e);
          openModal(`שגיאה במחיקת רשומה: ${e.message}`, 'alert');
        }
      }
    );
  };

  if (loadingAuth) {
    return (
      <div className="poker-journal-container">
        <p style={{ textAlign: 'center' }}>טוען נתוני משתמש...</p>
      </div>
    );
  }

  return (
    <div className="poker-journal-container">
      <h2><FontAwesomeIcon icon={faBook} /> יומן פוקר</h2>
      <p>כאן תוכל לתעד ידיים, לנתח משחקים ולשמור מחשבות על הפוקר שלך.</p>

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

export default PokerJournal;