import React, { useState, useEffect } from 'react';

function Sessions() {
  const [games, setGames] = useState([]);

  useEffect(() => {
    const storedGames = JSON.parse(localStorage.getItem('cashGames') || '[]');
    setGames(storedGames);
  }, []);

  const deleteGame = (id) => {
    if (!window.confirm('למחוק את המשחק הזה?')) return;
    const filtered = games.filter(g => g.id !== id);
    setGames(filtered);
    localStorage.setItem('cashGames', JSON.stringify(filtered));
  };

  if (games.length === 0) {
    return <p style={{ padding: 20, textAlign: 'center' }}>אין משחקים שמורים להצגה.</p>;
  }

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: 'auto' }}>
      <h2>משחקים שמורים</h2>
      {games.map(game => (
        <div key={game.id} style={{ marginBottom: 30, padding: 15, border: '1px solid #ccc' }}>
          <div><b>תאריך:</b> {game.date}</div>
          <div><b>יחס צ'יפ לשקל:</b> {game.chipRatio}</div>

          <h4>שחקנים:</h4>
          <ul>
            {game.players.map((p, i) => (
              <li key={i}>
                {p.name} - כניסות: {p.entries.join(', ')}
              </li>
            ))}
          </ul>

          <h4>תוצאות סופיות (צ'יפים):</h4>
          <ul>
            {Object.entries(game.finalResults).map(([name, chips]) => (
              <li key={name}>{name}: {chips}</li>
            ))}
          </ul>

          <h4>חובות:</h4>
          <ul>
            {game.debts.map((d, i) => (
              <li key={i}>{d.from} חייב ל-{d.to} {d.amount.toFixed(2)} ₪</li>
            ))}
          </ul>

          <button onClick={() => deleteGame(game.id)} style={{ backgroundColor: 'red', color: 'white', marginTop: 10 }}>
            מחק משחק
          </button>
        </div>
      ))}
    </div>
  );
}

export default Sessions;
