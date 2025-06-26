import React, { useState, useEffect, useRef } from 'react';

const levels = [
  { level: 1, smallBlind: 10, bigBlind: 20, duration: 300 },
  { level: 2, smallBlind: 20, bigBlind: 40, duration: 300 },
  { level: 3, smallBlind: 30, bigBlind: 60, duration: 300 },
  { level: 4, smallBlind: 40, bigBlind: 80, duration: 300 },
];

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
}

function TournamentTimer() {
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(levels[0].duration);
  const timerRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);

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
  }, [isRunning, currentLevelIndex]);

  const startTimer = () => setIsRunning(true);
  const stopTimer = () => setIsRunning(false);
  const resetTimer = () => {
    setIsRunning(false);
    setCurrentLevelIndex(0);
    setTimeLeft(levels[0].duration);
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', marginTop: '20px' }}>
      <h3>ניהול טורניר - בליינדים</h3>
      <p>רמה: {levels[currentLevelIndex].level}</p>
      <p>בליינד קטן: {levels[currentLevelIndex].smallBlind}</p>
      <p>בליינד גדול: {levels[currentLevelIndex].bigBlind}</p>
      <h1>{formatTime(timeLeft)}</h1>
      <button onClick={startTimer} disabled={isRunning} style={{ marginRight: '10px' }}>התחל</button>
      <button onClick={stopTimer} disabled={!isRunning} style={{ marginRight: '10px' }}>עצור</button>
      <button onClick={resetTimer}>אפס</button>
    </div>
  );
}

export default TournamentTimer;
