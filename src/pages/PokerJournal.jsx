import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook, faPlus, faTrashAlt, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import './PokerJournal.css'; // נצטרך ליצור קובץ CSS עבורו

function PokerJournal() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const navigate = useNavigate();

  const [journalEntries, setJournalEntries] = useState([]);
  const [newEntryTitle, setNewEntryTitle] = useState('');
  const [newEntryContent, setNewEntryContent] = useState('');
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [errorEntries, setErrorEntries] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setLoadingAuth(false);
        if (!currentUser.isAnonymous) {
          fetchJournalEntries(currentUser.uid);
        } else {
          setLoadingEntries(false);
          setErrorEntries('יומן פוקר אינו זמין במצב אורח. אנא התחבר כדי להשתמש ביומן.');
        }
      } else {
        navigate('/');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const fetchJournalEntries = async (userId) => {
    setLoadingEntries(true);
    setErrorEntries(null);
    try {
      const journalCollectionRef = collection(db, 'users', userId, 'pokerJournal');
      // נמיין לפי תאריך יצירה בסדר יורד
      const q = query(journalCollectionRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const entriesList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate().toLocaleString() // המרה לתאריך קריא
      }));
      setJournalEntries(entriesList);
      setLoadingEntries(false);
    } catch (err) {
      console.error('שגיאה בשליפת רשומות יומן:', err);
      setErrorEntries('שגיאה בטעינת רשומות היומן. נסה שוב מאוחר יותר.');
      setLoadingEntries(false);
    }
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (!user || user.isAnonymous) {
      alert('יש להתחבר כדי להוסיף רשומות ליומן.');
      return;
    }
    if (newEntryTitle.trim() === '' || newEntryContent.trim() === '') {
      alert('כותרת ותוכן הרשומה לא יכולים להיות ריקים.');
      return;
    }

    try {
      const journalCollectionRef = collection(db, 'users', user.uid, 'pokerJournal');
      await addDoc(journalCollectionRef, {
        title: newEntryTitle.trim(),
        content: newEntryContent.trim(),
        createdAt: new Date(), // שמור תאריך יצירה
      });
      setNewEntryTitle('');
      setNewEntryContent('');
      fetchJournalEntries(user.uid); // רענן את הרשימה
      alert('רשומה נוספה בהצלחה!');
    } catch (error) {
      console.error('שגיאה בהוספת רשומה:', error);
      alert('שגיאה בהוספת רשומה ליומן.');
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!user || user.isAnonymous) {
      alert('יש להתחבר כדי למחוק רשומות מהיומן.');
      return;
    }

    const confirmed = window.confirm('האם אתה בטוח שברצונך למחוק רשומה זו?');
    if (!confirmed) return;

    try {
      const entryDocRef = doc(db, 'users', user.uid, 'pokerJournal', entryId);
      await deleteDoc(entryDocRef);
      fetchJournalEntries(user.uid); // רענן את הרשימה
      alert('רשומה נמחקה בהצלחה!');
    } catch (error) {
      console.error('שגיאה במחיקת רשומה:', error);
      alert('שגיאה במחיקת רשומה מהיומן.');
    }
  };

  if (loadingAuth) {
    return (
      <div className="page-container poker-journal-container">
        <p style={{ textAlign: 'center', color: 'var(--text-color)' }}>טוען...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page-container poker-journal-container">
        <p style={{ textAlign: 'center', color: 'var(--text-color)' }}>מפנה לדף הכניסה...</p>
      </div>
    );
  }

  return (
    <div className="page-container poker-journal-container">
      <h2><FontAwesomeIcon icon={faBook} /> יומן פוקר</h2>

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

      <div className="section journal-entries-list">
        <h3><FontAwesomeIcon icon={faBook} /> רשומות יומן קיימות</h3>
        {loadingEntries ? (
          <p style={{ textAlign: 'center' }}>טוען רשומות יומן...</p>
        ) : errorEntries ? (
          <p className="error-message">{errorEntries}</p>
        ) : journalEntries.length === 0 ? (
          <p style={{ textAlign: 'center' }}>אין רשומות יומן להצגה. הוסף רשומה כדי להתחיל!</p>
        ) : (
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
        )}
      </div>
    </div>
  );
}

export default PokerJournal;
