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
  const [loadingAuth, setLoadingAuth] = useState(true);
  const navigate = useNavigate();

  const [playerStats, setPlayerStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setLoadingAuth(false);
        // טען סטטיסטיקות רק אם המשתמש אינו אנונימי
        if (!currentUser.isAnonymous) {
          fetchPlayerStats(currentUser.uid);
        } else {
          setLoading(false);
          setError('יש להתחבר כדי לצפות בסטטיסטיקות שחקנים.');
        }
      } else {
        navigate('/');
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const fetchPlayerStats = async (userId) => {
    setLoading(true);
    setError(null);
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    try {
      // נתיב לטבלת המשחקים ב-Firestore
      const cashGamesColRef = collection(db, `artifacts/${appId}/users/${userId}/cashGames`);
      const querySnapshot = await getDocs(cashGamesColRef);

      const statsMap = new Map();

      querySnapshot.forEach((doc) => {
        const gameData = doc.data();
        // ודא ש-gameData.players הוא מערך וקיים
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

            // ודא ש-buyIn ו-cashOut הם מספרים
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

      // חשב ממוצעים לאחר סיום הלולאה
      const calculatedStats = Array.from(statsMap.values()).map(stats => ({
        ...stats,
        avgBuyIn: stats.gamesPlayed > 0 ? stats.totalBuyIn / stats.gamesPlayed : 0,
        avgCashOut: stats.gamesPlayed > 0 ? stats.totalCashOut / stats.gamesPlayed : 0,
      }));

      setPlayerStats(calculatedStats);

    } catch (err) {
      console.error("שגיאה בטעינת סטטיסטיקות שחקנים:", err);
      setError("שגיאה בטעינת סטטיסטיקות שחקנים. אנא נסה שוב מאוחר יותר.");
    } finally {
      setLoading(false);
    }
  };

  if (loadingAuth) {
    return (
      <div className="page-container player-stats-container">
        <p style={{ textAlign: 'center', color: 'var(--text-color)' }}>טוען אימות משתמש...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page-container player-stats-container">
        <p style={{ textAlign: 'center', color: 'var(--text-color)' }}>מפנה לדף הכניסה...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-container player-stats-container">
        <p style={{ textAlign: 'center', color: 'var(--text-color)' }}>טוען סטטיסטיקות שחקנים...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container player-stats-container">
        <p className="error-message" style={{ textAlign: 'center', color: 'var(--danger-color)' }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="page-container player-stats-container">
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
                {/* <th>קצב שעתי (₪/שעה)</th> */}
              </tr>
            </thead>
            <tbody>
              {playerStats.map((stats, index) => (
                <tr key={index}>
                  <td>{stats.name}</td>
                  {/* ודא שהערכים הם מספרים לפני toFixed */}
                  <td>{isNaN(stats.totalBuyIn) ? '0.00' : stats.totalBuyIn.toFixed(2)}</td>
                  <td>{isNaN(stats.totalCashOut) ? '0.00' : stats.totalCashOut.toFixed(2)}</td>
                  <td style={{ color: stats.netProfit >= 0 ? 'var(--primary-color)' : 'var(--danger-color)' }}>
                    {isNaN(stats.netProfit) ? '0.00' : stats.netProfit.toFixed(2)}
                  </td>
                  <td>{stats.gamesPlayed}</td>
                  <td>{isNaN(stats.avgBuyIn) ? '0.00' : stats.avgBuyIn.toFixed(2)}</td>
                  <td>{isNaN(stats.avgCashOut) ? '0.00' : stats.avgCashOut.toFixed(2)}</td>
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
