import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc, collection, query, getDocs, setDoc, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faUserChart, faCoins, faHandshake, faBook, faUsers } from '@fortawesome/free-solid-svg-icons'; // ייבוא אייקונים נוספים
import '../pages/Dashboard.css'; // ייבוא ה-CSS של הדאשבורד
import '../pages/Homepage.css'; // ייבוא ה-CSS של דף הבית

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

  useEffect(() => {
    const auth = getAuth();
    const db = getFirestore();
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id'; // קבלת appId

    const unsubscribeAuth = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUserId(currentUser.uid);
        setCurrentUserDisplayName(currentUser.displayName || currentUser.email || 'משתמש');

        // 1. טעינת העדפות הווידג'טים
        // הנתיב תוקן: artifacts/${appId}/users/${currentUser.uid}/dashboardSettings/preferences
        const userPrefsDocRef = doc(db, `artifacts/${appId}/users/${currentUser.uid}/dashboardSettings`, 'preferences');
        let initialPreferences = {};
        try {
          const prefsDocSnap = await getDoc(userPrefsDocRef);
          if (prefsDocSnap.exists()) {
            initialPreferences = prefsDocSnap.data().widgets || {};
            setWidgetPreferences(initialPreferences);
          } else {
            const defaultPreferences = {
              totalProfitLoss: true,
              lastSessions: true,
              playerCount: true,
            };
            initialPreferences = defaultPreferences;
            setWidgetPreferences(defaultPreferences);
            await setDoc(userPrefsDocRef, { widgets: defaultPreferences }, { merge: true });
          }
        } catch (error) {
          console.error("שגיאה בטעינת העדפות דאשבורד:", error);
          initialPreferences = {
            totalProfitLoss: true,
            lastSessions: true,
            playerCount: true,
          };
          setWidgetPreferences(initialPreferences);
        }

        // 2. טעינת נתונים עבור הווידג'טים
        const loadDashboardData = async () => {
          let totalPL = 0;
          const sessionsList = [];
          let playersCount = 0;

          try {
            // טעינת סשנים לחישוב רווח/הפסד וסשנים אחרונים
            // הנתיב תוקן: artifacts/${appId}/users/${currentUser.uid}/sessions
            const sessionsColRef = collection(db, `artifacts/${appId}/users/${currentUser.uid}/sessions`);
            const sessionsQuerySnapshot = await getDocs(sessionsColRef);
            sessionsQuerySnapshot.forEach((doc) => {
              const sessionData = doc.data();
              totalPL += sessionData.profitLoss || 0;
              sessionsList.push({ id: doc.id, ...sessionData });
            });

            sessionsList.sort((a, b) => new Date(b.date) - new Date(a.date));

            // טעינת שחקנים לספירה
            // הנתיב תוקן: artifacts/${appId}/users/${currentUser.uid}/players
            const playersColRef = collection(db, `artifacts/${appId}/users/${currentUser.uid}/players`);
            const playersQuerySnapshot = await getDocs(playersColRef);
            playersCount = playersQuerySnapshot.size;

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
  }, [navigate]);

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
      </div>

      {/* קישורים מהירים */}
      <div className="section quick-links-section">
        <h3>קישורים מהירים</h3>
        <div className="home-links-grid">
          <div className="home-link-card" onClick={() => navigate('/cash-game')}>
            <FontAwesomeIcon icon={faCoins} />
            <h3>משחק קאש חדש</h3>
            <p>התחל מעקב אחר משחק קאש חדש.</p>
          </div>
          <div className="home-link-card" onClick={() => navigate('/player-stats')}>
            <FontAwesomeIcon icon={faChartLine} />
            <h3>סטטיסטיקות שחקנים</h3>
            <p>צפה בסטטיסטיקות מפורטות של כל השחקנים.</p>
          </div>
          <div className="home-link-card" onClick={() => navigate('/player-management')}>
            <FontAwesomeIcon icon={faUsers} />
            <h3>ניהול שחקנים</h3>
            <p>הוסף, ערוך ומחק שחקנים קבועים.</p>
          </div>
          <div className="home-link-card" onClick={() => navigate('/poker-journal')}>
            <FontAwesomeIcon icon={faBook} />
            <h3>יומן פוקר</h3>
            <p>תעד ונתח את הידיים והסשנים שלך.</p>
          </div>
          <div className="home-link-card" onClick={() => navigate('/personal-tracking')}>
            <FontAwesomeIcon icon={faUserChart} />
            <h3>מעקב אישי</h3>
            <p>עקוב אחר הביצועים האישיים שלך במשחקים.</p>
          </div>
          <div className="home-link-card" onClick={() => navigate('/sessions')}>
            <FontAwesomeIcon icon={faHandshake} />
            <h3>היסטוריית סשנים</h3>
            <p>צפה ונהל את כל סשני המשחק שהקלטת.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Homepage;