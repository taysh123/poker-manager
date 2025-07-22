import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../firebase'; // Ensure db is correctly imported
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faChartLine, faCoins, faMoneyBillWave, faHandshake, faDollarSign } from '@fortawesome/free-solid-svg-icons';
import './PlayerStats.css'; // Import the new CSS file

function PlayerStats() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const navigate = useNavigate();

  const [playerStats, setPlayerStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get the appId from the global variable __app_id
  const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setLoadingAuth(false);
        // Load statistics only if the user is not anonymous
        if (!currentUser.isAnonymous) {
          fetchPlayerStats(currentUser.uid, appId); // Pass appId to fetchPlayerStats
        } else {
          setLoading(false);
          setError('סטטיסטיקות שחקנים אינן זמינות במצב אורח. אנא התחבר כדי לצפות בהן.');
        }
      } else {
        // If no user is logged in, navigate to the main login page
        navigate('/');
      }
    });

    return () => unsubscribe();
  }, [navigate, appId]); // Add appId to dependencies

  const fetchPlayerStats = async (userId, currentAppId) => { // Accept currentAppId as parameter
    setLoading(true);
    setError(null);
    try {
      // This is the corrected path for the Firestore collection
      const cashGamesCollection = collection(db, 'artifacts', currentAppId, 'users', userId, 'cashGames');
      const querySnapshot = await getDocs(cashGamesCollection);
      
      const statsMap = new Map();

      querySnapshot.docs.forEach(doc => {
        const game = doc.data();
        // Ensure game.players exists and is an array before iterating
        if (game.players && Array.isArray(game.players)) {
          game.players.forEach(player => {
            if (!statsMap.has(player.name)) {
              statsMap.set(player.name, {
                name: player.name,
                totalBuyIn: 0,
                totalCashOut: 0,
                netProfit: 0,
                gamesPlayed: 0,
                avgBuyIn: 0,
                avgCashOut: 0,
                hourlyRate: 0, // Placeholder, as it's commented out in render
              });
            }

            const currentStats = statsMap.get(player.name);
            currentStats.totalBuyIn += player.buyIn || 0; // Add nullish coalescing to prevent NaN
            currentStats.totalCashOut += player.cashOut || 0; // Add nullish coalescing to prevent NaN
            currentStats.gamesPlayed += 1;
            currentStats.netProfit = currentStats.totalCashOut - currentStats.totalBuyIn;
            currentStats.avgBuyIn = currentStats.gamesPlayed > 0 ? currentStats.totalBuyIn / currentStats.gamesPlayed : 0;
            currentStats.avgCashOut = currentStats.gamesPlayed > 0 ? currentStats.totalCashOut / currentStats.gamesPlayed : 0;
          });
        }
      });

      setPlayerStats(Array.from(statsMap.values()));
      setLoading(false);
    } catch (err) {
      console.error('שגיאה בשליפת סטטיסטיקות שחקנים:', err);
      setError('שגיאה בטעינת הסטטיסטיקות. נסה שוב מאוחר יותר.');
      setLoading(false);
    }
  };

  if (loadingAuth) {
    return (
      <div className="page-container player-stats-container">
        <p style={{ textAlign: 'center', color: 'var(--text-color)' }}>טוען...</p>
      </div>
    );
  }

  // If there is no user (not even a guest), or if the user is a guest, display an appropriate message
  if (!user || user.isAnonymous) {
    return (
      <div className="page-container player-stats-container">
        <h2 style={{ textAlign: 'center', color: 'var(--secondary-color)' }}>גישה מוגבלת</h2>
        <p style={{ textAlign: 'center', color: '#FFFFFF' }}>
          סטטיסטיקות שחקנים זמינות רק למשתמשים רשומים. אנא התחבר כדי לצפות בהן.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-container player-stats-container">
        <h2><FontAwesomeIcon icon={faChartLine} /> סטטיסטיקות שחקנים</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-color)' }}>טוען סטטיסטיקות...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container player-stats-container">
        <h2><FontAwesomeIcon icon={faChartLine} /> סטטיסטיקות שחקנים</h2>
        <p style={{ textAlign: 'center', color: 'var(--danger-color)' }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="page-container player-stats-container">
      <h2><FontAwesomeIcon icon={faChartLine} /> סטטיסטיקות שחקנים</h2>

      {playerStats.length === 0 ? (
        <p style={{ textAlign: 'center' }}>אין נתונים להצגה. התחל לשחק משחקי קאש כדי לראות סטטיסטיקות!</p>
      ) : (
        <div className="section stats-table-container">
          <table className="player-stats-table">
            <thead>
              <tr>
                <th>שם שחקן</th>
                <th><FontAwesomeIcon icon={faCoins} /> סה"כ כניסות (₪)</th>
                <th><FontAwesomeIcon icon={faMoneyBillWave} /> סה"כ יציאות (₪)</th>
                <th><FontAwesomeIcon icon={faDollarSign} /> רווח נקי (₪)</th>
                <th><FontAwesomeIcon icon={faHandshake} /> משחקים שוחקו</th>
                <th>ממוצע כניסה (₪)</th>
                <th>ממוצע יציאה (₪)</th>
                {/* <th>קצב שעתי (₪/שעה)</th> */}
              </tr>
            </thead>
            <tbody>
              {playerStats.map((stats, index) => (
                <tr key={index}>
                  <td>{stats.name}</td>
                  <td>{stats.totalBuyIn.toFixed(2)}</td>
                  <td>{stats.totalCashOut.toFixed(2)}</td>
                  <td style={{ color: stats.netProfit >= 0 ? 'var(--primary-color)' : 'var(--danger-color)' }}>
                    {stats.netProfit.toFixed(2)}
                  </td>
                  <td>{stats.gamesPlayed}</td>
                  <td>{stats.avgBuyIn.toFixed(2)}</td>
                  <td>{stats.avgCashOut.toFixed(2)}</td>
                  {/* <td>{stats.hourlyRate.toFixed(2)}</td> */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default PlayerStats;