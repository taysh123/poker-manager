import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import './Header.css'; // ודא שקובץ ה-CSS מיובא כראוי

// ייבוא תמונת הלוגו. הנתיב חייב להיות יחסי למיקום הקובץ Header.jsx
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
      // ניתן להציג הודעת שגיאה למשתמש כאן
    }
  };

  // אפקט לסגירת תפריט המובייל אוטומטית כאשר הנתיב משתנה
  useEffect(() => {
    setIsMobileMenuOpen(false); // סגור את התפריט בכל ניווט
  }, [location.pathname]); // תלוי בשינויי הנתיב

  // פונקציה לשינוי מצב תפריט המובייל (פתוח/סגור)
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // פונקציה לקבלת שם המשתמש
  const getUserDisplayName = () => {
    if (user) {
      // אם למשתמש יש displayName, נשתמש בו. אחרת, ננסה להשתמש באימייל.
      return user.displayName || user.email || 'משתמש';
    }
    return 'אורח'; // אם אין משתמש מחובר
  };

  return (
    <header className="app-header">
      {/* אזור הלוגו והכותרת */}
      <div className="header-left">
        {/* הלוגו מקשר לדף הבית רק אם המשתמש מחובר */}
        {user ? (
          <Link to="/home" className="logo-link">
            <img src={logoImage} alt="Poker App Logo" className="app-logo" />
            <span className="app-title">Poker App</span>
          </Link>
        ) : (
          // אם לא מחובר, הלוגו יקשר לדף הכניסה הראשי
          <Link to="/" className="logo-link">
            <img src={logoImage} alt="Poker App Logo" className="app-logo" />
            <span className="app-title">Poker App</span>
          </Link>
        )}
      </div>

      {/* כפתור המבורגר - גלוי רק במובייל */}
      <button className="hamburger-menu" onClick={toggleMobileMenu} aria-label="פתח/סגור תפריט ניווט">
        {/* אייקון המבורגר פשוט באמצעות SVG או CSS */}
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>

      {/* אלמנט הניווט הראשי. הקלאס 'open' מופעל כאשר תפריט המובייל פתוח. */}
      <nav className={`main-nav ${isMobileMenuOpen ? 'open' : ''}`}>
        <ul>
          {user ? (
            // אם המשתמש מחובר, הצג את פריטי התפריט עבור משתמשים מחוברים
            <>
              {/* הצגת שם המשתמש */}
              <li className="welcome-message">
                שלום, {getUserDisplayName()}!
              </li>
              <li><Link to="/home">דף הבית</Link></li> {/* הוספנו קישור לדף הבית */}
              <li><Link to="/cash-game">משחק קאש</Link></li>
              <li><Link to="/tournament">טורניר</Link></li>
              <li><Link to="/sessions">משחקים שמורים</Link></li>
              <li><Link to="/player-stats">סטטיסטיקות שחקנים</Link></li>
              <li><Link to="/player-management">ניהול שחקנים</Link></li>
              <li><Link to="/poker-journal">יומן פוקר</Link></li>
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