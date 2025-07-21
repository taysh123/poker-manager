import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import './Header.css'; // ודא שקובץ ה-CSS מיובא כראוי

// ייבוא תמונת הלוגו שהעלית. הנתיב חייב להיות יחסי למיקום הקובץ Header.jsx
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
      // ניתן להציג הודעת שגיאה למשתמש במקרה של כשל בהתנתקות
    }
  };

  // useEffect לטיפול בסגירת תפריט המובייל אוטומטית בעת שינוי נתיב
  useEffect(() => {
    setIsMobileMenuOpen(false); // סגור את התפריט
  }, [location.pathname]); // הפעל מחדש כאשר נתיב ה-URL משתנה

  return (
    <header className="app-header">
      <div className="logo-container">
        {/* הלוגו הוא כעת תמונה שמקושרת לדף הבית.
            ה-Link to="/home" הופך את הלוגו לכפתור "בית". */}
        <Link to="/home" className="logo-link">
          {/* תגית ה-img מציגה את הלוגו. ה-className "logo-img" משמש לעיצוב ב-CSS. */}
          <img src={logoImage} alt="Poker App Logo" className="logo-img" />
          {/* טקסט ליד הלוגו. ניתן להסירו אם לא נחוץ. */}
          <span>Poker App</span>
        </Link>
      </div>

      {/* תפריט הניווט הראשי. הקלאס 'open' מופעל כאשר תפריט המובייל פתוח. */}
      <nav className={`main-nav ${isMobileMenuOpen ? 'open' : ''}`}>
        <ul>
          {user ? (
            // אם המשתמש מחובר, הצג את פריטי התפריט עבור משתמשים מחוברים
            <>
              {/* כפתור "דף הבית" הוסר מכאן, מכיוון שהלוגו משמש כעת למטרה זו */}
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

      {/* כפתור המבורגר (מוצג רק במובייל באמצעות CSS) */}
      <button className="hamburger-menu" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
        ☰ {/* אייקון המבורגר פשוט */}
      </button>
    </header>
  );
}

export default Header;
