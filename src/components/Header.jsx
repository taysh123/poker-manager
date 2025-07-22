import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom'; // NavLink לא נחוץ כאן יותר כי הוא ב-App.jsx
import { getAuth, signOut } from 'firebase/auth';
import './Header.css'; // ודא שקובץ ה-CSS מיובא כראוי
import logoImage from '../assets/output (5).jpg';

function Header({ user, children }) { // הוספנו 'children' ל-props
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
        {/* הלוגו הוא כעת תמונה שמקושרת לדף הבית. */}
        <Link to="/home" className="logo-link">
          <img src={logoImage} alt="Poker App Logo" className="logo-img" />
          <span>Poker App</span>
        </Link>
      </div>

      {/* תפריט הניווט הראשי. הקלאס 'open' מופעל כאשר תפריט המובייל פתוח. */}
      {/* במקום לבנות את ה-ul/li כאן, נציג את ה-children שמועברים מ-App.jsx */}
      <nav className={`main-nav ${isMobileMenuOpen ? 'open' : ''}`}>
        {/* כאן נציג את ה-children - שהם ה-NavLink's מ-App.jsx */}
        {children}
        {user && ( // הוספת כפתור התנתקות כאן, כי הוא ספציפי ל-Header
          <ul className="logout-nav-item"> {/* קלאס חדש לעיצוב */}
            <li>
              <button onClick={handleLogout} className="logout-button">
                התנתק
              </button>
            </li>
          </ul>
        )}
      </nav>

      {/* כפתור המבורגר (מוצג רק במובייל באמצעות CSS) */}
      <button className="hamburger-menu" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
        ☰ {/* אייקון המבורגר פשוט */}
      </button>
    </header>
  );
}

export default Header;
