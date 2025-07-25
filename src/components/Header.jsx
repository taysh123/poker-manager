import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useNavigate, Link } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import './Header.css'; // ודא שקובץ ה-CSS מיובא כראוי

// ייבוא תמונת הלוגו. הנתיב חייב להיות יחסי למיקום הקובץ Header.jsx
// וודא שהתמונה אכן נמצאת בנתיב זה
import logoImage from '../assets/output (5).jpg'; 

function Header({ user }) {
  // מצב לשליטה בפתיחה/סגירה של תפריט המובייל (כפתור המבורגר)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // הוק לניווט בין דפים
  const navigate = useNavigate();
  // הוק לקבלת מידע על הנתיב הנוכחי (לדוגמה, כדי לסגור תפריט כשמנווטים)
  const location = useLocation();

  // אתחול שירות האימות של Firebase
  const auth = getAuth();

  // פונקציה לטיפול בהתנתקות משתמש
  const handleLogout = async () => {
    try {
      await signOut(auth); // ביצוע התנתקות
      navigate('/'); // ניווט לדף הבית לאחר יציאה מוצלחת
    } catch (error) {
      console.error('שגיאה ביציאה:', error);
      // ניתן להציג הודעת שגיאה למשתמש
    }
  };

  // פונקציה לקבלת שם התצוגה של המשתמש
  const getUserDisplayName = () => {
    if (user) {
      if (user.displayName) {
        return user.displayName;
      }
      if (user.email) {
        return user.email.split('@')[0]; // השתמש בחלק הראשון של האימייל כשם
      }
      if (user.isAnonymous) {
        return 'אורח';
      }
    }
    return 'משתמש';
  };

  // סגור את תפריט המובייל בכל ניווט
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  return (
    <header className="app-header">
      {/* לוגו וטקסט Poker Manager */}
      <div className="header-left">
        <Link to="/home" className="logo-link">
          <img src={logoImage} alt="Poker Manager Logo" className="app-logo" />
          <div className="app-title-container">
            <span className="app-title">Poker Manager</span>
          </div>
        </Link>
      </div>

      {/* כפתור המבורגר למובייל */}
      <button 
        className="hamburger-menu" 
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle navigation"
      >
        <span className="hamburger-icon"></span>
        <span className="hamburger-icon"></span>
        <span className="hamburger-icon"></span>
      </button>

      {/* תפריט ניווט ראשי. הקלאס 'open' מופעל כאשר תפריט המובייל פתוח. */}
      <nav className={`main-nav ${isMobileMenuOpen ? 'open' : ''}`}>
        <ul>
          {user ? (
            // אם המשתמש מחובר, הצג את פריטי התפריט עבור משתמשים מחוברים
            <>
              {/* הצגת שם המשתמש */}
              <li className="welcome-message">
                שלום, {getUserDisplayName()}!
              </li>
              <li><Link to="/home">דף הבית</Link></li>
              <li><Link to="/cash-game">משחק קאש</Link></li>
              <li><Link to="/tournament">טורניר</Link></li>
              <li><Link to="/sessions">משחקים שמורים</Link></li>
              <li><Link to="/player-stats">סטטיסטיקות שחקנים</Link></li>
              <li><Link to="/player-management">ניהול שחקנים</Link></li>
              <li><Link to="/poker-journal">יומן פוקר</Link></li>
              <li><Link to="/personal-tracking">מעקב אישי</Link></li>
              <li>
                {/* כפתור התנתקות */}
                <button onClick={handleLogout} className="logout-button">
                  התנתק
                </button>
              </li>
            </>
          ) : (
            // אם המשתמש אינו מחובר, הצג קישורים להתחברות והרשמה
            <>
              <li><Link to="/login">התחבר</Link></li>
              <li><Link to="/register">הירשם</Link></li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
}

export default Header;