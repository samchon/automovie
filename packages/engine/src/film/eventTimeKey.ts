/** Canonical time key for an interaction event id: six-decimal seconds. */
export const eventTimeKey = (time: number): string => time.toFixed(6);
