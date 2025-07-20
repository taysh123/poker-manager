// src/utils/calculations.js

export function calculateSettlements(players) {
  const settlements = [];

  const profits = players.map(p => ({
    name: p.name,
    amount: (p.cashOut * p.chipRatio) - p.buyIn,
  }));

  const debtors = profits.filter(p => p.amount < 0).map(p => ({ ...p, amount: -p.amount }));
  const creditors = profits.filter(p => p.amount > 0);

  let i = 0, j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const payment = Math.min(debtor.amount, creditor.amount);

    settlements.push({
      from: debtor.name,
      to: creditor.name,
      amount: payment.toFixed(2),
    });

    debtor.amount -= payment;
    creditor.amount -= payment;

    if (debtor.amount <= 0.001) i++;
    if (creditor.amount <= 0.001) j++;
  }

  return settlements;
}