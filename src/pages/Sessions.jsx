import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function Sessions() {
  const [games, setGames] = useState([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('cashGames') || '[]');
    setGames(stored);
  }, []);

  const deleteGame = (id) => {
    const filtered = games.filter(g => g.id !== id);
    localStorage.setItem('cashGames', JSON.stringify(filtered));
    setGames(filtered);
  };

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: 'auto' }}>
      <h2>משחקי קאש שמורים</h2>
      <Link to="/">חזרה למסך הראשי</Link>

      {games.length === 0 && <p>אין משחקים שמורים עדיין.</p>}

      {games.map(game => (
        <div key={game.id} style={{ border: '1px solid #ccc', marginTop: 20, padding: 10 }}>
          <h3>תאריך: {game.date}</h3>
          <p>שווי צ'יפ: {game.chipRatio} ש"ח</p>

          <table border="1" cellPadding="8" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>שם</th>
                <th>כניסות</th>
                <th>צ'יפים בסיום</th>
              </tr>
            </thead>
            <tbody>
              {game.players.map((p, i) => (
                <tr key={i}>
                  <td>{p.name}</td>
                  <td>{p.entries.join(', ')}</td>
                  <td>{game.finalResults[p.name] || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h4>חובות:</h4>
          {game.debts.length === 0 && <p>אין חובות.</p>}
          {game.debts.length > 0 && (
            <ul>
              {game.debts.map((d, i) => (
                <li key={i}>{d.from} חייב ל-{d.to} {d.amount.toFixed(2)} ש"ח</li>
              ))}
            </ul>
          )}

          <button onClick={() => deleteGame(game.id)} style={{ color: 'white', backgroundColor: 'red' }}>מחק משחק</button>
        </div>
      ))}
    </div>
  );
}

export default Sessions;