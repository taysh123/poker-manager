import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook, faHandshake, faTrophy, faChartLine, faUsers, faHome } from '@fortawesome/free-solid-svg-icons';
import './Homepage.css'; // תיקון: שינוי ל-Homepage.css (H גדולה, p קטנה)

function Homepage() { // תיקון: שינוי ל-Homepage (H גדולה, p קטנה)
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        // אם אין משתמש, נווט לדף הכניסה הראשי
        navigate('/');
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  if (loadingAuth) {
    return (
      <div className="page-container home-page-container">
        <p style={{ textAlign: 'center', color: 'var(--text-color)' }}>טוען...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page-container home-page-container">
        <p style={{ textAlign: 'center', color: 'var(--text-color)' }}>מפנה לדף הכניסה...</p>
      </div>
    );
  }

  return (
    <div className="page-container home-page-container">
      <h2>ברוך הבא, {user.displayName || user.email || 'משתמש'}!</h2>
      <p>בחר פעולה מהתפריט למעלה או מהקישורים הבאים:</p>

      <div className="home-links-grid">
        <div className="home-link-card" onClick={() => navigate('/cash-game')}>
          <FontAwesomeIcon icon={faHandshake} size="2x" />
          <h3>ניהול משחק קאש</h3>
          <p>התחל משחק קאש חדש ותעד אותו.</p>
        </div>
        <div className="home-link-card" onClick={() => navigate('/tournament')}>
          <FontAwesomeIcon icon={faTrophy} size="2x" />
          <h3>ניהול טורניר</h3>
          <p>הגדר ונהל טורניר פוקר.</p>
        </div>
        <div className="home-link-card" onClick={() => navigate('/sessions')}>
          <FontAwesomeIcon icon={faChartLine} size="2x" />
          <h3>משחקים שמורים</h3>
          <p>צפה בהיסטוריית המשחקים שלך.</p>
        </div>
        <div className="home-link-card" onClick={() => navigate('/player-stats')}>
          <FontAwesomeIcon icon={faUsers} size="2x" />
          <h3>סטטיסטיקות שחקנים</h3>
          <p>עקוב אחר ביצועי השחקנים.</p>
        </div>
        <div className="home-link-card" onClick={() => navigate('/player-management')}>
          <FontAwesomeIcon icon={faUsers} size="2x" />
          <h3>ניהול שחקנים</h3>
          <p>הוסף וערוך שחקנים קבועים.</p>
        </div>
        <div className="home-link-card" onClick={() => navigate('/poker-journal')}>
          <FontAwesomeIcon icon={faBook} size="2x" />
          <h3>יומן פוקר</h3>
          <p>תעד ידיים מעניינות ומחשבות.</p>
        </div>
      </div>
    </div>
  );
}

export default Homepage; 
