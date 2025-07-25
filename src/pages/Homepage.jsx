import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc, collection, query, getDocs, setDoc, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog } from '@fortawesome/free-solid-svg-icons';
import '../pages/Dashboard.css'; // ייבוא ה-CSS של הדאשבורד

// ייבוא הווידג'טים
import TotalProfitLossWidget from '../components/widgets/TotalProfitLossWidget';
import LastSessionsWidget from '../components/widgets/LastSessionsWidget';
import PlayerCountWidget from '../components/widgets/PlayerCountWidget';

function Homepage() {
  const navigate = useNavigate();
  const [widgetPreferences, setWidgetPreferences] = useState({});
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [currentUserDisplayName, setCurrentUserDisplayName] = useState('משתמש');
  const [dashboardData, setDashboardData] = useState({
    totalProfitLoss: 0,
    lastSessions: [],
    playerCount: 0,
  });

  const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

  useEffect(() => {
    const auth = getAuth();
    const db = getFirestore();

    const unsubscribeAuth = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUserId(currentUser.uid); // עדכון userId
        setCurrentUserDisplayName(currentUser.displayName || currentUser.email || 'משתמש');

        // טעינת העדפות ווידג'טים
        const userDocRef = doc(db, `artifacts/${appId}/users/${currentUser.uid}/preferences/dashboard`);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          setWidgetPreferences(docSnap.data().widgets || {});
        } else {
          // אם אין העדפות שמורות, הגדר ברירות מחדל
          const defaultPreferences = {
            totalProfitLoss: true,
            lastSessions: true,
            playerCount: true,
          };
          setWidgetPreferences(defaultPreferences);
          // שמור את ברירות המחדל ב-Firestore
          await setDoc(userDocRef, { widgets: defaultPreferences }, { merge: true });
        }

        // טעינת נתוני דאשבורד
        const loadDashboardData = async () => {
          try {
            // סך רווח/הפסד
            const cashGamesCollectionRef = collection(db, `artifacts/${appId}/users/${currentUser.uid}/cashGames`);
            const cashGamesSnapshot = await getDocs(cashGamesCollectionRef);
            let totalPL = 0;
            let sessionsList = [];
            cashGamesSnapshot.docs.forEach(gameDoc => {
              const gameData = gameDoc.data();
              if (gameData.players && Array.isArray(gameData.players)) {
                gameData.players.forEach(player => {
                  // ודא שהשחקן הוא המשתמש הנוכחי (לפי שם תצוגה או אימייל)
                  if (player.name === currentUser.displayName || player.name === currentUser.email) {
                    const buyIn = parseFloat(player.buyIn) || 0;
                    const cashOut = parseFloat(player.cashOut) || 0;
                    totalPL += (cashOut - buyIn);
                    sessionsList.push({
                      id: gameDoc.id,
                      date: gameData.date ? new Date(gameData.date.seconds * 1000) : new Date(),
                      gameType: 'קאש', // או סוג המשחק בפועל
                      profitLoss: (cashOut - buyIn),
                    });
                  }
                });
              }
            });

            // מיון הסשנים מהחדש לישן
            sessionsList.sort((a, b) => b.date - a.date);

            // מספר שחקנים
            const playersCollectionRef = collection(db, `artifacts/${appId}/users/${currentUser.uid}/players`);
            const playersSnapshot = await getDocs(playersCollectionRef);
            const playersCount = playersSnapshot.size;

            setDashboardData({
              totalProfitLoss: totalPL,
              lastSessions: sessionsList,
              playerCount: playersCount,
            });

          } catch (error) {
            console.error("שגיאה בטעינת נתוני דאשבורד:", error);
          } finally {
            setLoading(false);
          }
        };

        loadDashboardData();

      } else {
        navigate('/');
      }
    });

    return () => unsubscribeAuth();
  }, [navigate, appId]); // הוספת navigate ו-appId כתלויות

  if (loading) {
    return (
      <div className="dashboard-container">
        <h1 className="text-center">טוען דאשבורד...</h1>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>ברוך הבא, {currentUserDisplayName}!</h1>
        <button onClick={() => navigate('/dashboard-settings')} className="dashboard-settings-button">
          <FontAwesomeIcon icon={faCog} /> הגדרות דאשבורד
        </button>
      </div>

      <div className="widgets-grid">
        {widgetPreferences.totalProfitLoss && (
          <TotalProfitLossWidget totalProfitLoss={dashboardData.totalProfitLoss} />
        )}
        {widgetPreferences.lastSessions && (
          <LastSessionsWidget sessions={dashboardData.lastSessions} />
        )}
        {widgetPreferences.playerCount && (
          <PlayerCountWidget playerCount={dashboardData.playerCount} />
        )}
        {/* הוסף כאן ווידג'טים נוספים לפי ההעדפות */}
      </div>
    </div>
  );
}

export default Homepage;