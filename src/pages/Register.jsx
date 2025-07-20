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
      navigate('/'); // ניווט לדף הבית לאחר הרשמה מוצלחת
    } catch (err) {
      console.error(err); // הדפסת השגיאה המלאה לקונסול
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
        <button type="submit">הירשם</button>
      </form>
      {error && <p style={{ color: 'red', marginTop: 10 }}>{error}</p>}
      <p style={{ marginTop: 20 }}>
        יש לך כבר חשבון? <Link to="/login">התחבר כאן</Link>
      </p>
    </div>
  );
}

export default Register;