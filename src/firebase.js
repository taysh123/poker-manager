// src/firebase.js
// ייבוא פונקציות נחוצות מ-Firebase SDK
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// קבלת הגדרות Firebase ממשתני הסביבה של האפליקציה.
// משתני סביבה ב-React (במיוחד עם Vite) נגישים דרך import.meta.env
// וצריכים להתחיל ב-VITE_ כדי להיות חשופים לצד הלקוח.
const firebaseConfig = import.meta.env.VITE_FIREBASE_CONFIG
  ? JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG)
  : {};

// בדיקה אם מפתח ה-API קיים בתצורה
if (!firebaseConfig.apiKey) {
  console.error("Firebase Error: Missing API key in firebaseConfig. Please ensure VITE_FIREBASE_CONFIG is correctly set in your environment.");
  // ניתן להוסיף כאן לוגיקה נוספת, כמו הצגת הודעה למשתמש או מניעת אתחול האפליקציה.
}

// אתחול אפליקציית Firebase עם ההגדרות שנקבל
const app = initializeApp(firebaseConfig);

// קבלת מופע של שירות האימות (Auth) של Firebase
const auth = getAuth(app);

// קבלת מופע של שירות מסד הנתונים Cloud Firestore
const db = getFirestore(app);

// לוגיקה לכניסה אוטומטית אנונימית בעת טעינת המודול:
// אם המשתמש לא מחובר, ננסה להיכנס כאנונימי.
// זה מבטיח שתמיד יהיה משתמש מאומת (גם אם אנונימי)
// עבור כללי האבטחה של Firestore, אלא אם כן המשתמש מתחבר באופן אחר (לדוגמה, דרך דף ההתחברות).
signInAnonymously(auth)
  .then(() => {
    console.log("Signed in anonymously successfully.");
  })
  .catch(error => {
    console.error("Error signing in anonymously:", error);
  });

// ייצוא המופעים של db, auth ו-app כדי שניתן יהיה להשתמש בהם בקומפוננטות אחרות
export { db, auth, app };