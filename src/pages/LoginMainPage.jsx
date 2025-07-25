import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signInAnonymously, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faLock } from '@fortawesome/free-solid-svg-icons'; // אייקונים רגילים
import { faGoogle } from '@fortawesome/free-brands-svg-icons'; // אייקון גוגל מחבילת ה-brands
import './LoginMainPage.css'; // נצטרך ליצור קובץ CSS עבורו

// רכיב Modal פשוט להודעות אישור ושגיאה (הועתק מ-PlayerManagement)
const CustomModal = ({ message, onConfirm, onCancel, type }) => {
  if (!message) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <p>{message}</p>
        <div className="modal-actions">
          {type === 'confirm' && (
            <>
              <button onClick={onConfirm} className="modal-button confirm-button">אישור</button>
              <button onClick={onCancel} className="modal-button cancel-button">ביטול</button>
            </>
          )}
          {type === 'alert' && (
            <button onClick={onCancel} className="modal-button confirm-button">הבנתי</button>
          )}
        </div>
      </div>
    </div>
  );
};

function LoginMainPage() {
  const [loadingAuth, setLoadingAuth] = useState(true);
  const navigate = useNavigate();
  const auth = getAuth();

  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('alert');
  const [modalOnConfirm, setModalOnConfirm] = useState(null);
  const [modalOnCancel, setModalOnCancel] = useState(null);

  // פונקציה לפתיחת המודל
  const openModal = (message, type = 'alert', onConfirm = null, onCancel = null) => {
    setModalMessage(message);
    setModalType(type);
    setModalOnConfirm(() => onConfirm); // השתמש ב-callback כדי לשמור את הפונקציה
    setModalOnCancel(() => onCancel || (() => setModalMessage(''))); // אם אין onCancel ספציפי, סגור את המודל
  };

  // פונקציה לסגירת המודל
  const closeModal = () => {
    setModalMessage('');
    setModalType('alert');
    setModalOnConfirm(null);
    setModalOnCancel(null);
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        // אם המשתמש כבר מחובר (אפילו כאורח), נווט לדף הבית
        navigate('/home'); 
      } else {
        setLoadingAuth(false);
      }
    });
    return () => unsubscribe();
  }, [navigate, auth]);

  const handleGuestLogin = async () => {
    try {
      await signInAnonymously(auth);
      navigate('/home'); // נווט לדף הבית לאחר התחברות כאורח
    } catch (error) {
      console.error("Error signing in anonymously:", error);
      openModal("שגיאה בהתחברות כאורח. נסה שוב.", 'alert', null, closeModal);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // Firebase SDK מטפל בניווט לאחר התחברות מוצלחת
      // אין צורך ב-navigate() כאן, ה-onAuthStateChanged יטפל בזה
    } catch (error) {
      console.error("Error signing in with Google:", error);
      // Firebase specific error codes for Google login
      if (error.code === 'auth/popup-closed-by-user') {
        openModal("התחברות Google בוטלה על ידי המשתמש.", 'alert', null, closeModal);
      } else if (error.code === 'auth/cancelled-popup-request') {
        openModal("בקשת התחברות Google בוטלה.", 'alert', null, closeModal);
      } else {
        openModal("שגיאה בהתחברות עם Google. נסה שוב.", 'alert', null, closeModal);
      }
    }
  };

  if (loadingAuth) {
    return (
      <div className="page-container login-main-container">
        <p style={{ textAlign: 'center', color: 'var(--text-color)' }}>טוען...</p>
      </div>
    );
  }

  return (
    <div className="page-container login-main-container">
      <CustomModal
        message={modalMessage}
        onConfirm={modalOnConfirm}
        onCancel={modalOnCancel}
        type={modalType}
      />

      <div className="login-card">
        <h2>ברוכים הבאים!</h2>
        <p>בחר כיצד ברצונך להתחבר:</p>
        
        <button onClick={handleGuestLogin} className="login-button guest-button">
          <FontAwesomeIcon icon={faUser} /> התחבר כאורח
        </button>

        <div className="divider">או</div>

        <button onClick={() => navigate('/login')} className="login-button email-password-button">
          <FontAwesomeIcon icon={faEnvelope} /> התחבר עם אימייל וסיסמה
        </button>

        <button onClick={() => navigate('/register')} className="login-button register-button">
          <FontAwesomeIcon icon={faLock} /> הירשם
        </button>

        <button onClick={handleGoogleLogin} className="login-button google-button">
          <FontAwesomeIcon icon={faGoogle} /> התחבר עם Google
        </button>
      </div>
    </div>
  );
}

export default LoginMainPage;