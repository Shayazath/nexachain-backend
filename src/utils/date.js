export const istDayKey = (date = new Date()) => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

// Converts IST midnight into its equivalent UTC timestamp.
export const istDayStart = (dateKey) => {
  return new Date(`${dateKey}T00:00:00+05:30`);
};

export const istNextDayStart = (dateKey) => {
  return new Date(istDayStart(dateKey).getTime() + 86400000);
};