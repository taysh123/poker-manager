import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faChartLine, faCoins, faMoneyBillWave, faHandshake, faDollarSign } from '@fortawesome/free-solid-svg-icons';
import './PlayerStats.css';

// רכיב Modal פשוט להודעות אישור ושגיאה
const CustomModal = ({ message, onConfirm, onCancel, type }) => {
  if (!message) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <p>{message}</p>
        <div className="modal-actions">
          {type === 'confirm' && (
            <>
              <button onClick={onConfirm} className="modal-button confirm-button">אישור</button>
              <button onClick={onCancel} className="modal-button cancel-button">ביטול</button>
            </>
          )}
          {type === 'alert' && (
            <button onClick={onCancel} className="modal-button confirm-button">הבנתי</button>
          )}
        </div>
      </div>
    </div>
  );
};

function PlayerStats() {
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null); // מצב לשמירת ה-userId
  const [loadingAuth, setLoadingAuth] = useState(true);
  const navigate = useNavigate();

  const [playerStats, setPlayerStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalMessage, setModalMessage] = useState(null);
  const [modalType, setModalType] = useState('alert');

  // קבלת ה-appId מהמשתנה הגלובלי __app_id
  const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setUserId(currentUser.uid); // שמור את ה-UID
        setLoadingAuth(false);
        // טען סטטיסטיקות רק אם המשתמש אינו אנונימי
        if (!currentUser.isAnonymous) {
          fetchPlayerStats(currentUser.uid);
        } else {
          setLoading(false);
          setError('סטטיסטיקות שחקנים אינן זמינות למשתמשי אורח. אנא התחבר/הרשם.');
        }
      } else {
        navigate('/');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const fetchPlayerStats = async (currentUserId) => {
    setLoading(true);
    setError(null);
    try {
      const gamesCollectionRef = collection(db, `artifacts/${appId}/users/${currentUserId}/cashGames`);
      const querySnapshot = await getDocs(gamesCollectionRef);
      const gamesList = querySnapshot.docs.map(doc => doc.data());

      const stats = {};

      gamesList.forEach(game => {
        game.players.forEach(player => {
          if (!stats[player.name]) {
            stats[player.name] = {
              name: player.name,
              totalBuyIn: 0,
              totalCashOut: 0,
              netProfit: 0,
              gamesPlayed: 0,
            };
          }
          stats[player.name].totalBuyIn += parseFloat(player.buyIn) || 0;
          stats[player.name].totalCashOut += parseFloat(player.cashOut) || 0;
          stats[player.name].netProfit += (parseFloat(player.cashOut) || 0) - (parseFloat(player.buyIn) || 0);
          stats[player.name].gamesPlayed += 1;
        });
      });

      // חישוב ממוצעים
      Object.values(stats).forEach(player => {
        player.avgBuyIn = player.gamesPlayed > 0 ? player.totalBuyIn / player.gamesPlayed : 0;
        player.avgCashOut = player.gamesPlayed > 0 ? player.totalCashOut / player.gamesPlayed : 0;
        // ניתן להוסיף חישובים נוספים כמו קצב שעתי אם יש נתוני משך משחק
      });

      setPlayerStats(Object.values(stats));
    } catch (err) {
      console.error("שגיאה בטעינת סטטיסטיקות שחקנים:", err);
      setError('שגיאה בטעינת סטטיסטיקות שחקנים. נסה לרענן את הדף.');
      setModalMessage('שגיאה בטעינת סטטיסטיקות שחקנים. נסה לרענן את הדף.');
      setModalType('alert');
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setModalMessage(null);
    setModalType('alert');
  };

  if (loadingAuth) {
    return (
      <div className="player-stats-container">
        <h2>טוען...</h2>
      </div>
    );
  }

  return (
    <div className="player-stats-container">
      <h2><FontAwesomeIcon icon={faChartLine} /> סטטיסטיקות שחקנים</h2>
      <p className="text-center text-gray-600 mb-8">
        צפה בסטטיסטיקות מפורטות של כל השחקנים שלך על פני כל משחקי הקאש שנשמרו.
      </p>

      {loading ? (
        <p style={{ textAlign: 'center' }}>טוען סטטיסטיקות שחקנים...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : playerStats.length === 0 ? (
        <p style={{ textAlign: 'center' }}>לא נמצאו נתוני משחקים עבור שחקנים. התחל משחק קאש ושמור אותו כדי לראות סטטיסטיקות.</p>
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
      <CustomModal message={modalMessage} onCancel={closeModal} type={modalType} />
    </div>
  );
}

export default PlayerStats;
