import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import Header from './components/Header';
import LoginMainPage from './pages/LoginMainPage';
import Login from './pages/Login';
import Register from './pages/Register';
import CashGame from './pages/CashGame';
import Tournament from './pages/Tournament';
import Sessions from './pages/Sessions';
import PlayerStats from './pages/PlayerStats';
import PlayerManagement from './pages/PlayerManagement';
import Homepage from './pages/Homepage';
import PokerJournal from './pages/PokerJournal';
import PersonalTracking from './PersonalTracking'; // ייבוא הקומפוננטה החדשה למעקב אישי
import './App.css';
import './firebase'; // ודא ש-Firebase מאותחל

// ייבוא אייקונים חדשים עבור הניווט
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faHome, faCoins, faSignInAlt, faSignOutAlt, faUsers, faBook, faUserFriends, faTrophy, faClipboardList } from '@fortawesome/free-solid-svg-icons';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        טוען אפליקציה...
      </div>
    );
  }

  return (
    <Router>
      {/* רכיב ה-Header מכיל את הניווט */}
      <Header user={user}>
        {/* הוספת קישורי ניווט ל-Header */}
        <nav className="navbar">
          {user ? (
            <>
              <NavLink to="/home" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <FontAwesomeIcon icon={faHome} /> בית
              </NavLink>
              <NavLink to="/cash-game" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <FontAwesomeIcon icon={faCoins} /> משחק מזומן
              </NavLink>
              <NavLink to="/tournament" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <FontAwesomeIcon icon={faTrophy} /> טורניר
              </NavLink>
              <NavLink to="/sessions" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <FontAwesomeIcon icon={faClipboardList} /> סשנים
              </NavLink>
              <NavLink to="/player-stats" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <FontAwesomeIcon icon={faUsers} /> סטטיסטיקות שחקנים
              </NavLink>
              <NavLink to="/player-management" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <FontAwesomeIcon icon={faUserFriends} /> ניהול שחקנים
              </NavLink>
              <NavLink to="/poker-journal" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <FontAwesomeIcon icon={faBook} /> יומן פוקר
              </NavLink>
              {/* הקישור החדש לעמוד מעקב אישי */}
              <NavLink to="/personal-tracking" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <FontAwesomeIcon icon={faChartLine} /> מעקב אישי
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/login" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <FontAwesomeIcon icon={faSignInAlt} /> התחברות
              </NavLink>
              <NavLink to="/register" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <FontAwesomeIcon icon={faSignOutAlt} /> הרשמה
              </NavLink>
            </>
          )}
        </nav>
      </Header>

      {/* אלמנט ה-main-content-area צריך לעטוף את ה-Routes כדי שה-padding-top יחול עליהם */}
      <main className="main-content-area">
        <Routes>
          <Route path="/" element={user ? <Navigate to="/home" /> : <LoginMainPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/home" element={user ? <Homepage /> : <Navigate to="/" />} />
          <Route path="/cash-game" element={user ? <CashGame /> : <Navigate to="/" />} />
          <Route path="/tournament" element={user ? <Tournament /> : <Navigate to="/" />} />
          <Route path="/sessions" element={user ? <Sessions /> : <Navigate to="/" />} />
          <Route path="/player-stats" element={user ? <PlayerStats /> : <Navigate to="/" />} />
          <Route path="/player-management" element={user ? <PlayerManagement /> : <Navigate to="/" />} />
          <Route path="/poker-journal" element={user ? <PokerJournal /> : <Navigate to="/" />} />
          {/* הוספת המסלול החדש עבור עמוד המעקב האישי */}
          <Route path="/personal-tracking" element={user ? <PersonalTracking /> : <Navigate to="/" />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;