import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Tournament from './pages/Tournament';
import CashGame from './pages/CashGame';
import Sessions from './pages/Sessions';
import PlayerStats from './pages/PlayerStats';
import PlayerManagement from './pages/PlayerManagement';
import Login from './pages/Login'; // דף ההתחברות עם מייל וסיסמה
import Register from './pages/Register';
import Homepage from './pages/Homepage'; // דף הבית הישן, אם עדיין בשימוש
import LoginMainPage from './pages/LoginMainPage'; // ייבוא עמוד הכניסה הראשי החדש

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        {/* הנתיב הראשי מפנה כעת לעמוד הכניסה הראשי החדש */}
        <Route path="/" element={<LoginMainPage />} />
        
        {/* נתיבים לדפים השונים */}
        <Route path="/tournament" element={<Tournament />} />
        <Route path="/cash-game" element={<CashGame />} />
        <Route path="/sessions" element={<Sessions />} />
        <Route path="/player-stats" element={<PlayerStats />} />
        <Route path="/player-management" element={<PlayerManagement />} />
        <Route path="/login" element={<Login />} /> {/* נתיב לדף התחברות עם מייל וסיסמה */}
        <Route path="/register" element={<Register />} />
        <Route path="/homepage" element={<Homepage />} /> {/* אם אתה רוצה לשמור את דף הבית הישן */}
        
        {/* ניתוב לכל נתיב לא מוכר שיפנה חזרה לדף הראשי */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
