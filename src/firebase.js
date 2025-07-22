// src/firebase.js
// ייבוא פונקציות נחוצות מ-Firebase SDK
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// קבלת הגדרות Firebase מהמשתנים הגלובליים של סביבת ה-Canvas.
// אם המשתנה אינו מוגדר (לדוגמה, בסביבת פיתוח מקומית ללא Canvas),
// נשתמש באובייקט ריק כדי למנוע שגיאות.
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

// קבלת טוקן האימות הראשוני מהמשתנים הגלובליים של סביבת ה-Canvas.
// אם המשתנה אינו מוגדר, נגדיר אותו כ-null.
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// אתחול אפליקציית Firebase עם ההגדרות שנקבל
const app = initializeApp(firebaseConfig);

// קבלת מופע של שירות האימות (Auth) של Firebase
const auth = getAuth(app);

// קבלת מופע של שירות מסד הנתונים Cloud Firestore
const db = getFirestore(app);

if (initialAuthToken) {
  signInWithCustomToken(auth, initialAuthToken)
    .then(() => {
      console.log("Signed in with custom token successfully.");
    })
    .catch(error => {
      console.error("Error signing in with custom token:", error);
      // במקרה של שגיאה עם הטוקן המותאם אישית, ננסה להיכנס כאנונימי
      signInAnonymously(auth)
        .then(() => console.log("Signed in anonymously after custom token failure."))
        .catch(anonError => console.error("Error signing in anonymously:", anonError));
    });
} else {
  signInAnonymously(auth)
    .then(() => {
      console.log("Signed in anonymously successfully.");
    })
    .catch(error => {
      console.error("Error signing in anonymously:", error);
    });
}

// ייצוא המופעים של db, auth ו-app כדי שניתן יהיה להשתמש בהם בקומפוננטות אחרות
export { db, auth, app };