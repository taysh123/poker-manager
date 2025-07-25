import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPause, faRedo, faForward, faBackward } from '@fortawesome/free-solid-svg-icons'; // ייבוא אייקונים חדשים

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
              setCurrentLevelIndex(prevIndex => prevIndex + 1); 
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

  // פונקציות לשליטה בטיימר
  const startTimer = () => setIsRunning(true);
  const stopTimer = () => setIsRunning(false);
  const resetTimer = () => {
    setIsRunning(false);
    setCurrentLevelIndex(0);
    setTimeLeft(levels.length > 0 ? levels[0].duration : 0);
  };

  const nextLevel = () => {
    if (currentLevelIndex < levels.length - 1) {
      setCurrentLevelIndex(prevIndex => prevIndex + 1);
      setTimeLeft(levels[currentLevelIndex + 1].duration);
      setIsRunning(true);
    } else {
      setIsRunning(false);
      setTimeLeft(0);
    }
  };

  const prevLevel = () => {
    if (currentLevelIndex > 0) {
      setCurrentLevelIndex(prevIndex => prevIndex - 1);
      setTimeLeft(levels[currentLevelIndex - 1].duration);
      setIsRunning(true); 
    }
  };

  const currentLevel = levels[currentLevelIndex] || {};

  return (
    <div className="timer-section"> {/* שינוי ל-className */}
      <h3><FontAwesomeIcon icon={faTrophy} /> טיימר טורניר</h3>
      {levels.length > 0 ? (
        <>
          <p className="level-info">רמה: {currentLevel.level}</p> {/* שינוי ל-className */}
          <div className="blind-info-group"> {/* שינוי ל-className */}
            <span>**בליינד קטן:** {currentLevel.smallBlind}</span>
            <span>**בליינד גדול:** {currentLevel.bigBlind}</span>
            {anteEnabled && <span>**אנטה:** {currentLevel.ante}</span>}
          </div>
          <h1 className="timer-display">
            {formatTime(timeLeft)}
          </h1>
          <div className="timer-controls">
            <button onClick={prevLevel} disabled={currentLevelIndex === 0}>
              <FontAwesomeIcon icon={faBackward} /> רמה קודמת
            </button>
            <button onClick={startTimer} className="start-button" disabled={isRunning}>
              <FontAwesomeIcon icon={faPlay} /> התחל
            </button>
            <button onClick={stopTimer} className="pause-button" disabled={!isRunning}>
              <FontAwesomeIcon icon={faPause} /> השהה
            </button>
            <button onClick={nextLevel} disabled={currentLevelIndex === levels.length - 1}>
              <FontAwesomeIcon icon={faForward} /> רמה הבאה
            </button>
            <button onClick={resetTimer} className="reset-button">
              <FontAwesomeIcon icon={faRedo} /> איפוס
            </button>
          </div>
        </>
      ) : (
        <p>הגדר מבנה בליינדים כדי להפעיל את הטיימר.</p>
      )}
    </div>
  );
}

export default TournamentTimer;