import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'; // ייבוא NavLink
import { getAuth, signOut } from 'firebase/auth';
import './Header.css'; // ודא שקובץ ה-CSS מיובא כראוי

// ייבוא תמונת הלוגו שהעלית. הנתיב חייב להיות יחסי למיקום הקובץ Header.jsx
import logoImage from '../assets/output (5).jpg';

// ייבוא אייקונים מ-FontAwesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faHome, faCoins, faSignInAlt, faSignOutAlt, faUsers, faBook, faUserFriends, faTrophy, faClipboardList } from '@fortawesome/free-solid-svg-icons';


function Header({ user }) { // הסרנו את children מה-props מכיוון שאנו בונים את הניווט כאן
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
              <li>
                <NavLink to="/home" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                  <FontAwesomeIcon icon={faHome} /> בית
                </NavLink>
              </li>
              <li>
                <NavLink to="/cash-game" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                  <FontAwesomeIcon icon={faCoins} /> משחק קאש
                </NavLink>
              </li>
              <li>
                <NavLink to="/tournament" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                  <FontAwesomeIcon icon={faTrophy} /> טורניר
                </NavLink>
              </li>
              <li>
                <NavLink to="/sessions" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                  <FontAwesomeIcon icon={faClipboardList} /> סשנים
                </NavLink>
              </li>
              <li>
                <NavLink to="/player-stats" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                  <FontAwesomeIcon icon={faUsers} /> סטטיסטיקות שחקנים
                </NavLink>
              </li>
              <li>
                <NavLink to="/player-management" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                  <FontAwesomeIcon icon={faUserFriends} /> ניהול שחקנים
                </NavLink>
              </li>
              <li>
                <NavLink to="/poker-journal" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                  <FontAwesomeIcon icon={faBook} /> יומן פוקר
                </NavLink>
              </li>
              {/* הקישור החדש לעמוד מעקב אישי */}
              <li>
                <NavLink to="/personal-tracking" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                  <FontAwesomeIcon icon={faChartLine} /> מעקב אישי
                </NavLink>
              </li>
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
              <li>
                <NavLink to="/login" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                  <FontAwesomeIcon icon={faSignInAlt} /> התחבר
                </NavLink>
              </li>
              <li>
                <NavLink to="/register" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                  <FontAwesomeIcon icon={faSignOutAlt} /> הירשם
                </NavLink>
              </li>
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