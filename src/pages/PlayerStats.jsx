import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faChartLine, faCoins, faMoneyBillWave, faHandshake, faDollarSign } from '@fortawesome/free-solid-svg-icons';
import './PlayerStats.css';

function PlayerStats() {
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null); // מצב לשמירת ה-userId
  const [loadingAuth, setLoadingAuth] = useState(true);
  const navigate = useNavigate();

  const [playerStats, setPlayerStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // קבלת ה-appId מהמשתנה הגלובלי __app_id
  const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setUserId(currentUser.uid); // שמור את ה-UID
        if (!currentUser.isAnonymous) {
          fetchPlayerStats(currentUser.uid);
        } else {
          setLoading(false);
          setError('סטטיסטיקות שחקנים אינן זמינות במצב אורח. אנא התחבר כדי לצפות בהן.');
        }
      } else {
        navigate('/');
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const fetchPlayerStats = async (currentUserId) => {
    if (!currentUserId) {
      console.warn("אין User ID, לא ניתן לטעון סטטיסטיקות.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const sessionsCollectionRef = collection(db, `artifacts/${appId}/users/${currentUserId}/sessions`);
      const querySnapshot = await getDocs(sessionsCollectionRef);

      const statsMap = new Map();

      querySnapshot.forEach((doc) => {
        const gameData = doc.data();
        if (Array.isArray(gameData.players)) {
          gameData.players.forEach(player => {
            const playerName = player.name;
            let currentStats = statsMap.get(playerName) || {
              name: playerName,
              totalBuyIn: 0,
              totalCashOut: 0,
              netProfit: 0,
              gamesPlayed: 0,
              avgBuyIn: 0,
              avgCashOut: 0,
            };

            const buyIn = parseFloat(player.buyIn) || 0;
            const cashOut = parseFloat(player.cashOut) || 0;

            currentStats.totalBuyIn += buyIn;
            currentStats.totalCashOut += cashOut;
            currentStats.netProfit += (cashOut - buyIn);
            currentStats.gamesPlayed += 1;

            statsMap.set(playerName, currentStats);
          });
        }
      });

      const calculatedStats = Array.from(statsMap.values()).map(stats => ({
        ...stats,
        avgBuyIn: stats.gamesPlayed > 0 ? stats.totalBuyIn / stats.gamesPlayed : 0,
        avgCashOut: stats.gamesPlayed > 0 ? stats.totalCashOut / stats.gamesPlayed : 0,
      }));

      setPlayerStats(calculatedStats);

    } catch (err) {
      console.error("שגיאה בטעינת סטטיסטיקות שחקנים:", err);
      setError("שגיאה בטעינת סטטיסטיקות שחקנים: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingAuth) {
    return (
      <div className="player-stats-container">
        <h2>טוען אימות משתמש...</h2>
      </div>
    );
  }

  if (!user || user.isAnonymous) {
    return (
      <div className="player-stats-container">
        <p className="error-message text-center">
          <FontAwesomeIcon icon={faChartLine} /> כדי לצפות בסטטיסטיקות שחקנים, עליך להתחבר או להירשם.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="player-stats-container">
        <h2><FontAwesomeIcon icon={faChartLine} /> סטטיסטיקות שחקנים</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-color)' }}>טוען סטטיסטיקות שחקנים...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="player-stats-container">
        <p className="error-message" style={{ textAlign: 'center', color: 'var(--danger-color)' }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="player-stats-container">
      <h2><FontAwesomeIcon icon={faChartLine} /> סטטיסטיקות שחקנים</h2>

      {playerStats.length === 0 ? (
        <p style={{ textAlign: 'center' }}>אין נתוני משחקים זמינים להצגת סטטיסטיקות. התחל משחק חדש כדי לראות נתונים!</p>
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
              </tr>
            </thead>
            <tbody>
              {playerStats.map((stats, index) => (
                <tr key={index}>
                  <td>{stats.name}</td>
                  <td>{isNaN(stats.totalBuyIn) ? '0.00' : stats.totalBuyIn.toFixed(2)}</td>
                  <td>{isNaN(stats.totalCashOut) ? '0.00' : stats.totalCashOut.toFixed(2)}</td>
                  <td style={{ color: stats.netProfit >= 0 ? 'var(--primary-color)' : 'var(--danger-color)' }}>
                    {isNaN(stats.netProfit) ? '0.00' : stats.netProfit.toFixed(2)}
                  </td>
                  <td>{stats.gamesPlayed}</td>
                  <td>{isNaN(stats.avgBuyIn) ? '0.00' : stats.avgBuyIn.toFixed(2)}</td>
                  <td>{isNaN(stats.avgCashOut) ? '0.00' : stats.avgCashOut.toFixed(2)}</td>
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