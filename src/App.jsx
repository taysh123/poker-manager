import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged, signInWithCustomToken, signInAnonymously } from 'firebase/auth'; // ייבוא signInWithCustomToken ו-signInAnonymously
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
import PersonalTracking from './pages/PersonalTracking'; // ייבוא רכיב מעקב אישי
import DashboardSettings from './pages/DashboardSettings'; // ייבוא רכיב הגדרות דאשבורד
import './App.css';
import './firebase'; // ודא ש-Firebase מאותחל

// ודא ש-db מיובא מ-firebase.js אם אתה משתמש בו ישירות כאן
// import { db } from './firebase.js'; // אם db נחוץ כאן, ודא שהוא מיובא

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();

    // פונקציה לאימות ראשוני
    const authenticateUser = async () => {
      try {
        // נסה להיכנס עם טוקן מותאם אישית אם קיים
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          // אם אין טוקן, היכנס כאנונימי
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("שגיאה באימות Firebase:", error);
        // במקרה של שגיאה, עדיין אפשר להמשיך ללא משתמש מחובר
      }
    };

    // האזנה לשינויים במצב האימות
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // קריאה לפונקציית האימות כאשר הקומפוננטה נטענת
    authenticateUser();

    // ניקוי המאזין בעת פירוק הקומפוננטה
    return () => unsubscribe();
  }, []); // ריצה פעם אחת בלבד בעת טעינת הקומפוננטה

  if (loading) {
    return (
      <div className="loading-screen">
        טוען אפליקציה...
      </div>
    );
  }

  return (
    <Router>
      <Header user={user} />
      {/* אלמנט ה-main-content-area צריך לעטוף את ה-Routes כדי שה-padding-top יחול עליהם */}
      <main className="main-content-area">
        <Routes>
          {/* ניתוב לדף הבית אם משתמש מחובר, אחרת לדף הכניסה הראשי */}
          <Route path="/" element={user ? <Navigate to="/home" /> : <LoginMainPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {/* דפים הדורשים אימות */}
          <Route path="/home" element={user ? <Homepage /> : <Navigate to="/" />} />
          <Route path="/cash-game" element={user ? <CashGame /> : <Navigate to="/" />} />
          <Route path="/tournament" element={user ? <Tournament /> : <Navigate to="/" />} />
          <Route path="/sessions" element={user ? <Sessions /> : <Navigate to="/" />} />
          <Route path="/player-stats" element={user ? <PlayerStats /> : <Navigate to="/" />} />
          <Route path="/player-management" element={user ? <PlayerManagement /> : <Navigate to="/" />} />
          <Route path="/poker-journal" element={user ? <PokerJournal /> : <Navigate to="/" />} />
          <Route path="/personal-tracking" element={user ? <PersonalTracking /> : <Navigate to="/" />} /> {/* נתיב חדש למעקב אישי */}
          <Route path="/dashboard-settings" element={user ? <DashboardSettings /> : <Navigate to="/" />} /> {/* נתיב חדש להגדרות דאשבורד */}
        </Routes>
      </main>
    </Router>
  );
}

export default App;