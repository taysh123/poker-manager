import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine } from '@fortawesome/free-solid-svg-icons';

function TotalProfitLossWidget({ totalProfitLoss }) {
  const isPositive = totalProfitLoss >= 0;
  const profitLossClass = isPositive ? 'text-green-600' : 'text-red-600';

  return (
    <div className="dashboard-widget">
      <h3><FontAwesomeIcon icon={faChartLine} /> סך רווח/הפסד</h3>
      <p className={`text-3xl font-bold ${profitLossClass}`}>
        {totalProfitLoss.toLocaleString('he-IL', { style: 'currency', currency: 'ILS' })}
      </p>
      <p className="text-sm text-gray-500">נתונים מכל הסשנים</p>
    </div>
  );
}

export default TotalProfitLossWidget;
