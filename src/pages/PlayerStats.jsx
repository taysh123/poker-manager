import React, { useState, useEffect } from 'react';

function PlayerStats() {
  const [stats, setStats] = useState({});
  const [savedPlayers, setSavedPlayers] = useState([]);

  useEffect(() => {
    const storedStats = JSON.parse(localStorage.getItem('playerStats') || '{}');
    const sp = JSON.parse(localStorage.getItem('savedPlayers') || '[]');
    setStats(storedStats);
    setSavedPlayers(sp);
  }, []);

  // איחוד שמות השחקנים מהסטטיסטיקות ומהשחקנים הקבועים
  const playerNames = Array.from(new Set([...Object.keys(stats), ...savedPlayers.map(p => p.name)]));

  if (playerNames.length === 0) {
    return <p style={{ padding: 20, textAlign: 'center' }}>אין סטטיסטיקות להצגה.</p>;
  }

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: 'auto' }}>
      <h2>סטטיסטיקת שחקנים בקאש</h2>
      <table border="1" cellPadding="8" style={{ width: '100%' }}>
        <thead>
          <tr>
            <th>שם שחקן</th>
            <th>משחקים</th>
            <th>נצחונות</th>
            <th>הפסדים</th>
            <th>רווח כולל (₪)</th>
          </tr>
        </thead>
        <tbody>
          {playerNames.map(name => {
            const s = stats[name] || { gamesPlayed: 0, wins: 0, losses: 0, totalProfit: 0 };
            return (
              <tr key={name}>
                <td>{name}</td>
                <td>{s.gamesPlayed}</td>
                <td>{s.wins}</td>
                <td>{s.losses}</td>
                <td>{s.totalProfit.toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default PlayerStats;
