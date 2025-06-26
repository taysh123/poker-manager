import { useState } from 'react';

function calculateSettlements(players) {
    const settlements = [];
  
    const profits = players.map(p => ({
      name: p.name,
      amount: p.cashOut - p.buyIn,
    }));
  
    const debtors = profits.filter(p => p.amount < 0).map(p => ({ ...p, amount: -p.amount }));
    const creditors = profits.filter(p => p.amount > 0);
  
    let i = 0, j = 0;
  
    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
  
      const payment = Math.min(debtor.amount, creditor.amount);
  
      settlements.push({
        from: debtor.name,
        to: creditor.name,
        amount: payment,
      });
  
      debtor.amount -= payment;
      creditor.amount -= payment;
  
      if (debtor.amount === 0) i++;
      if (creditor.amount === 0) j++;
    }
  
    return settlements;
}


function Game() {
  const [players, setPlayers] = useState([]);
  const [name, setName] = useState('');
  const [buyIn, setBuyIn] = useState('');
  const [cashOut, setCashOut] = useState('');

  const settlements = calculateSettlements(players);

  const addPlayer = () => {
    const newPlayer = {
      name,
      buyIn: Number(buyIn),
      cashOut: Number(cashOut),
    };

    setPlayers([...players, newPlayer]);

    setName('');
    setBuyIn('');
    setCashOut('');
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>ניהול משחק פוקר - קאש</h2>

      <input
        placeholder="שם שחקן"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        placeholder="Buy-In"
        type="number"
        value={buyIn}
        onChange={(e) => setBuyIn(e.target.value)}
      />
      <input
        placeholder="Cash-Out"
        type="number"
        value={cashOut}
        onChange={(e) => setCashOut(e.target.value)}
      />
      <button onClick={addPlayer}>➕ הוסף שחקן</button>

      <h3>שחקנים:</h3>
      <ul>
        {players.map((p, i) => {
          const profit = p.cashOut - p.buyIn;
          return (
            <li key={i}>
             {p.name} | קנה ב־{p.buyIn} | יצא עם {p.cashOut} | רווח/הפסד: {profit}
            </li>
        );
       })}
      </ul>
       
      <h3>חישוב חובות בין שחקנים:</h3>
      <ul>
        {settlements.length === 0 && <li>אין חובות או המשחק עדיין ריק</li>}
        {settlements.map((s, i) => (
         <li key={i}>
           {s.from} חייב לשלם ל־{s.to} סכום של {s.amount}
         </li>
        ))}
      </ul>
     </div>
    );
}

export default Game;
