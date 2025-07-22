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
  ];

  useEffect(() => {
    const auth = getAuth();
    const db = getFirestore();
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id'; // קבלת appId

    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUserId(currentUser.uid);
        // הנתיב תוקן: artifacts/${appId}/users/${currentUser.uid}/dashboardSettings/preferences
        const userDocRef = doc(db, `artifacts/${appId}/users/${currentUser.uid}/dashboardSettings`, 'preferences');
        try {
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            setWidgetPreferences(docSnap.data().widgets || {});
          } else {
            const initialPreferences = {};
            availableWidgets.forEach(widget => {
              initialPreferences[widget.id] = true;
            });
            setWidgetPreferences(initialPreferences);
            // שמור את ברירת המחדל
            await setDoc(userDocRef, { widgets: initialPreferences }, { merge: true });
          }
        } catch (error) {
          console.error("שגיאה בטעינת העדפות דאשבורד:", error);
        } finally {
          setLoading(false);
        }
      } else {
        navigate('/');
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
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id'; // קבלת appId
    // הנתיב תוקן: artifacts/${appId}/users/${userId}/dashboardSettings/preferences
    const userDocRef = doc(db, `artifacts/${appId}/users/${userId}/dashboardSettings`, 'preferences');

    try {
      await setDoc(userDocRef, { widgets: widgetPreferences }, { merge: true });
      console.log("העדפות דאשבורד נשמרו בהצלחה!");
      navigate('/home');
    } catch (error) {
      console.error("שגיאה בשמירת העדפות דאשבורד:", error);
    }
  };

  const handleCancel = () => {
    navigate('/home');
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
              checked={!!widgetPreferences[widget.id]}
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