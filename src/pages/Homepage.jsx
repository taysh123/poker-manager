import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc, collection, query, getDocs, setDoc, onSnapshot } from 'firebase/firestore'; // הוספתי setDoc ו-onSnapshot
import { getAuth } from 'firebase/auth'; // ייבוא getAuth
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
  const [currentUserDisplayName, setCurrentUserDisplayName] = useState('משתמש'); // מצב חדש לשם המשתמש
  const [dashboardData, setDashboardData] = useState({
    totalProfitLoss: 0,
    lastSessions: [],
    playerCount: 0,
  });

  useEffect(() => {
    const auth = getAuth(); // אתחול auth כאן
    const db = getFirestore();
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    const unsubscribeAuth = auth.onAuthStateChanged(async (currentUser) => { // שיניתי את שם המשתנה ל-unsubscribeAuth
      if (currentUser) {
        setUserId(currentUser.uid);
        setCurrentUserDisplayName(currentUser.displayName || currentUser.email || 'משתמש'); // עדכון שם המשתמש

        // 1. טעינת העדפות הווידג'טים
        const userPrefsDocRef = doc(db, `artifacts/${appId}/users/${currentUser.uid}/dashboardSettings`, 'preferences');
        let initialPreferences = {};
        try {
          const prefsDocSnap = await getDoc(userPrefsDocRef);
          if (prefsDocSnap.exists()) {
            initialPreferences = prefsDocSnap.data().widgets || {};
            setWidgetPreferences(initialPreferences);
          } else {
            // אם אין העדפות, אתחל את כולן למופעלות כברירת מחדל
            const defaultPreferences = {
              totalProfitLoss: true,
              lastSessions: true,
              playerCount: true,
            };
            initialPreferences = defaultPreferences;
            setWidgetPreferences(defaultPreferences);
            // שמור את ברירת המחדל כדי שלא יטען שוב ושוב
            await setDoc(userPrefsDocRef, { widgets: defaultPreferences }, { merge: true });
          }
        } catch (error) {
          console.error("שגיאה בטעינת העדפות דאשבורד:", error);
          // במקרה של שגיאה, השתמש בהעדפות ברירת מחדל
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
            const sessionsColRef = collection(db, `artifacts/${appId}/users/${currentUser.uid}/sessions`);
            const sessionsQuerySnapshot = await getDocs(sessionsColRef); // השתמש ב-getDocs לטעינה ראשונית
            sessionsQuerySnapshot.forEach((doc) => {
              const sessionData = doc.data();
              totalPL += sessionData.profitLoss || 0;
              sessionsList.push({ id: doc.id, ...sessionData });
            });

            // מיון סשנים לפי תאריך (החדשים ביותר קודם)
            sessionsList.sort((a, b) => new Date(b.date) - new Date(a.date));

            // טעינת שחקנים לספירה
            const playersColRef = collection(db, `artifacts/${appId}/users/${currentUser.uid}/players`);
            const playersQuerySnapshot = await getDocs(playersColRef); // השתמש ב-getDocs לטעינה ראשונית
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
        };

        // קריאה ראשונית לטעינת הנתונים
        loadDashboardData();

        // ניתן להוסיף כאן onSnapshot listeners לווידג'טים ספציפיים אם רוצים עדכונים בזמן אמת
        // לדוגמה, עבור סשנים:
        // const sessionsColRef = collection(db, `artifacts/${appId}/users/${currentUser.uid}/sessions`);
        // const unsubscribeSessions = onSnapshot(sessionsColRef, (snapshot) => {
        //   const updatedSessions = [];
        //   let updatedTotalPL = 0;
        //   snapshot.forEach((doc) => {
        //     const sessionData = doc.data();
        //     updatedTotalPL += sessionData.profitLoss || 0;
        //     updatedSessions.push({ id: doc.id, ...sessionData });
        //   });
        //   updatedSessions.sort((a, b) => new Date(b.date) - new Date(a.date));
        //   setDashboardData(prevData => ({
        //     ...prevData,
        //     totalProfitLoss: updatedTotalPL,
        //     lastSessions: updatedSessions,
        //   }));
        // });

        // עבור שחקנים:
        // const playersColRef = collection(db, `artifacts/${appId}/users/${currentUser.uid}/players`);
        // const unsubscribePlayers = onSnapshot(playersColRef, (snapshot) => {
        //   setDashboardData(prevData => ({
        //     ...prevData,
        //     playerCount: snapshot.size,
        //   }));
        // });

        // return () => {
        //   unsubscribeSessions();
        //   unsubscribePlayers();
        // };

      } else {
        navigate('/'); // אם המשתמש לא מחובר, נווט לדף הבית
      }
    });

    return () => unsubscribeAuth(); // ודא ביטול הרשמה של onAuthStateChanged
  }, [navigate]); // הוספתי navigate כתלות, למרות שבדרך כלל הוא יציב

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
    </div>
  );
}

export default Homepage;
