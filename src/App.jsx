import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

import HomePage from './pages/HomePage';
import CashGame from './pages/CashGame';
import PlayerStats from './pages/PlayerStats';
import Sessions from './pages/Sessions';
import Tournament from './pages/Tournament'; // אם יש לך עמוד טורניר

function App() {
  return (
    <Router>
      <nav style={{ padding: 10, background: '#eee', display: 'flex', gap: 10 }}>
        <Link to="/">בית</Link>
        <Link to="/cash">ניהול קאש</Link>
        <Link to="/sessions">משחקים שמורים</Link>
        <Link to="/player-stats">סטטיסטיקות שחקנים</Link>
        <Link to="/tournament">ניהול טורניר</Link>
      </nav>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/cash" element={<CashGame />} />
        <Route path="/sessions" element={<Sessions />} />
        <Route path="/player-stats" element={<PlayerStats />} />
        <Route path="/tournament" element={<Tournament />} />
      </Routes>
    </Router>
  );
}

export default App;
