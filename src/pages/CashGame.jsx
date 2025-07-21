import React, { useEffect, useState, useRef } from 'react';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoins, faUsers, faPlus, faTimes, faHandshake, faExchangeAlt, faPercentage, faWallet, faCamera } from '@fortawesome/free-solid-svg-icons';
import './CashGame.css';

// פונקציית עזר לחישוב חובות
function calculateDebts(players) {
  const gains = {};
  const losses = {};
  const debts = [];

  // 1. קבע רווח/הפסד של כל שחקן
  players.forEach(p => {
    const profit = p.cashOut - p.totalBuyIn;
    if (profit > 0) {
      gains[p.name] = profit;
    } else if (profit < 0) {
      losses[p.name] = -profit;
    }
  });

  const gainers = Object.entries(gains).sort(([, a], [, b]) => b - a);
  const losers = Object.entries(losses).sort(([, a], [, b]) => b - a);

  let gIndex = 0;
  let lIndex = 0;

  // 2. חשב את החובות בין שחקנים
  while (gIndex < gainers.length && lIndex < losers.length) {
    const [gainerName, gainerAmount] = gainers[gIndex];
    const [loserName, loserAmount] = losers[lIndex];

    const amount = Math.min(gainerAmount, loserAmount);

    debts.push({
      debtor: loserName,
      creditor: gainerName,
      amount: amount.toFixed(2),
    });

    gainers[gIndex][1] -= amount;
    losers[lIndex][1] -= amount;

    if (gainers[gIndex][1] === 0) gIndex++;
    if (losers[lIndex][1] === 0) lIndex++;
  }

  return debts;
}

function CashGame() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const navigate = useNavigate();

  const [allPlayers, setAllPlayers] = useState([]);
  const [players, setPlayers] = useState([]);
  const [selectedPlayerName, setSelectedPlayerName] = useState('');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [chipsPerShekel, setChipsPerShekel] = useState('');
  const [standardBuyInShekels, setStandardBuyInShekels] = useState('');
  const [standardBuyInChips, setStandardBuyInChips] = useState('');
  const [debts, setDebts] = useState([]);
  const [gameImages, setGameImages] = useState([]); // חדש: מערך לתמונות המשחק הנוכחי
  const fileInputRef = useRef(null); // חדש: רפרנס לקלט קובץ

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setLoadingAuth(false);
        if (!currentUser.isAnonymous) {
          fetchAllPlayers(currentUser.uid);
        } else {
          setAllPlayers([]);
        }
      } else {
        navigate('/');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // עדכון אוטומטי של כניסה סטנדרטית בצ'יפים
  useEffect(() => {
    const shekels = Number(standardBuyInShekels);
    const rate = Number(chipsPerShekel);
    if (rate > 0 && shekels > 0) {
      setStandardBuyInChips(String(shekels * rate));
    } else {
      setStandardBuyInChips('');
    }
  }, [chipsPerShekel, standardBuyInShekels]);

  const fetchAllPlayers = async (userId) => {
    if (!userId) return;
    try {
      const playersCollection = collection(db, 'users', userId, 'players');
      const querySnapshot = await getDocs(playersCollection);
      const playersList = querySnapshot.docs.map(doc => doc.data().name);
      setAllPlayers(playersList);
    } catch (error) {
      console.error('שגיאה בשליפת שחקנים:', error);
    }
  };

  const handleAddPlayer = (e) => {
    e.preventDefault();
    const playerToAdd = selectedPlayerName || newPlayerName.trim();
    
    if (!playerToAdd || players.some(p => p.name === playerToAdd)) {
      return;
    }
    
    const newPlayer = {
      name: playerToAdd,
      entries: [],
      totalBuyIn: 0,
      endingChips: '',
      cashOut: 0,
    };
    setPlayers([...players, newPlayer]);
    setSelectedPlayerName('');
    setNewPlayerName('');
  };

  const handleRemovePlayer = (name) => {
    setPlayers(players.filter(p => p.name !== name));
  };

  const handleAddEntry = (name, entryChips, entryShekels) => {
    const chips = Number(entryChips) || 0;
    const shekels = Number(entryShekels) || 0;

    setPlayers(players.map(p => {
      if (p.name === name) {
        return {
          ...p,
          entries: [...p.entries, { chips: chips, shekels: shekels }],
          totalBuyIn: p.totalBuyIn + shekels,
        };
      }
      return p;
    }));
  };

  // פונקציית עזר לטיפול בקלט מספרי והסרת אפסים מובילים
  const handleNumericInput = (value) => {
    // אם הערך ריק או מכיל רק נקודה עשרונית, החזר אותו כפי שהוא
    if (value === '' || value === '.') {
        return value;
    }
    // אם הערך מתחיל ב-0 ואחריו יש ספרה נוספת (ולא רק "0"), הסר את ה-0 המוביל
    if (value.length > 1 && value.startsWith('0') && value[1] !== '.' ) {
      return String(Number(value)); // המר למספר ואז חזרה למחרוזת כדי להסיר 0 מוביל
    }
    return value;
  };

  const handleChipsPerShekelChange = (e) => {
    const value = handleNumericInput(e.target.value); // השתמש בפונקציית העזר
    setChipsPerShekel(value);
    
    // עדכן CashOut עבור שחקנים קיימים
    setPlayers(players.map(p => {
      const chipCount = Number(p.endingChips);
      const rate = Number(value); // השתמש בערך המנוקה
      const newCashOut = isNaN(chipCount) || rate === 0 ? 0 : chipCount / rate;
      return {
        ...p,
        cashOut: newCashOut,
      };
    }));
  };

  const handleEndingChipsChange = (name, value) => {
    const cleanedValue = handleNumericInput(value); // השתמש בפונקציית העזר

    setPlayers(players.map(p => {
      if (p.name === name) {
        const chipCount = Number(cleanedValue); // השתמש בערך המנוקה
        const rate = Number(chipsPerShekel);
        const newCashOut = isNaN(chipCount) || rate === 0 ? 0 : chipCount / rate;
        return {
          ...p,
          endingChips: cleanedValue, // שמור מחרוזת
          cashOut: newCashOut,
        };
      }
      return p;
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // התמונה נשמרת כ-Base64
        setGameImages(prevImages => [...prevImages, reader.result]);
        alert('תמונה הועלתה בהצלחה! היא תשמר עם פרטי המשחק.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setGameImages(prevImages => prevImages.filter((_, index) => index !== indexToRemove));
  };
  
  const handleCalculateAndSave = async () => {
    if (!user) {
      alert('שגיאת אימות. אנא רענן את הדף.');
      return;
    }

    if (user.isAnonymous) {
      alert('במצב אורח, משחקים אינם נשמרים. אנא התחבר כדי לשמור משחקים.');
      return;
    }

    if (players.length === 0) {
      alert('יש להוסיף שחקנים למשחק.');
      return;
    }

    const calculatedDebts = calculateDebts(players);
    setDebts(calculatedDebts);

    const gameData = {
      players: players.map(p => ({
        name: p.name,
        buyIn: p.totalBuyIn,
        cashOut: p.cashOut,
      })),
      date: new Date(),
      chipsPerShekel: Number(chipsPerShekel),
      images: gameImages, // שמירת התמונות כחלק מנתוני המשחק
    };

    try {
      const userGamesCollection = collection(db, 'users', user.uid, 'cashGames');
      await addDoc(userGamesCollection, gameData);
      alert('המשחק נשמר בהצלחה!');
    } catch (error) {
      console.error('שגיאה בשמירת המשחק:', error);
      alert('שגיאה בשמירת המשחק.');
    }
  };

  if (loadingAuth) {
    return (
      <div className="page-container cash-game-container">
        <p style={{ textAlign: 'center', color: 'var(--text-color)' }}>טוען...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page-container cash-game-container">
        <p style={{ textAlign: 'center', color: 'var(--text-color)' }}>מפנה לדף הכניסה...</p>
      </div>
    );
  }

  return (
    <div className="page-container cash-game-container">
      <h2><FontAwesomeIcon icon={faHandshake} /> ניהול משחק קאש</h2>
      
      <div className="section controls">
        <div className="input-group">
          <label><FontAwesomeIcon icon={faCoins} /> יחס צ'יפים לשקל:</label>
          <input 
            type="number" 
            value={chipsPerShekel} 
            onChange={handleChipsPerShekelChange} 
            placeholder="לדוגמה: 16"
            min="0"
          />
        </div>

        <div className="input-group standard-buy-in-section">
          <label><FontAwesomeIcon icon={faWallet} /> כניסה סטנדרטית:</label>
          <div className="standard-buy-in-inputs">
            <input
              type="number"
              value={standardBuyInShekels}
              onChange={(e) => {
                setStandardBuyInShekels(handleNumericInput(e.target.value));
              }}
              placeholder="שקלים (₪)"
              min="0"
            />
            <span className="or-separator">או</span>
            <input
              type="number"
              value={standardBuyInChips}
              readOnly
              placeholder="צ'יפים"
            />
          </div>
        </div>
      </div>

      <div className="section players-section">
        <h3><FontAwesomeIcon icon={faUsers} /> הוספת שחקן</h3>
        <form onSubmit={handleAddPlayer} className="add-player-form">
          <div className="player-input-group">
            {!user.isAnonymous && (
              <select 
                value={selectedPlayerName} 
                onChange={(e) => {
                  setSelectedPlayerName(e.target.value);
                  setNewPlayerName('');
                }}
              >
                <option value="">בחר שחקן קיים</option>
                {allPlayers.map((name, i) => (
                  <option key={i} value={name}>{name}</option>
                ))}
              </select>
            )}
            {!user.isAnonymous && <span className="or-separator">או</span>}
            <input
              type="text"
              value={newPlayerName}
              onChange={(e) => {
                setNewPlayerName(e.target.value);
                setSelectedPlayerName('');
              }}
              placeholder="הזן שם שחקן חדש"
            />
          </div>
          <button type="submit">הוסף שחקן</button>
        </form>
      </div>

      {players.length > 0 && (
        <div className="section players-list">
          <h3>שחקנים במשחק ({players.length})</h3>
          <div className="cash-game-table-container">
            <table className="cash-game-table">
              <thead>
                <tr>
                  <th>שם</th>
                  <th>כניסות</th>
                  <th>סה"כ השקעה</th>
                  <th>הוסף כניסה</th>
                  <th><FontAwesomeIcon icon={faCoins} /> ציפים בסיום</th>
                  <th>סכום יציאה</th>
                  <th><FontAwesomeIcon icon={faTimes} /> הסר</th>
                </tr>
              </thead>
              <tbody>
                {players.map(p => (
                  <tr key={p.name}>
                    <td className="player-name-cell">{p.name}</td>
                    <td>{p.entries.map(e => `${e.chips}c`).join(', ')}</td>
                    <td className="money-cell">{p.totalBuyIn.toFixed(2)} ₪</td>
                    <td>
                      <div className="button-group">
                        <button 
                          onClick={() => handleAddEntry(p.name, standardBuyInChips, standardBuyInShekels)}
                          disabled={!Number(standardBuyInChips)}
                        >
                          <FontAwesomeIcon icon={faPlus} /> סטנדרטית
                        </button>
                        <button onClick={() => handleAddEntry(p.name, prompt("הזן כמות צ'יפים:"), prompt("הזן סכום כסף:"))}>
                          <FontAwesomeIcon icon={faPlus} /> ידנית
                        </button>
                      </div>
                    </td>
                    <td className="ending-chips-cell">
                      <input
                        type="number"
                        value={p.endingChips}
                        onChange={(e) => handleEndingChipsChange(p.name, e.target.value)}
                        min="0"
                      />
                    </td>
                    <td className="money-cell">{p.cashOut.toFixed(2)} ₪</td>
                    <td>
                      <button onClick={() => handleRemovePlayer(p.name)} className="remove-btn">
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* חדש: העלאת תמונות למשחק הנוכחי */}
      <div className="section image-upload-section">
        <h3><FontAwesomeIcon icon={faCamera} /> תמונות מהמשחק הנוכחי</h3>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          ref={fileInputRef}
          style={{ display: 'none' }} // הסתר את קלט הקובץ המקורי
        />
        <button onClick={() => fileInputRef.current.click()} className="upload-image-button">
          <FontAwesomeIcon icon={faCamera} /> העלה תמונה
        </button>
        <div className="uploaded-images-preview">
          {gameImages.map((image, index) => (
            <div key={index} className="image-preview-item">
              <img src={image} alt={`Game ${index + 1}`} />
              <button onClick={() => handleRemoveImage(index)} className="remove-image-button">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          ))}
        </div>
        {gameImages.length > 0 && (
          <p className="image-note">
            הערה: תמונות אלו ישמרו עם המשחק. וודא שגודלן אינו עולה על 1MB למסמך.
          </p>
        )}
      </div>

      <button onClick={handleCalculateAndSave} className="calculate-btn">
        <FontAwesomeIcon icon={faPercentage} /> חשב וסגור משחק
      </button>

      {debts.length > 0 && (
        <div className="section debts-section">
          <h3><FontAwesomeIcon icon={faExchangeAlt} /> חובות בין שחקנים</h3>
          <table className="debts-table">
            <thead>
              <tr>
                <th>חייב</th>
                <th>מקבל</th>
                <th>סכום (₪)</th>
              </tr>
            </thead>
            <tbody>
              {debts.map((d, i) => (
                <tr key={i}>
                  <td>{d.debtor}</td>
                  <td>{d.creditor}</td>
                  <td className="money-cell">{d.amount} ₪</td>
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