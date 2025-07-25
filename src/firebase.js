// src/firebase.js
// ייבוא פונקציות נחוצות מ-Firebase SDK
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken } from 'firebase/auth'; // ייבוא signInWithCustomToken
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
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// בדיקה אם מפתח ה-API קיים בתצורה
if (!firebaseConfig.apiKey) {
  console.error("Firebase Error: Missing API key in firebaseConfig. Please ensure VITE_FIREBASE_API_KEY is correctly set in your .env file.");
}

// אתחול אפליקציית Firebase עם ההגדרות שנקבל
const app = initializeApp(firebaseConfig);

// קבלת מופע של שירות האימות (Auth) של Firebase
const auth = getAuth(app);

// קבלת מופע של שירות מסד הנתונים Cloud Firestore
const db = getFirestore(app);

// לוגיקה לכניסה אוטומטית אנונימית בעת טעינת המודול:
// אם המשתנה הגלובלי __initial_auth_token קיים, נשתמש בו לכניסה
// אחרת, ננסה להיכנס כאנונימי.
// חשוב: יש לוודא ש-onAuthStateChanged ב-App.jsx מטפל במצב זה.
(async () => {
  try {
    if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
      await signInWithCustomToken(auth, __initial_auth_token);
      console.log("Signed in with custom token.");
    } else {
      // אם אין טוקן התחלתי, ננסה להיכנס כאנונימי
      await signInAnonymously(auth);
      console.log("Signed in anonymously.");
    }
  } catch (error) {
    console.error("שגיאה באימות Firebase בעת אתחול:", error);
    // ניתן להוסיף כאן טיפול שגיאות נוסף, כמו הצגת הודעה למשתמש
  }
})();

// ייצוא המופעים של Firebase לשימוש ברכיבים אחרים
export { db, auth, app };