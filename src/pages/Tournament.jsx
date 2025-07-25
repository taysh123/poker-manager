import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoins, faUsers, faTrophy, faPlus, faMinus, faTimes } from '@fortawesome/free-solid-svg-icons';
import TournamentTimer from './TournamentTimer';
import './Tournament.css';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

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

function Tournament() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const navigate = useNavigate();

  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [buyIn, setBuyIn] = useState('');
  const [startingStack, setStartingStack] = useState('');
  const [prizeStructure, setPrizeStructure] = useState([]);
  const [numWinners, setNumWinners] = useState(3);
  const [totalPrizePool, setTotalPrizePool] = useState(0);

  const [selectedStructure, setSelectedStructure] = useState('MTT');
  const [blindLevels, setBlindLevels] = useState(REALISTIC_BLIND_STRUCTURES[selectedStructure]);
  const [anteEnabled, setAnteEnabled] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        navigate('/'); // Redirect to login if not authenticated
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    // עדכן את מבנה הבליינדים כאשר נבחר מבנה אחר
    if (selectedStructure !== 'Custom') {
      setBlindLevels(REALISTIC_BLIND_STRUCTURES[selectedStructure]);
    }
  }, [selectedStructure]);

  useEffect(() => {
    // חשב מחדש את סך קופת הפרסים כאשר מספר השחקנים או ה-Buy-in משתנים
    const total = players.length * (parseFloat(buyIn) || 0);
    setTotalPrizePool(total);
    calculatePrizeStructure(total, numWinners);
  }, [players.length, buyIn, numWinners]);

  const handleNumericInputChange = (setterFunction) => (e) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setterFunction(value);
    }
  };

  const addPlayer = () => {
    if (newPlayerName.trim()) {
      setPlayers([...players, newPlayerName.trim()]);
      setNewPlayerName('');
    }
  };

  const removePlayer = (indexToRemove) => {
    setPlayers(players.filter((_, index) => index !== indexToRemove));
  };

  const calculatePrizeStructure = (currentTotalPrizePool, winnersCount) => {
    const structure = [];
    if (currentTotalPrizePool > 0 && winnersCount > 0) {
      const percentages = [];
      if (winnersCount === 1) percentages.push(1);
      else if (winnersCount === 2) percentages.push(0.65, 0.35);
      else if (winnersCount === 3) percentages.push(0.5, 0.3, 0.2);
      else if (winnersCount === 4) percentages.push(0.4, 0.25, 0.2, 0.15);
      else if (winnersCount === 5) percentages.push(0.35, 0.22, 0.18, 0.13, 0.12);
      else { // עבור יותר מ-5 זוכים, ניתן ליצור לוגיקה מורכבת יותר או לפשט
        for (let i = 0; i < winnersCount; i++) {
          percentages.push(1 / winnersCount); // חלוקה שווה כברירת מחדל
        }
      }

      for (let i = 0; i < winnersCount; i++) {
        structure.push({
          place: i + 1,
          amount: currentTotalPrizePool * (percentages[i] || 0),
        });
      }
    }
    setPrizeStructure(structure);
  };

  const addLevel = () => {
    const lastLevel = blindLevels[blindLevels.length - 1];
    setBlindLevels([...blindLevels, {
      level: (lastLevel ? lastLevel.level : 0) + 1,
      smallBlind: lastLevel ? lastLevel.smallBlind * 2 : 50,
      bigBlind: lastLevel ? lastLevel.bigBlind * 2 : 100,
      ante: lastLevel ? lastLevel.ante * 2 : 100,
      duration: lastLevel ? lastLevel.duration : 600, // 10 דקות כברירת מחדל
    }]);
  };

  const add10Levels = () => {
    let currentLevels = [...blindLevels];
    for (let i = 0; i < 10; i++) {
      const lastLevel = currentLevels[currentLevels.length - 1];
      currentLevels.push({
        level: (lastLevel ? lastLevel.level : 0) + 1,
        smallBlind: lastLevel ? Math.round(lastLevel.smallBlind * 1.5) : 50,
        bigBlind: lastLevel ? Math.round(lastLevel.bigBlind * 1.5) : 100,
        ante: lastLevel ? Math.round(lastLevel.ante * 1.5) : 100,
        duration: lastLevel ? lastLevel.duration : 600,
      });
    }
    setBlindLevels(currentLevels);
  };

  const removeLevel = (indexToRemove) => {
    setBlindLevels(blindLevels.filter((_, index) => index !== indexToRemove));
  };

  const handleLevelChange = (index, field, value) => {
    const updatedLevels = blindLevels.map((level, i) => {
      if (i === index) {
        return { ...level, [field]: value };
      }
      return level;
    });
    setBlindLevels(updatedLevels);
  };

  if (loadingAuth) {
    return (
      <div className="tournament-container">
        <h2>טוען...</h2>
      </div>
    );
  }

  return (
    <div className="tournament-container">
      <h2><FontAwesomeIcon icon={faTrophy} /> ניהול טורניר</h2>
      <p className="text-center text-gray-600 mb-8">
        הגדר את פרטי הטורניר, כולל שחקנים, מבנה פרסים ומבנה בליינדים.
      </p>

      <div className="section players-section">
        <h3><FontAwesomeIcon icon={faUsers} /> שחקנים</h3>
        <div className="add-player-form">
          <input
            type="text"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            placeholder="שם שחקן"
          />
          <button onClick={addPlayer}>
            <FontAwesomeIcon icon={faPlus} /> הוסף שחקן
          </button>
        </div>
        {players.length > 0 && (
          <ul className="players-list">
            {players.map((player, index) => (
              <li key={index}>
                {player}
                <button onClick={() => removePlayer(index)} className="remove-btn">
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="section tournament-details-section">
        <h3><FontAwesomeIcon icon={faCoins} /> פרטי טורניר</h3>
        <div className="input-group">
          <label htmlFor="buy-in">Buy-in לטורניר (₪):</label>
          <input
            id="buy-in"
            type="number"
            value={buyIn}
            onChange={handleNumericInputChange(setBuyIn)}
            placeholder="סכום כניסה"
            min="0"
            step="0.01"
          />
        </div>
        <div className="input-group">
          <label htmlFor="starting-stack">Starting Stack (צ'יפים):</label>
          <input
            id="starting-stack"
            type="number"
            value={startingStack}
            onChange={handleNumericInputChange(setStartingStack)}
            placeholder="כמות צ'יפים התחלתית"
            min="0"
            step="1"
          />
        </div>
        <div className="input-group">
          <label htmlFor="num-winners">מספר זוכים:</label>
          <input
            id="num-winners"
            type="number"
            value={numWinners}
            onChange={(e) => setNumWinners(parseInt(e.target.value) || 0)}
            min="0"
            step="1"
          />
        </div>

        <div className="prize-distribution-section">
          <h3><FontAwesomeIcon icon={faTrophy} /> חלוקת פרסים</h3>
          <p>סה"כ קופת פרסים: {totalPrizePool.toFixed(2)} ₪</p>
          {prizeStructure.length > 0 ? (
            <table className="prize-table">
              <thead>
                <tr>
                  <th>מקום</th>
                  <th>פרס (₪)</th>
                </tr>
              </thead>
              <tbody>
                {prizeStructure.map((prize, index) => (
                  <tr key={index}>
                    <td>{prize.place}</td>
                    <td>{prize.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>הזן שחקנים ו-Buy-in כדי לראות את חלוקת הפרסים.</p>
          )}
        </div>
      </div>

      <div className="section blind-structure-section">
        <h3><FontAwesomeIcon icon={faCoins} /> מבנה בליינדים</h3>
        <div className="input-group">
          <label htmlFor="blind-structure-select">בחר מבנה מוגדר מראש:</label>
          <select
            id="blind-structure-select"
            value={selectedStructure}
            onChange={(e) => setSelectedStructure(e.target.value)}
          >
            <option value="MTT">MTT (Multi-Table Tournament)</option>
            <option value="Deepstack">Deepstack</option>
            <option value="Monster Stack">Monster Stack</option>
            <option value="Custom">מותאם אישית</option>
          </select>
        </div>

        <div className="input-group checkbox-group">
          <label htmlFor="ante-enabled">הפעל אנטה:</label>
          <input
            type="checkbox"
            id="ante-enabled"
            checked={anteEnabled}
            onChange={(e) => setAnteEnabled(e.target.checked)}
          />
        </div>

        <div className="blind-table-container">
          <table className="blind-table">
            <thead>
              <tr>
                <th>רמה</th>
                <th>בליינד קטן</th>
                <th>בליינד גדול</th>
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
                      <input
                        type="number"
                        value={level.smallBlind}
                        onChange={handleNumericInputChange((val) => handleLevelChange(index, 'smallBlind', Number(val)))}
                        min="0"
                      />
                    ) : (
                      level.smallBlind
                    )}
                  </td>
                  <td>
                    {selectedStructure === 'Custom' ? (
                      <input
                        type="number"
                        value={level.bigBlind}
                        onChange={handleNumericInputChange((val) => handleLevelChange(index, 'bigBlind', Number(val)))}
                        min="0"
                      />
                    ) : (
                      level.bigBlind
                    )}
                  </td>
                  {anteEnabled && (
                    <td>
                      {selectedStructure === 'Custom' ? (
                        <input
                          type="number"
                          value={level.ante}
                          onChange={handleNumericInputChange((val) => handleLevelChange(index, 'ante', Number(val)))}
                          min="0"
                        />
                      ) : (
                        level.ante
                      )}
                    </td>
                  )}
                  <td>
                    {selectedStructure === 'Custom' ? (
                      <input 
                        type="number" 
                        value={level.duration / 60} 
                        onChange={handleNumericInputChange((val) => handleLevelChange(index, 'duration', Number(val) * 60))} // שימוש בפונקציה החדשה
                        min="0"
                      />
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