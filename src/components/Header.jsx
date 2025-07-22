import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import './Header.css'; // ודא שקובץ ה-CSS מיובא כראוי

// ייבוא תמונת הלוגו שהעלית. הנתיב חייב להיות יחסי למיקום הקובץ Header.jsx
import logoImage from '../assets/output (5).jpg';

// ייבוא אייקונים מ-FontAwesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faHome, faCoins, faSignInAlt, faSignOutAlt, faUsers, faBook, faUserFriends, faTrophy, faClipboardList } from '@fortawesome/free-solid-svg-icons';


function Header({ user }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const auth = getAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('שגיאה ביציאה:', error);
    }
  };

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className="app-header">
      <div className="logo-container">
        {/* הלוגו הוא כעת תמונה שמקושרת לדף הבית. */}
        <Link to="/home" className="logo-link">
          <img src={logoImage} alt="Poker App Logo" className="logo-img" />
          <span>Poker App</span>
        </Link>
      </div>

      <nav className={`main-nav ${isMobileMenuOpen ? 'open' : ''}`}>
        <ul>
          {user ? (
            <>
              {/* כפתור "בית" הוסר מכאן, מכיוון שהלוגו משמש כעת למטרה זו */}
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
              {/* הקישור לעמוד מעקב אישי */}
              <li>
                <NavLink to="/personal-tracking" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                  <FontAwesomeIcon icon={faChartLine} /> מעקב אישי
                </NavLink>
              </li>
              <li>
                <button onClick={handleLogout} className="logout-button">
                  התנתק
                </button>
              </li>
            </>
          ) : (
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

      <button className="hamburger-menu" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
        ☰
      </button>
    </header>
  );
}

export default Header;