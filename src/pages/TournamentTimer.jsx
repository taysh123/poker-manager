import React, { useState, useEffect, useRef } from 'react';

function formatTime(seconds) {
  if (seconds < 0) seconds = 0;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function TournamentTimer({ levels, anteEnabled }) {
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  // ודא ש-levels הוא מערך ושיש בו אלמנטים לפני גישה ל-levels[0]
  const [timeLeft, setTimeLeft] = useState(levels && levels.length > 0 ? levels[0].duration : 0);
  const timerRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    // איפוס הטיימר בכל פעם שמערך ה-levels משתנה
    setCurrentLevelIndex(0);
    setTimeLeft(levels && levels.length > 0 ? levels[0].duration : 0);
    setIsRunning(false);
  }, [levels]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // אם הגענו לסוף הרמה הנוכחית
            if (currentLevelIndex < levels.length - 1) {
              // עבור לרמה הבאה
              setCurrentLevelIndex(prevIndex => prevIndex + 1);
              return levels[currentLevelIndex + 1].duration;
            } else {
              // אם הגענו לסוף כל הרמות
              clearInterval(timerRef.current);
              setIsRunning(false);
              return 0; // סיים את הטיימר
            }
          }
          return prev - 1;
        });
      }, 1000); // עדכן כל שנייה
    } else {
      clearInterval(timerRef.current); // נקה את האינטרוול אם הטיימר לא רץ
    }

    // פונקציית ניקוי עבור useEffect
    return () => clearInterval(timerRef.current);
  }, [isRunning, currentLevelIndex, levels]); // הוספת levels כתלות

  const startTimer = () => setIsRunning(true);
  const stopTimer = () => setIsRunning(false);
  const resetTimer = () => {
    setIsRunning(false);
    setCurrentLevelIndex(0);
    setTimeLeft(levels && levels.length > 0 ? levels[0].duration : 0);
  };

  const currentLevel = levels[currentLevelIndex] || {}; // ודא ש-currentLevel מוגדר היטב

  // אם אין רמות מוגדרות, הצג הודעה מתאימה
  if (!levels || levels.length === 0) {
    return (
      <div className="tournament-timer-container">
        <h3>ניהול טורניר - בליינדים</h3>
        <p>אין רמות בליינד מוגדרות. אנא הוסף רמות כדי להתחיל את הטיימר.</p>
      </div>
    );
  }

  return (
    <div className="tournament-timer-container">
      <h3>ניהול טורניר - בליינדים</h3>
      <>
        <p>רמה: {currentLevel.level}</p>
        <div className="timer-details">
          <span>**בליינד קטן:** {currentLevel.smallBlind}</span>
          <span>**בליינד גדול:** {currentLevel.bigBlind}</span>
          {anteEnabled && <span>**אנטה:** {currentLevel.ante}</span>}
        </div>
        <h1 className="timer-display">
          {formatTime(timeLeft)}
        </h1>
        <div className="timer-controls">
          <button onClick={startTimer} className="start-button">התחל</button>
          <button onClick={stopTimer} className="pause-button">השהה</button>
          <button onClick={resetTimer} className="reset-button">איפוס</button>
        </div>
      </>
    </div>
  );
}

export default TournamentTimer;