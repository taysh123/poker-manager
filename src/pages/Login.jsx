import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const auth = getAuth();
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError('שגיאה בכניסה. אנא בדוק את האימייל והסיסמה.');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError('שגיאה בכניסה עם גוגל.');
    }
  };

  return (
    <div className="page-container">
      <h2>התחברות</h2>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 15, maxWidth: 300, margin: 'auto' }}>
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
          placeholder="סיסמה"
          required
        />
        <button type="submit">התחבר</button>
      </form>

      <div style={{ marginTop: 20 }}>
        <button onClick={handleGoogleLogin}>
          התחבר עם Google
        </button>
      </div>

      {error && <p style={{ color: 'red', marginTop: 10 }}>{error}</p>}
      <p style={{ marginTop: 20 }}>
        אין לך חשבון? <Link to="/register">הירשם כאן</Link>
      </p>
    </div>
  );
}

export default Login;