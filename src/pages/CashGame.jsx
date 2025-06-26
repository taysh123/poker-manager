import React, { useState, useEffect } from 'react';

function CashGame() {
  const [chipRatio, setChipRatio] = useState(1);
  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerEntry, setNewPlayerEntry] = useState('');
  const [finalResults, setFinalResults] = useState({});
  const [debts, setDebts] = useState([]);

  const addPlayer = () => {
    const name = newPlayerName.trim();
    const entry = parseFloat(newPlayerEntry);
    if (!name || isNaN(entry) || entry <= 0) {
      alert('יש להזין שם וכניסה תקינה');
      return;
    }
    setPlayers([...players, { name, entries: [entry] }]);
    setNewPlayerName('');
    setNewPlayerEntry('');
  };

  const addEntry = (index, amount) => {
    const newPlayers = [...players];
    newPlayers[index].entries.push(amount);
    setPlayers(newPlayers);
  };

  const updateFinalResult = (index, chips) => {
    setFinalResults(prev => ({ ...prev, [players[index].name]: parseFloat(chips) || 0 }));
  };

  const deletePlayer = (index) => {
    const updatedPlayers = [...players];
    const name = updatedPlayers[index].name;
    updatedPlayers.splice(index, 1);
    setPlayers(updatedPlayers);
    setFinalResults(prev => {
      const copy = { ...prev };
      delete copy[name];
      return copy;
    });
  };

  const calculateProfits = () => {
    const investments = players.map(p => p.entries.reduce((sum, val) => sum + val, 0));
    const investmentsInChips = investments.map(val => val * chipRatio);

    const profits = players.map((p, i) => {
      const final = finalResults[p.name] || 0;
      const profit = final - investmentsInChips[i];
      return {
        name: p.name,
        invested: investments[i],
        finalChips: final,
        profitMoney: profit / chipRatio,
      };
    });

    let creditors = profits.filter(p => p.profitMoney > 0);
    let debtors = profits.filter(p => p.profitMoney < 0);
    let newDebts = [];

    for (let debtor of debtors) {
      let amountOwed = -debtor.profitMoney;
      for (let i = 0; i < creditors.length && amountOwed > 0; i++) {
        const creditor = creditors[i];
        const available = creditor.profitMoney;
        if (available <= amountOwed) {
          newDebts.push({ from: debtor.name, to: creditor.name, amount: available });
          amountOwed -= available;
          creditor.profitMoney = 0;
        } else {
          newDebts.push({ from: debtor.name, to: creditor.name, amount: amountOwed });
          creditor.profitMoney -= amountOwed;
          amountOwed = 0;
        }
      }
    }

    setDebts(newDebts);

    // Save the game to localStorage
    const game = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      chipRatio,
      players,
      finalResults,
      debts: newDebts,
    };
    const existing = JSON.parse(localStorage.getItem('cashGames') || '[]');
    localStorage.setItem('cashGames', JSON.stringify([...existing, game]));
    alert('המשחק נשמר בהצלחה!');
  };

  const totalPot = players.reduce((sum, p) => sum + p.entries.reduce((a, b) => a + b, 0), 0);

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: 'auto' }}>
      <h2>ניהול משחק קאש</h2>

      <div>
        <label>כמה שווה צ'יפ בשקלים:
          <input type="number" value={chipRatio} step="0.01" min="0.01"
                 onChange={e => setChipRatio(parseFloat(e.target.value) || 1)} />
        </label>
      </div>

      <h3>הוספת שחקן</h3>
      <input type="text" placeholder="שם שחקן" value={newPlayerName} onChange={e => setNewPlayerName(e.target.value)} />
      <input type="number" placeholder="סכום כניסה ראשון" value={newPlayerEntry} onChange={e => setNewPlayerEntry(e.target.value)} />
      <button onClick={addPlayer}>הוסף</button>

      <h4>סכום קופה כולל: {totalPot.toFixed(2)} ₪</h4>

      <table border="1" cellPadding="8" style={{ width: '100%', marginTop: '20px' }}>
        <thead>
          <tr>
            <th>שם</th>
            <th>כניסות (שקלים)</th>
            <th>סכום כולל</th>
            <th>הוסף כניסה</th>
            <th>צ'יפים בסיום</th>
            <th>מחק</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p, i) => (
            <tr key={i}>
              <td>{p.name}</td>
              <td>{p.entries.join(', ')}</td>
              <td>{p.entries.reduce((a, b) => a + b, 0)}</td>
              <td>
                <button onClick={() => addEntry(i, 50)}>+50</button>
                <button onClick={() => addEntry(i, 100)}>+100</button>
              </td>
              <td>
                <input
                  type="number"
                  value={finalResults[p.name] || ''}
                  onChange={e => updateFinalResult(i, e.target.value)}
                />
              </td>
              <td>
                <button onClick={() => deletePlayer(i)} style={{ color: 'white', backgroundColor: 'red' }}>X</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={calculateProfits} style={{ marginTop: 20 }}>חשב חובות ושמור משחק</button>

      {debts.length > 0 && (
        <div>
          <h3>חובות בין שחקנים</h3>
          <table border="1" cellPadding="8" style={{ width: '100%' }}>
            <thead>
              <tr><th>חייב</th><th>מקבל</th><th>סכום</th></tr>
            </thead>
            <tbody>
              {debts.map((d, i) => (
                <tr key={i}>
                  <td>{d.from}</td>
                  <td>{d.to}</td>
                  <td>{d.amount.toFixed(2)} ₪</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default CashGame;
