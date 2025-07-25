import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// קבלת הגדרות Firebase ממשתני הסביבה של האפליקציה.
// משתני סביבה ב-React (במיוחד עם Vite) נגישים דרך import.meta.env
// וצריכים להתחיל ב-VITE_ כדי להיות חשופים לצד הלקוח.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// בדיקה אם מפתח ה-API קיים בתצורה
if (!firebaseConfig.apiKey) {
  console.error("Firebase Error: Missing API key in firebaseConfig. Please ensure VITE_FIREBASE_API_KEY is correctly set in your .env file.");
  // ניתן להוסיף כאן לוגיקה נוספת, כמו הצגת הודעה למשתמש או מניעת אתחול האפליקציה.
}

// אתחול אפליקציית Firebase עם ההגדרות שנקבל
const app = initializeApp(firebaseConfig);

// קבלת מופע של שירות האימות (Auth) של Firebase
const auth = getAuth(app);

// קבלת מופע של שירות מסד הנתונים Cloud Firestore
const db = getFirestore(app);

// לוגיקה לכניסה אוטומטית אנונימית בעת טעינת המודול:
// אם המשתמש כבר מחובר (על ידי טוקן מותאם אישית או אחרת), לא ננסה להיכנס שוב כאנונימי.
// אם לא, ננסה להיכנס כאנונימי.
// חשוב: לא נבצע כאן signInWithCustomToken באופן אוטומטי, אלא נסתמך על App.jsx שיטפל בזה.
// המטרה של firebase.js היא רק לאתחל את השירותים ולייצא אותם.

export { db, auth, app }; // ייצוא המופעים לשימוש בקומפוננטות אחרות