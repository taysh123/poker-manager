import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth'; // ייבוא Firebase Auth
import './Header.css';

function Header() {
  const [user, setUser] = useState(null); // מצב לשמירת פרטי המשתמש המחובר
  const navigate = useNavigate(); // Hook לניווט לאחר התנתקות

  useEffect(() => {
    const auth = getAuth();
    // האזנה לשינויים במצב ההתחברות של המשתמש
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    // ניקוי ה-listener כאשר הרכיב נעלם
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth); // התנתקות מ-Firebase
      navigate('/login'); // ניווט לעמוד ההתחברות לאחר התנתקות
    } catch (error) {
      console.error("Error signing out: ", error);
      alert("שגיאה בהתנתקות. נסה שוב.");
    }
  };

  return (
    <header className="main-header">
      <div className="header-content">
        <div className="logo">
          <h1>Poker App</h1>
        </div>
        <nav>
          <ul className="nav-links">
            <li>
              <NavLink
                to="/tournament"
                className={({ isActive }) => (isActive ? 'active' : '')}
              >
                ניהול טורניר
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/cash-game"
                className={({ isActive }) => (isActive ? 'active' : '')}
              >
                ניהול משחק קאש
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/sessions"
                className={({ isActive }) => (isActive ? 'active' : '')}
              >
                משחקים שמורים
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/player-stats"
                className={({ isActive }) => (isActive ? 'active' : '')}
              >
                סטטיסטיקות שחקנים
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/player-management"
                className={({ isActive }) => (isActive ? 'active' : '')}
              >
                ניהול שחקנים
              </NavLink>
            </li>
          </ul>
        </nav>
        <div className="auth-buttons">
          {user ? ( // אם יש משתמש מחובר
            <button onClick={handleLogout} className="logout-button">
              התנתקות
            </button>
          ) : ( // אם אין משתמש מחובר
            <NavLink
              to="/login"
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              התחברות
            </NavLink>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
