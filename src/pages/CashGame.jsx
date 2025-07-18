import React, { useState, useEffect } from 'react';

function CashGame() {
  const [chipRatio, setChipRatio] = useState(1);
  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerEntry, setNewPlayerEntry] = useState('');
  const [finalResults, setFinalResults] = useState({});
  const [debts, setDebts] = useState([]);

  // --- שחקנים קבועים שמורים ב-localStorage ---
  const [savedPlayers, setSavedPlayers] = useState([]);
  const [savedPlayerName, setSavedPlayerName] = useState('');
  const [savedPlayerEntry, setSavedPlayerEntry] = useState('');

  useEffect(() => {
    const sp = JSON.parse(localStorage.getItem('savedPlayers') || '[]');
    setSavedPlayers(sp);
  }, []);

  // הוספת שחקן קבוע
  const addSavedPlayer = () => {
    const name = savedPlayerName.trim();
    const entry = parseFloat(savedPlayerEntry);
    if (!name || isNaN(entry) || entry <= 0) {
      alert('יש להזין שם וכניסה תקינה לשחקן קבוע');
      return;
    }
    if (savedPlayers.find(p => p.name === name)) {
      alert('שחקן קבוע עם שם זה כבר קיים');
      return;
    }
    const updated = [...savedPlayers, { name, entry }];
    setSavedPlayers(updated);
    localStorage.setItem('savedPlayers', JSON.stringify(updated));
    setSavedPlayerName('');
    setSavedPlayerEntry('');
  };

  // הוספת שחקן קבוע למשחק הנוכחי
  const addPlayerFromSaved = (player) => {
    if (players.find(p => p.name === player.name)) {
      alert('השחקן כבר קיים במשחק');
      return;
    }
    setPlayers([...players, { name: player.name, entries: [player.entry] }]);
  };

  const addPlayer = () => {
    const name = newPlayerName.trim();
    const entry = parseFloat(newPlayerEntry);
    if (!name || isNaN(entry) || entry <= 0) {
      alert('יש להזין שם וכניסה תקינה');
      return;
    }
    if (players.find(p => p.name === name)) {
      alert('שחקן עם שם זה כבר קיים במשחק');
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

  // מחיקת שחקן קבוע
  const deleteSavedPlayer = (name) => {
    const filtered = savedPlayers.filter(p => p.name !== name);
    setSavedPlayers(filtered);
    localStorage.setItem('savedPlayers', JSON.stringify(filtered));
  };

  const calculateAndSaveStats = (allGames) => {
    const playersSet = new Set();
    allGames.forEach(game => {
      game.players.forEach(p => playersSet.add(p.name));
    });
    const players = Array.from(playersSet);

    const stats = {};
    players.forEach(playerName => {
      let wins = 0, losses = 0, totalProfit = 0, gamesPlayed = 0;

      allGames.forEach(game => {
        const player = game.players.find(p => p.name === playerName);
        if (!player) return;

        const invested = player.entries.reduce((a,b) => a+b, 0);
        const finalChips = game.finalResults[playerName] || 0;
        const profitMoney = (finalChips - invested * game.chipRatio) / game.chipRatio;

        if (profitMoney > 0) wins++;
        else if (profitMoney < 0) losses++;

        totalProfit += profitMoney;
        gamesPlayed++;
      });

      stats[playerName] = { wins, losses, totalProfit, gamesPlayed };
    });

    localStorage.setItem('playerStats', JSON.stringify(stats));
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

    const game = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      chipRatio,
      players,
      finalResults,
      debts: newDebts,
    };
    const existing = JSON.parse(localStorage.getItem('cashGames') || '[]');
    const updatedGames = [...existing, game];
    localStorage.setItem('cashGames', JSON.stringify(updatedGames));
    alert('המשחק נשמר בהצלחה!');

    calculateAndSaveStats(updatedGames);
  };

  const totalPot = players.reduce((sum, p) => sum + p.entries.reduce((a, b) => a + b, 0), 0);

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: 'auto' }}>
      <h2>ניהול משחק קאש</h2>

      <div>
        <label>כמה שווה צ'יפ בשקלים:
          <input
            type="number"
            value={chipRatio}
            step="0.01"
            min="0.01"
            onChange={e => setChipRatio(parseFloat(e.target.value) || 1)}
          />
        </label>
      </div>

      <h3>הוספת שחקן</h3>
      <input
        type="text"
        placeholder="שם שחקן"
        value={newPlayerName}
        onChange={e => setNewPlayerName(e.target.value)}
      />
      <input
        type="number"
        placeholder="סכום כניסה ראשון"
        value={newPlayerEntry}
        onChange={e => setNewPlayerEntry(e.target.value)}
      />
      <button onClick={addPlayer}>הוסף</button>

      <h4>שחקנים קבועים</h4>
      <div style={{ marginBottom: 15 }}>
        <input
          type="text"
          placeholder="שם שחקן קבוע"
          value={savedPlayerName}
          onChange={e => setSavedPlayerName(e.target.value)}
          style={{ marginRight: 10 }}
        />
        <input
          type="number"
          placeholder="סכום כניסה"
          value={savedPlayerEntry}
          onChange={e => setSavedPlayerEntry(e.target.value)}
          style={{ marginRight: 10 }}
        />
        <button onClick={addSavedPlayer}>שמור שחקן קבוע</button>
      </div>
      <ul>
        {savedPlayers.map((p, i) => (
          <li key={i} style={{ marginBottom: 5 }}>
            {p.name} - כניסה: {p.entry} ₪{' '}
            <button onClick={() => addPlayerFromSaved(p)}>הוסף למשחק</button>{' '}
            <button onClick={() => deleteSavedPlayer(p.name)} style={{ color: 'white', backgroundColor: 'red' }}>
              מחק
            </button>
          </li>
        ))}
      </ul>

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
                <button
                  onClick={() => deletePlayer(i)}
                  style={{ color: 'white', backgroundColor: 'red' }}
                >
                  X
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={calculateProfits} style={{ marginTop: 20 }}>
        חשב חובות ושמור משחק
      </button>

      {debts.length > 0 && (
        <div>
          <h3>חובות בין שחקנים</h3>
          <table border="1" cellPadding="8" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>חייב</th>
                <th>מקבל</th>
                <th>סכום</th>
              </tr>
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
