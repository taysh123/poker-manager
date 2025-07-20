import React, { useState, useEffect, useRef } from 'react';

function formatTime(seconds) {
  if (seconds < 0) seconds = 0;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function TournamentTimer({ levels, anteEnabled }) {
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(levels.length > 0 ? levels[0].duration : 0);
  const timerRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    // איפוס הטיימר בכל פעם שמערך ה-levels משתנה
    setCurrentLevelIndex(0);
    setTimeLeft(levels.length > 0 ? levels[0].duration : 0);
    setIsRunning(false);
  }, [levels]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (currentLevelIndex < levels.length - 1) {
              setCurrentLevelIndex(currentLevelIndex + 1);
              return levels[currentLevelIndex + 1].duration;
            } else {
              clearInterval(timerRef.current);
              setIsRunning(false);
              return 0;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning, currentLevelIndex, levels]);

  const startTimer = () => setIsRunning(true);
  const stopTimer = () => setIsRunning(false);
  const resetTimer = () => {
    setIsRunning(false);
    setCurrentLevelIndex(0);
    setTimeLeft(levels.length > 0 ? levels[0].duration : 0);
  };

  const currentLevel = levels[currentLevelIndex] || {};

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', marginTop: '20px' }}>
      <h3>ניהול טורניר - בליינדים</h3>
      {levels.length > 0 ? (
        <>
          <p>רמה: {currentLevel.level}</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20 }}>
            <span>**בליינד קטן:** {currentLevel.smallBlind}</span>
            <span>**בליינד גדול:** {currentLevel.bigBlind}</span>
            {anteEnabled && <span>**אנטה:** {currentLevel.ante}</span>}
          </div>
          <h1 className="timer-display" style={{ fontSize: '3rem', fontWeight: 'bold', textAlign: 'center' }}>
            {formatTime(timeLeft)}
          </h1>
          <div className="timer-controls" style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
            <button onClick={startTimer}>התחל</button>
            <button onClick={stopTimer} style={{ backgroundColor: '#f44336' }}>עצור</button>
            <button onClick={resetTimer} style={{ backgroundColor: '#ff9800' }}>אפס</button>
          </div>
        </>
      ) : (
        <p>יש להוסיף רמות בליינדים כדי להתחיל.</p>
      )}
    </div>
  );
}

export default TournamentTimer;