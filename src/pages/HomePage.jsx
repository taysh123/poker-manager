import { useNavigate } from 'react-router-dom';

function HomePage() {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '80vh',
      gap: '20px'
    }}>
      <h1>ברוכים הבאים לניהול פוקר</h1>
      <button
        style={{ padding: '20px 40px', fontSize: '1.5rem', cursor: 'pointer' }}
        onClick={() => navigate('/tournament')}
      >
        ניהול טורניר
      </button>
      <button
        style={{ padding: '20px 40px', fontSize: '1.5rem', cursor: 'pointer' }}
        onClick={() => navigate('/cash')}
      >
        ניהול משחקי קאש
      </button>
      <button
        style={{ padding: '20px 40px', fontSize: '1.5rem', cursor: 'pointer' }}
        onClick={() => navigate('/sessions')}
      >
        משחקים שמורים
      </button>
      <button
        style={{ padding: '20px 40px', fontSize: '1.5rem', cursor: 'pointer' }}
        onClick={() => navigate('/player-stats')}
      >
        סטטיסטיקות שחקנים
      </button>
    </div>
  );
}

export default HomePage;
