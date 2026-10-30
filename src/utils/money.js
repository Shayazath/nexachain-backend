// Keep monetary values to two decimal places; use Decimal128 for persisted balances and ledger entries.
export const roundMoney = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;
export const decimal = (value) => roundMoney(value).toFixed(2);
