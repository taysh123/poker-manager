import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import './Header.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook, faHandshake, faTrophy, faChartLine, faUsers, faHome, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';

function Header({ user }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      navigate('/'); // חזור לדף הכניסה הראשי
    } catch (error) {
      console.error('שגיאה בהתנתקות:', error);
      alert('שגיאה בהתנתקות. נסה שוב.');
    }
  };

  return (
    <header className="app-header">
      <div className="logo-container">
        {/* לוגו פשוט - SVG */}
        <Link to={user ? "/home" : "/"} className="logo-link">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7V17L12 22L22 17V7L12 2ZM12 4.14L19.74 8.27L12 12.4L4.26 8.27L12 4.14ZM4 9.33L11 13.17V20.42L4 16.58V9.33ZM13 20.42V13.17L20 9.33V16.58L13 20.42Z" fill="var(--secondary-color)"/>
          </svg>
          <span className="app-title">Poker App</span>
        </Link>
      </div>
      <nav className="main-nav">
        <ul>
          {user ? (
            <>
              <li><Link to="/home"><FontAwesomeIcon icon={faHome} /> בית</Link></li>
              <li><Link to="/cash-game"><FontAwesomeIcon icon={faHandshake} /> ניהול קאש</Link></li>
              <li><Link to="/tournament"><FontAwesomeIcon icon={faTrophy} /> טורניר</Link></li>
              <li><Link to="/sessions"><FontAwesomeIcon icon={faChartLine} /> משחקים שמורים</Link></li>
              <li><Link to="/player-stats"><FontAwesomeIcon icon={faUsers} /> סטטיסטיקות</Link></li>
              <li><Link to="/player-management"><FontAwesomeIcon icon={faUsers} /> ניהול שחקנים</Link></li>
              <li><Link to="/poker-journal"><FontAwesomeIcon icon={faBook} /> יומן פוקר</Link></li> {/* קישור חדש ליומן פוקר */}
              <li><button onClick={handleLogout} className="logout-button"><FontAwesomeIcon icon={faSignOutAlt} /> התנתק</button></li>
            </>
          ) : (
            <li><Link to="/login">התחברות</Link></li>
          )}
        </ul>
      </nav>
    </header>
  );
}

export default Header;
