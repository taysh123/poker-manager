import React, { useState } from 'react';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const auth = getAuth();
      await createUserWithEmailAndPassword(auth, email, password);
      navigate('/home'); 
    } catch (err) {
      console.error(err);  
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError('האימייל שהזנת כבר בשימוש.');
          break;
        case 'auth/invalid-email':
          setError('כתובת אימייל לא תקינה.');
          break;
        case 'auth/weak-password':
          setError('הסיסמה חלשה מדי. נדרשים 6 תווים לפחות.');
          break;
        default:
          setError('שגיאה בהרשמה: ' + err.message);
          break;
      }
    }
  };

  return (
    <div className="page-container">
      <h2>הרשמה</h2>
      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 15, maxWidth: 300, margin: 'auto' }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="אימייל"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="סיסמה (6 תווים לפחות)"
          required
        />
        {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
        <button type="submit">הירשם</button>
      </form>

      <div style={{ marginTop: 20, textAlign: 'center', color: 'var(--text-color)' }}>
        כבר יש לך חשבון? <Link to="/login" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>התחבר כאן</Link>
      </div>
    </div>
  );
}

export default Register;