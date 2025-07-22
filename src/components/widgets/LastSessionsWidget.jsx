import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHistory } from '@fortawesome/free-solid-svg-icons';

function LastSessionsWidget({ sessions }) {
  // נציג רק את 3 הסשנים האחרונים לדוגמה
  const displaySessions = sessions.slice(0, 3);

  return (
    <div className="dashboard-widget">
      <h3><FontAwesomeIcon icon={faHistory} /> סשנים אחרונים</h3>
      {displaySessions.length > 0 ? (
        <ul className="list-none p-0 w-full text-right">
          {displaySessions.map(session => (
            <li key={session.id} className="border-b border-gray-200 py-2 flex justify-between items-center w-full">
              <span>{new Date(session.date).toLocaleDateString('he-IL')} - {session.gameType}</span>
              <span className={session.profitLoss >= 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                {session.profitLoss.toLocaleString('he-IL', { style: 'currency', currency: 'ILS' })}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p>אין סשנים אחרונים להצגה.</p>
      )}
    </div>
  );
}

export default LastSessionsWidget;
