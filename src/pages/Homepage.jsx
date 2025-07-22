import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc, collection, query, getDocs } from 'firebase/firestore';
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
  const [dashboardData, setDashboardData] = useState({
    totalProfitLoss: 0,
    lastSessions: [],
    playerCount: 0,
  });

  useEffect(() => {
    const auth = getAuth();
    const db = getFirestore();
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUserId(currentUser.uid);

        // 1. טעינת העדפות הווידג'טים
        const userPrefsDocRef = doc(db, `artifacts/${appId}/users/${currentUser.uid}/dashboardSettings`, 'preferences');
        try {
          const prefsDocSnap = await getDoc(userPrefsDocRef);
          if (prefsDocSnap.exists()) {
            setWidgetPreferences(prefsDocSnap.data().widgets || {});
          } else {
            // אם אין העדפות, אתחל את כולן למופעלות כברירת מחדל
            const defaultPreferences = {
              totalProfitLoss: true,
              lastSessions: true,
              playerCount: true,
            };
            setWidgetPreferences(defaultPreferences);
            // שמור את ברירת המחדל כדי שלא יטען שוב ושוב
            await setDoc(userPrefsDocRef, { widgets: defaultPreferences }, { merge: true });
          }
        } catch (error) {
          console.error("שגיאה בטעינת העדפות דאשבורד:", error);
        }

        // 2. טעינת נתונים עבור הווידג'טים
        let totalPL = 0;
        const sessionsList = [];
        let playersCount = 0;

        try {
          // טעינת סשנים לחישוב רווח/הפסד וסשנים אחרונים
          const sessionsColRef = collection(db, `artifacts/${appId}/users/${currentUser.uid}/sessions`);
          const sessionsQuerySnapshot = await getDocs(sessionsColRef);
          sessionsQuerySnapshot.forEach((doc) => {
            const sessionData = doc.data();
            totalPL += sessionData.profitLoss || 0;
            sessionsList.push({ id: doc.id, ...sessionData });
          });

          // מיון סשנים לפי תאריך (החדשים ביותר קודם)
          sessionsList.sort((a, b) => new Date(b.date) - new Date(a.date));

          // טעינת שחקנים לספירה
          const playersColRef = collection(db, `artifacts/${appId}/users/${currentUser.uid}/players`);
          const playersQuerySnapshot = await getDocs(playersColRef);
          playersCount = playersQuerySnapshot.size; // סופר את מספר המסמכים בקולקציה

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
      } else {
        navigate('/'); // אם המשתמש לא מחובר, נווט לדף הבית
      }
    });

    return () => unsubscribe();
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
        <h1>ברוך הבא, {auth.currentUser?.displayName || auth.currentUser?.email || 'משתמש'}!</h1>
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
        {/* כאן תוכל להוסיף ווידג'טים נוספים כשתפתח אותם */}
      </div>
    </div>
  );
}

export default Homepage;