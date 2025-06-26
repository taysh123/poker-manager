import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CashGame from './pages/CashGame';
import Tournament from './pages/Tournament';
import Sessions from './pages/Sessions'; // חדש

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/cash" element={<CashGame />} />
        <Route path="/tournament" element={<Tournament />} />
        <Route path="/sessions" element={<Sessions />} /> {/* חדש */}
      </Routes>
    </Router>
  );
}

export default App;
