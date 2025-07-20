import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoins, faUsers, faTrophy, faPlus, faMinus, faTimes } from '@fortawesome/free-solid-svg-icons';
import TournamentTimer from './TournamentTimer';
import './Tournament.css';
import { getAuth, onAuthStateChanged } from 'firebase/auth'; // Import Firebase Auth

const REALISTIC_BLIND_STRUCTURES = {
  'MTT': [
    { level: 1, smallBlind: 50, bigBlind: 100, ante: 100, duration: 900 },
    { level: 2, smallBlind: 100, bigBlind: 200, ante: 200, duration: 900 },
    { level: 3, smallBlind: 150, bigBlind: 300, ante: 300, duration: 900 },
    { level: 4, smallBlind: 200, bigBlind: 400, ante: 400, duration: 900 },
    { level: 5, smallBlind: 300, bigBlind: 600, ante: 600, duration: 900 },
    { level: 6, smallBlind: 400, bigBlind: 800, ante: 800, duration: 900 },
    { level: 7, smallBlind: 500, bigBlind: 1000, ante: 1000, duration: 900 },
    { level: 8, smallBlind: 600, bigBlind: 1200, ante: 1200, duration: 900 },
    { level: 9, smallBlind: 800, bigBlind: 1600, ante: 1600, duration: 900 },
    { level: 10, smallBlind: 1000, bigBlind: 2000, ante: 2000, duration: 900 },
    { level: 11, smallBlind: 1500, bigBlind: 3000, ante: 3000, duration: 900 },
    { level: 12, smallBlind: 2000, bigBlind: 4000, ante: 4000, duration: 900 },
    { level: 13, smallBlind: 3000, bigBlind: 6000, ante: 6000, duration: 900 },
    { level: 14, smallBlind: 4000, bigBlind: 8000, ante: 8000, duration: 900 },
    { level: 15, smallBlind: 5000, bigBlind: 10000, ante: 10000, duration: 900 },
    { level: 16, smallBlind: 6000, bigBlind: 12000, ante: 12000, duration: 900 },
    { level: 17, smallBlind: 8000, bigBlind: 16000, ante: 16000, duration: 900 },
    { level: 18, smallBlind: 10000, bigBlind: 20000, ante: 20000, duration: 900 },
    { level: 19, smallBlind: 15000, bigBlind: 30000, ante: 30000, duration: 900 },
    { level: 20, smallBlind: 20000, bigBlind: 40000, ante: 40000, duration: 900 },
    { level: 21, smallBlind: 25000, bigBlind: 50000, ante: 50000, duration: 900 },
    { level: 22, smallBlind: 30000, bigBlind: 60000, ante: 60000, duration: 900 },
    { level: 23, smallBlind: 40000, bigBlind: 80000, ante: 80000, duration: 900 },
    { level: 24, smallBlind: 50000, bigBlind: 100000, ante: 100000, duration: 900 },
    { level: 25, smallBlind: 60000, bigBlind: 120000, ante: 120000, duration: 900 },
  ],
  'Deepstack': [
    { level: 1, smallBlind: 50, bigBlind: 100, ante: 100, duration: 1200 },
    { level: 2, smallBlind: 75, bigBlind: 150, ante: 150, duration: 1200 },
    { level: 3, smallBlind: 100, bigBlind: 200, ante: 200, duration: 1200 },
    { level: 4, smallBlind: 150, bigBlind: 300, ante: 300, duration: 1200 },
    { level: 5, smallBlind: 200, bigBlind: 400, ante: 400, duration: 1200 },
    { level: 6, smallBlind: 300, bigBlind: 600, ante: 600, duration: 1200 },
    { level: 7, smallBlind: 400, bigBlind: 800, ante: 800, duration: 1200 },
    { level: 8, smallBlind: 500, bigBlind: 1000, ante: 1000, duration: 1200 },
    { level: 9, smallBlind: 600, bigBlind: 1200, ante: 1200, duration: 1200 },
    { level: 10, smallBlind: 800, bigBlind: 1600, ante: 1600, duration: 1200 },
    { level: 11, smallBlind: 1000, bigBlind: 2000, ante: 2000, duration: 1200 },
    { level: 12, smallBlind: 1200, bigBlind: 2400, ante: 2400, duration: 1200 },
    { level: 13, smallBlind: 1500, bigBlind: 3000, ante: 3000, duration: 1200 },
    { level: 14, smallBlind: 2000, bigBlind: 4000, ante: 4000, duration: 1200 },
    { level: 15, smallBlind: 2500, bigBlind: 5000, ante: 5000, duration: 1200 },
    { level: 16, smallBlind: 3000, bigBlind: 6000, ante: 6000, duration: 1200 },
    { level: 17, smallBlind: 4000, bigBlind: 8000, ante: 8000, duration: 1200 },
    { level: 18, smallBlind: 5000, bigBlind: 10000, ante: 10000, duration: 1200 },
    { level: 19, smallBlind: 6000, bigBlind: 12000, ante: 12000, duration: 1200 },
    { level: 20, smallBlind: 8000, bigBlind: 16000, ante: 16000, duration: 1200 },
    { level: 21, smallBlind: 10000, bigBlind: 20000, ante: 20000, duration: 1200 },
    { level: 22, smallBlind: 12000, bigBlind: 24000, ante: 24000, duration: 1200 },
    { level: 23, smallBlind: 15000, bigBlind: 30000, ante: 30000, duration: 1200 },
    { level: 24, smallBlind: 20000, bigBlind: 40000, ante: 40000, duration: 1200 },
    { level: 25, smallBlind: 25000, bigBlind: 50000, ante: 50000, duration: 1200 },
  ],
  'Monster Stack': [
    { level: 1, smallBlind: 50, bigBlind: 100, ante: 100, duration: 1800 },
    { level: 2, smallBlind: 50, bigBlind: 100, ante: 100, duration: 1800 },
    { level: 3, smallBlind: 75, bigBlind: 150, ante: 150, duration: 1800 },
    { level: 4, smallBlind: 100, bigBlind: 200, ante: 200, duration: 1800 },
    { level: 5, smallBlind: 150, bigBlind: 300, ante: 300, duration: 1800 },
    { level: 6, smallBlind: 200, bigBlind: 400, ante: 400, duration: 1800 },
    { level: 7, smallBlind: 250, bigBlind: 500, ante: 500, duration: 1800 },
    { level: 8, smallBlind: 300, bigBlind: 600, ante: 600, duration: 1800 },
    { level: 9, smallBlind: 400, bigBlind: 800, ante: 800, duration: 1800 },
    { level: 10, smallBlind: 500, bigBlind: 1000, ante: 1000, duration: 1800 },
    { level: 11, smallBlind: 600, bigBlind: 1200, ante: 1200, duration: 1800 },
    { level: 12, smallBlind: 800, bigBlind: 1600, ante: 1600, duration: 1800 },
    { level: 13, smallBlind: 1000, bigBlind: 2000, ante: 2000, duration: 1800 },
    { level: 14, smallBlind: 1200, bigBlind: 2400, ante: 2400, duration: 1800 },
    { level: 15, smallBlind: 1500, bigBlind: 3000, ante: 3000, duration: 1800 },
    { level: 16, smallBlind: 2000, bigBlind: 4000, ante: 4000, duration: 1800 },
    { level: 17, smallBlind: 2500, bigBlind: 5000, ante: 5000, duration: 1800 },
    { level: 18, smallBlind: 3000, bigBlind: 6000, ante: 6000, duration: 1800 },
    { level: 19, smallBlind: 4000, bigBlind: 8000, ante: 8000, duration: 1800 },
    { level: 20, smallBlind: 5000, bigBlind: 10000, ante: 10000, duration: 1800 },
    { level: 21, smallBlind: 6000, bigBlind: 12000, ante: 12000, duration: 1800 },
    { level: 22, smallBlind: 8000, bigBlind: 16000, ante: 16000, duration: 1800 },
    { level: 23, smallBlind: 10000, bigBlind: 20000, ante: 20000, duration: 1800 },
    { level: 24, smallBlind: 12000, bigBlind: 24000, ante: 24000, duration: 1800 },
    { level: 25, smallBlind: 15000, bigBlind: 30000, ante: 30000, duration: 1800 },
  ],
};

const INITIAL_CUSTOM_STRUCTURE = [
  { level: 1, smallBlind: 10, bigBlind: 20, ante: 20, duration: 300 },
  { level: 2, smallBlind: 20, bigBlind: 40, ante: 40, duration: 300 },
];

function Tournament() {
  const [user, setUser] = useState(null); // State to hold user authentication status
  const [loadingAuth, setLoadingAuth] = useState(true); // State to track auth loading

  const [buyIn, setBuyIn] = useState(0);
  const [numRebuys, setNumRebuys] = useState(0);
  const [numWinners, setNumWinners] = useState(3);
  const [prizePercentages, setPrizePercentages] = useState([50, 30, 20]);
  const [prizes, setPrizes] = useState([]);
  const [selectedStructure, setSelectedStructure] = useState('MTT');
  const [blindLevels, setBlindLevels] = useState(REALISTIC_BLIND_STRUCTURES['MTT']);
  const [anteEnabled, setAnteEnabled] = useState(true);
  
  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [initialStack, setInitialStack] = useState(10000);

  useEffect(() => {
    // Listen for authentication state changes
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false); // Auth state is now known
    });

    return () => unsubscribe(); // Cleanup the listener
  }, []);

  useEffect(() => {
    if (selectedStructure !== 'Custom') {
      setBlindLevels(REALISTIC_BLIND_STRUCTURES[selectedStructure]);
    } else {
      setBlindLevels(INITIAL_CUSTOM_STRUCTURE);
    }
  }, [selectedStructure]);

  const handlePercentageChange = (index, value) => {
    const newPercentages = [...prizePercentages];
    newPercentages[index] = parseInt(value) || 0;
    setPrizePercentages(newPercentages);
  };

  const handleNumWinnersChange = (e) => {
    const newNumWinners = parseInt(e.target.value) || 1;
    setNumWinners(newNumWinners);
    setPrizePercentages(Array(newNumWinners).fill(0));
  };

  const calculatePrizes = () => {
    const totalPlayers = players.length;
    const totalPrizePool = (totalPlayers + numRebuys) * buyIn;
    const totalPercentage = prizePercentages.reduce((sum, p) => sum + p, 0);
    if (totalPercentage !== 100) {
      alert("סך האחוזים חייב להיות 100%.");
      return;
    }
    const calculatedPrizes = prizePercentages.map((p, index) => {
      const amount = (totalPrizePool * p) / 100;
      return { place: index + 1, amount: amount.toFixed(2) };
    });
    setPrizes(calculatedPrizes);
  };

  const handleLevelChange = (index, field, value) => {
    const newLevels = [...blindLevels];
    newLevels[index][field] = parseInt(value) || 0;
    setBlindLevels(newLevels);
  };

  const addLevel = () => {
    const lastLevel = blindLevels[blindLevels.length - 1];
    setBlindLevels([
      ...blindLevels,
      {
        level: lastLevel ? lastLevel.level + 1 : 1,
        smallBlind: lastLevel ? lastLevel.smallBlind : 10,
        bigBlind: lastLevel ? lastLevel.bigBlind : 20,
        ante: lastLevel ? lastLevel.bigBlind : 20,
        duration: lastLevel ? lastLevel.duration : 300,
      },
    ]);
  };
  
  const add10Levels = () => {
    const newLevels = [...blindLevels];
    
    for (let i = 1; i <= 10; i++) {
        const previousLevel = newLevels[newLevels.length - 1];
        let newSmallBlind, newBigBlind;

        if (selectedStructure === 'Deepstack') {
            newSmallBlind = previousLevel.smallBlind + (previousLevel.bigBlind / 4);
            newBigBlind = previousLevel.bigBlind + (previousLevel.bigBlind / 2);
        } else if (selectedStructure === 'Monster Stack') {
            newSmallBlind = previousLevel.smallBlind + (previousLevel.bigBlind / 8);
            newBigBlind = previousLevel.bigBlind + (previousLevel.bigBlind / 4);
        } else {
            newSmallBlind = previousLevel.smallBlind * 1.5;
            newBigBlind = previousLevel.bigBlind * 1.5;
        }

        const newDuration = previousLevel.duration;
        const newAnte = newBigBlind;

        newLevels.push({
            level: previousLevel.level + 1,
            smallBlind: Math.round(newSmallBlind),
            bigBlind: Math.round(newBigBlind),
            ante: Math.round(newAnte),
            duration: newDuration,
        });
    }
    setBlindLevels(newLevels);
};

  const removeLevel = (index) => {
    setBlindLevels(blindLevels.filter((_, i) => i !== index));
  };
  
  const addPlayer = () => {
      if (newPlayerName.trim() === '') {
          alert("שם השחקן לא יכול להיות ריק.");
          return;
      }
      const newPlayer = {
          id: Date.now(),
          name: newPlayerName,
          stack: initialStack,
          table: null,
      };
      setPlayers([...players, newPlayer]);
      setNewPlayerName('');
  };
  
  const removePlayer = (id) => {
      setPlayers(players.filter(player => player.id !== id));
  };

  // Display loading message while checking authentication
  if (loadingAuth) {
    return (
      <div className="page-container tournament-container">
        <p style={{ textAlign: 'center', color: 'var(--text-color)' }}>טוען...</p>
      </div>
    );
  }

  // Display login message if user is not authenticated
  if (!user) {
    return (
      <div className="page-container tournament-container">
        <h2 style={{ textAlign: 'center', color: 'var(--secondary-color)' }}>גישה מוגבלת</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-color)' }}>
          אנא התחבר כדי לגשת לדף ניהול הטורניר.
        </p>
      </div>
    );
  }
  
  return (
    <div className="page-container tournament-container">
      <h2>ניהול טורניר פוקר</h2>

      <div className="section controls">
        <h3><FontAwesomeIcon icon={faCoins} /> הגדרות כלליות</h3>
        <div className="input-group">
          <label><FontAwesomeIcon icon={faCoins} /> סכום כניסה:</label>
          <input type="number" value={buyIn} onChange={(e) => setBuyIn(parseInt(e.target.value) || 0)} placeholder="₪" />
        </div>
        <div className="input-group">
          <label><FontAwesomeIcon icon={faPlus} /> סך הריביים:</label>
          <input type="number" value={numRebuys} onChange={(e) => setNumRebuys(parseInt(e.target.value) || 0)} />
        </div>
        <div className="input-group">
          <label><FontAwesomeIcon icon={faTrophy} /> מספר זוכים:</label>
          <input type="number" value={numWinners} onChange={handleNumWinnersChange} min="1" />
        </div>
        <button onClick={calculatePrizes}>
          חשב פרסים
        </button>
      </div>

      <div className="section prize-distribution-section">
        <h3>חלוקת פרסים</h3>
        <p><strong>קופת פרסים כוללת:</strong> {(players.length + numRebuys) * buyIn} ₪</p>
        {prizePercentages.map((p, index) => (
          <div key={index} className="input-group">
            <label><FontAwesomeIcon icon={faTrophy} /> מקום {index + 1}:</label>
            <input type="number" value={p} onChange={(e) => handlePercentageChange(index, e.target.value)} />
            <span>%</span>
          </div>
        ))}
      </div>
      {prizes.length > 0 && (
        <table className="prize-table">
          <thead>
            <tr><th>מקום</th><th>סכום פרס (₪)</th></tr>
          </thead>
          <tbody>
            {prizes.map((p, i) => (<tr key={i}><td>{p.place}</td><td>{p.amount} ₪</td></tr>))}
          </tbody>
        </table>
      )}

      <div className="section players-section">
          <h3><FontAwesomeIcon icon={faUsers} /> ניהול שחקנים</h3>
          <p><strong>סה"כ שחקנים:</strong> {players.length}</p>
          <div className="add-player-form">
              <input 
                  type="text" 
                  value={newPlayerName} 
                  onChange={(e) => setNewPlayerName(e.target.value)} 
                  placeholder="הזן שם שחקן" 
              />
              <input 
                  type="number" 
                  value={initialStack} 
                  onChange={(e) => setInitialStack(parseInt(e.target.value) || 0)} 
                  placeholder="סטאק התחלתי" 
              />
              <button onClick={addPlayer}>הוסף שחקן</button>
          </div>
          {players.length > 0 && (
              <div className="player-list-container">
                  <table className="player-table">
                      <thead>
                          <tr>
                              <th>שם שחקן</th>
                              <th>סטאק התחלתי</th>
                              <th>פעולות</th>
                          </tr>
                      </thead>
                      <tbody>
                          {players.map(player => (
                              <tr key={player.id}>
                                  <td>{player.name}</td>
                                  <td>{player.stack}</td>
                                  <td>
                                      <button onClick={() => removePlayer(player.id)} className="remove-btn"><FontAwesomeIcon icon={faTimes} /></button>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          )}
      </div>

      <div className="section blind-structure-section">
        <h3><FontAwesomeIcon icon={faCoins} /> הגדרות בליינדים</h3>
        <div className="input-group">
          <label htmlFor="structure-select">בחר מבנה: </label>
          <select id="structure-select" value={selectedStructure} onChange={(e) => setSelectedStructure(e.target.value)}>
            {Object.keys(REALISTIC_BLIND_STRUCTURES).map(key => (<option key={key} value={key}>{key}</option>))}
            <option value="Custom">בנה מבנה בעצמך</option>
          </select>
        </div>
        <div className="input-group">
          <label><input type="checkbox" checked={anteEnabled} onChange={(e) => setAnteEnabled(e.target.checked)} />הפעל אנטה</label>
        </div>
        
        <div className="blind-table-container">
          <table className="blind-table">
            <thead>
              <tr>
                <th>רמה</th>
                <th>S. Blind</th>
                <th>B. Blind</th>
                {anteEnabled && <th>אנטה</th>}
                <th>משך (דקות)</th>
                {selectedStructure === 'Custom' && <th>פעולות</th>}
              </tr>
            </thead>
            <tbody>
              {blindLevels.map((level, index) => (
                <tr key={index}>
                  <td>{level.level}</td>
                  <td>
                    {selectedStructure === 'Custom' ? (
                      <input type="number" value={level.smallBlind} onChange={(e) => handleLevelChange(index, 'smallBlind', e.target.value)} />
                    ) : (
                      level.smallBlind
                    )}
                  </td>
                  <td>
                    {selectedStructure === 'Custom' ? (
                      <input type="number" value={level.bigBlind} onChange={(e) => handleLevelChange(index, 'bigBlind', e.target.value)} />
                    ) : (
                      level.bigBlind
                    )}
                  </td>
                  {anteEnabled && (
                    <td>
                      {selectedStructure === 'Custom' ? (
                        <input type="number" value={level.ante} onChange={(e) => handleLevelChange(index, 'ante', e.target.value)} />
                      ) : (
                        level.ante
                      )}
                    </td>
                  )}
                  <td>
                    {selectedStructure === 'Custom' ? (
                      <input type="number" value={level.duration / 60} onChange={(e) => handleLevelChange(index, 'duration', parseInt(e.target.value) * 60)} />
                    ) : (
                      level.duration / 60
                    )}
                  </td>
                  {selectedStructure === 'Custom' && (
                    <td>
                      <button onClick={() => removeLevel(index)} className="remove-btn"><FontAwesomeIcon icon={faTimes} /></button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="button-group">
          {selectedStructure === 'Custom' && (
            <button onClick={addLevel}><FontAwesomeIcon icon={faPlus} /> הוסף רמה בודדת</button>
          )}
          <button onClick={add10Levels}><FontAwesomeIcon icon={faPlus} /> הוסף 10 רמות</button>
        </div>
      </div>
      
      <TournamentTimer levels={blindLevels} anteEnabled={anteEnabled} />
    </div>
  );
}

export default Tournament;
