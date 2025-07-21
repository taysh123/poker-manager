import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import HomePage from './pages/HomePage';
import PokerJournal from './pages/PokerJournal'; // ייבוא יומן פוקר
import './App.css';
import './firebase'; // וודא ש-Firebase מאותחל

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
    return <div className="loading-screen">טוען אפליקציה...</div>;
  }

  return (
    <Router>
      <Header user={user} />
      <Routes>
        <Route path="/" element={user ? <Navigate to="/home" /> : <LoginMainPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={user ? <HomePage /> : <Navigate to="/" />} />
        <Route path="/cash-game" element={user ? <CashGame /> : <Navigate to="/" />} />
        <Route path="/tournament" element={user ? <Tournament /> : <Navigate to="/" />} />
        <Route path="/sessions" element={user ? <Sessions /> : <Navigate to="/" />} />
        <Route path="/player-stats" element={user ? <PlayerStats /> : <Navigate to="/" />} />
        <Route path="/player-management" element={user ? <PlayerManagement /> : <Navigate to="/" />} />
        <Route path="/poker-journal" element={user ? <PokerJournal /> : <Navigate to="/" />} /> {/* נתיב חדש */}
      </Routes>
    </Router>
  );
}

export default App;