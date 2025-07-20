import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Tournament from './pages/Tournament';
import CashGame from './pages/CashGame';
import Sessions from './pages/Sessions'; // ייבוא רכיב Sessions
import PlayerStats from './pages/PlayerStats'; // ייבוא רכיב PlayerStats
import PlayerManagement from './pages/PlayerManagement'; // ייבוא רכיב PlayerManagement
import Login from './pages/Login'; // ייבוא רכיב Login
import Register from './pages/Register'; // ייבוא רכיב Register
import Homepage from './pages/Homepage'; // ודא שזה Homepage

function App() {
  return (
    <Router>
      {/* רכיב ה-Header יופיע בראש כל העמודים */}
      <Header />
      <Routes>
        {/* ניתוב ברירת מחדל לעמוד הטורניר */}
        <Route path="/" element={<Navigate to="/tournament" />} />
        
        {/* ניתובים לעמודים השונים */}
        <Route path="/tournament" element={<Tournament />} />
        <Route path="/cash-game" element={<CashGame />} />
        <Route path="/sessions" element={<Sessions />} />
        <Route path="/player-stats" element={<PlayerStats />} />
        <Route path="/player-management" element={<PlayerManagement />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/homepage" element={<Homepage />} />
      </Routes>
    </Router>
  );
}

export default App;
