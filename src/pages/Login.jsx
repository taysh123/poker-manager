import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signInAnonymously, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faLock } from '@fortawesome/free-solid-svg-icons'; 
import { faGoogle } from '@fortawesome/free-brands-svg-icons'; 
import './LoginMainPage.css'; 

function LoginMainPage() {
  const [loadingAuth, setLoadingAuth] = useState(true);
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
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
      navigate('/home'); 
    } catch (error) {
      console.error("Error signing in anonymously:", error);
      alert("שגיאה בהתחברות כאורח. נסה שוב."); 
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate('/home'); 
    } catch (error) {
      console.error("Error signing in with Google:", error);
      if (error.code === 'auth/popup-closed-by-user') {
        alert("התחברות Google בוטלה על ידי המשתמש.");
      } else if (error.code === 'auth/cancelled-popup-request') {
        alert("בקשת התחברות Google בוטלה.");
      } else {
        alert("שגיאה בהתחברות עם Google. נסה שוב.");
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

        <button onClick={handleGoogleLogin} className="login-button google-button">
          <FontAwesomeIcon icon={faGoogle} /> התחבר עם Google
        </button>

        <div className="register-link">
          אין לך חשבון? <Link to="/register">הירשם כאן</Link>
        </div>
      </div>
    </div>
  );
}

export default LoginMainPage;
