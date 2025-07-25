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
  const [modalMessage, setModalMessage] = useState(null);
  const [modalType, setModalType] = useState('alert');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

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
          setLoadingEntries(false);
          setErrorEntries('יומן פוקר אינו זמין למשתמשי אורח. אנא התחבר/הרשם.');
        }
      } else {
        navigate('/');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const fetchJournalEntries = async (currentUserId) => {
    setLoadingEntries(true);
    setErrorEntries(null);
    try {
      // יומן פוקר הוא נתונים פרטיים של המשתמש
      const journalCollectionRef = collection(db, `artifacts/${appId}/users/${currentUserId}/journalEntries`);
      // הערה: orderBy עלול לדרוש אינדקסים ב-Firestore. אם יש שגיאות, ניתן להסיר את ה-orderBy ולמיין ב-JS.
      const q = query(journalCollectionRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const entriesList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt ? new Date(doc.data().createdAt.seconds * 1000).toLocaleDateString('he-IL') : 'תאריך לא ידוע'
      }));
      setJournalEntries(entriesList);
    } catch (error) {
      console.error("שגיאה בטעינת רשומות יומן:", error);
      setErrorEntries('שגיאה בטעינת רשומות יומן. נסה לרענן את הדף.');
    } finally {
      setLoadingEntries(false);
    }
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (!user || user.isAnonymous) {
      setModalMessage('יומן פוקר אינו זמין למשתמשי אורח. אנא התחבר/הרשם.');
      setModalType('alert');
      return;
    }

    const title = newEntryTitle.trim();
    const content = newEntryContent.trim();

    if (!title || !content) {
      setModalMessage('יש למלא גם כותרת וגם תוכן לרשומה.');
      setModalType('alert');
      return;
    }

    try {
      const journalCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/journalEntries`);
      await addDoc(journalCollectionRef, {
        title,
        content,
        createdAt: new Date(),
        userId: userId // שמירת ה-userId לרשומה
      });
      setNewEntryTitle('');
      setNewEntryContent('');
      fetchJournalEntries(userId); // רענן את רשימת הרשומות
      setModalMessage('רשומה נוספה בהצלחה!');
      setModalType('alert');
    } catch (error) {
      console.error("שגיאה בהוספת רשומה:", error);
      setModalMessage('שגיאה בהוספת רשומה. נסה שוב.');
      setModalType('alert');
    }
  };

  const handleDeleteEntry = (id) => {
    setConfirmDeleteId(id);
    setModalMessage('האם אתה בטוח שברצונך למחוק רשומה זו? פעולה זו בלתי הפיכה.');
    setModalType('confirm');
  };

  const confirmDelete = async () => {
    if (!user || user.isAnonymous) {
      setModalMessage('יומן פוקר אינו זמין למשתמשי אורח. אנא התחבר/הרשם.');
      setModalType('alert');
      setConfirmDeleteId(null);
      return;
    }

    try {
      await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/journalEntries`, confirmDeleteId));
      fetchJournalEntries(userId); // רענן את רשימת הרשומות
      setModalMessage('רשומה נמחקה בהצלחה!');
      setModalType('alert');
    } catch (error) {
      console.error("שגיאה במחיקת רשומה:", error);
      setModalMessage('שגיאה במחיקת רשומה. נסה שוב.');
      setModalType('alert');
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const cancelDelete = () => {
    setConfirmDeleteId(null);
    setModalMessage(null);
  };

  const closeModal = () => {
    setModalMessage(null);
    setModalType('alert');
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
      <h2><FontAwesomeIcon icon={faBook} /> יומן פוקר</h2>
      <p className="text-center text-gray-600 mb-8">
        תיעד את סשני הפוקר שלך, ניתוחי ידיים, מחשבות ושיעורים כדי לשפר את המשחק שלך לאורך זמן.
      </p>

      <div className="section add-entry-section">
        <h3><FontAwesomeIcon icon={faPlus} /> הוסף רשומה חדשה</h3>
        <form onSubmit={handleAddEntry} className="add-entry-form">
          <input
            type="text"
            value={newEntryTitle}
            onChange={(e) => setNewEntryTitle(e.target.value)}
            placeholder="כותרת הרשומה (לדוגמה: 'ניתוח יד: פלוט בנהר')"
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
      <CustomModal
        message={modalMessage}
        onConfirm={confirmDeleteId ? confirmDelete : closeModal}
        onCancel={cancelDelete}
        type={modalType}
      />
    </div>
  );
}

export default PokerJournal;
