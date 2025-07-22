import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import '../pages/Dashboard.css'; // ייבוא ה-CSS של הדאשבורד

function DashboardSettings() {
  const navigate = useNavigate();
  const [widgetPreferences, setWidgetPreferences] = useState({});
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  const availableWidgets = [
    { id: 'totalProfitLoss', name: 'סה"כ רווח/הפסד' },
    { id: 'lastSessions', name: 'סשנים אחרונים' },
    { id: 'playerCount', name: 'מספר שחקנים' },
    // הוסף כאן ווידג'טים נוספים כשתפתח אותם
    // { id: 'profitLossChart', name: 'גרף רווח/הפסד' },
    // { id: 'bestPlayers', name: 'שחקנים מובילים' },
  ];

  useEffect(() => {
    const auth = getAuth();
    const db = getFirestore();
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUserId(currentUser.uid);
        const userDocRef = doc(db, `artifacts/${appId}/users/${currentUser.uid}/dashboardSettings`, 'preferences');
        try {
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            // אם קיימות העדפות, טען אותן
            setWidgetPreferences(docSnap.data().widgets || {});
          } else {
            // אם אין העדפות, אתחל את כולן למופעלות כברירת מחדל
            const initialPreferences = {};
            availableWidgets.forEach(widget => {
              initialPreferences[widget.id] = true;
            });
            setWidgetPreferences(initialPreferences);
          }
        } catch (error) {
          console.error("שגיאה בטעינת העדפות דאשבורד:", error);
        } finally {
          setLoading(false);
        }
      } else {
        navigate('/'); // אם המשתמש לא מחובר, נווט לדף הבית
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleCheckboxChange = (widgetId) => {
    setWidgetPreferences(prev => ({
      ...prev,
      [widgetId]: !prev[widgetId]
    }));
  };

  const handleSave = async () => {
    if (!userId) return;

    const db = getFirestore();
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const userDocRef = doc(db, `artifacts/${appId}/users/${userId}/dashboardSettings`, 'preferences');

    try {
      await setDoc(userDocRef, { widgets: widgetPreferences }, { merge: true });
      console.log("העדפות דאשבורד נשמרו בהצלחה!");
      navigate('/home'); // נווט חזרה לדף הבית לאחר שמירה
    } catch (error) {
      console.error("שגיאה בשמירת העדפות דאשבורד:", error);
      // ניתן להציג הודעת שגיאה למשתמש
    }
  };

  const handleCancel = () => {
    navigate('/home'); // נווט חזרה לדף הבית ללא שמירה
  };

  if (loading) {
    return (
      <div className="dashboard-settings-container">
        <h2>טוען הגדרות דאשבורד...</h2>
      </div>
    );
  }

  return (
    <div className="dashboard-settings-container">
      <h2>הגדרות לוח מחוונים</h2>
      <p className="text-center text-gray-600 mb-8">בחר אילו ווידג'טים יוצגו בדף הבית שלך.</p>

      <ul className="widget-list">
        {availableWidgets.map(widget => (
          <li key={widget.id} className="widget-item">
            <label htmlFor={widget.id}>{widget.name}</label>
            <input
              type="checkbox"
              id={widget.id}
              checked={!!widgetPreferences[widget.id]} // ודא שהערך הוא בוליאני
              onChange={() => handleCheckboxChange(widget.id)}
            />
          </li>
        ))}
      </ul>

      <div className="dashboard-settings-actions">
        <button onClick={handleSave} className="save-button">
          <FontAwesomeIcon icon={faSave} /> שמור שינויים
        </button>
        <button onClick={handleCancel} className="cancel-button">
          <FontAwesomeIcon icon={faTimesCircle} /> ביטול
        </button>
      </div>
    </div>
  );
}

export default DashboardSettings;