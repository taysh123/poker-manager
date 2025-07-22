import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers } from '@fortawesome/free-solid-svg-icons';

function PlayerCountWidget({ playerCount }) {
  return (
    <div className="dashboard-widget">
      <h3><FontAwesomeIcon icon={faUsers} /> מספר שחקנים</h3>
      <p className="text-5xl font-bold text-blue-600">{playerCount}</p>
      <p className="text-sm text-gray-500">סה"כ שחקנים במערכת</p>
    </div>
  );
}

export default PlayerCountWidget;
