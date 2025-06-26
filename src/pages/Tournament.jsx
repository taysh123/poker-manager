import { useState } from 'react';
import TournamentTimer from './TournamentTimer';

function Tournament() {
  const [buyIn, setBuyIn] = useState(100);
  const [numPlayers, setNumPlayers] = useState(0);
  const [numRebuys, setNumRebuys] = useState(0);
  const [numWinners, setNumWinners] = useState(3);
  const [prizeDistribution, setPrizeDistribution] = useState([]);

  const calculatePrizes = () => {
    const totalPrizePool = (numPlayers + numRebuys) * buyIn;
    const percentages = [0.5, 0.3, 0.2];
    const actualPercentages = percentages.slice(0, numWinners);

    const prizes = actualPercentages.map((p, index) => ({
      place: index + 1,
      amount: Math.round(totalPrizePool * p),
    }));

    setPrizeDistribution(prizes);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>🏆 ניהול טורניר פוקר משולב</h2>

      <div style={{ marginBottom: '20px' }}>
        <label>💰 סכום כניסה: </label>
        <input
          type="number"
          value={buyIn}
          onChange={(e) => setBuyIn(parseInt(e.target.value) || 0)}
        />

        <label style={{ marginLeft: '10px' }}>👥 מספר שחקנים: </label>
        <input
          type="number"
          value={numPlayers}
          onChange={(e) => setNumPlayers(parseInt(e.target.value) || 0)}
        />

        <label style={{ marginLeft: '10px' }}>🔁 סך הריביים: </label>
        <input
          type="number"
          value={numRebuys}
          onChange={(e) => setNumRebuys(parseInt(e.target.value) || 0)}
        />

        <label style={{ marginLeft: '10px' }}>🏅 מספר זוכים: </label>
        <input
          type="number"
          value={numWinners}
          max={3}
          min={1}
          onChange={(e) => setNumWinners(Math.min(3, Math.max(1, parseInt(e.target.value) || 1)))}
        />

        <button onClick={calculatePrizes} style={{ marginLeft: '10px' }}>
          חשב פרסים
        </button>

        {prizeDistribution.length > 0 && (
          <div style={{ marginTop: '10px' }}>
            <p>💵 קופת פרסים כוללת: {(numPlayers + numRebuys) * buyIn} ₪</p>
            <ul>
              {prizeDistribution.map((prize) => (
                <li key={prize.place}>
                  מקום {prize.place}: {prize.amount} ₪
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <TournamentTimer />
    </div>
  );
}

export default Tournament;
