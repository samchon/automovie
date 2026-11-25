/**
 * The reach of the end masses from the core of a tuck, metres: 0.6 until 0.4 s,
 * a minimum-jerk fold to 0.25 over [0.4, 0.6] s, then 0.25.
 *
 * @param t The time, seconds.
 * @returns The distance of each end mass from the core.
 */
export const airborneTuckReach: (t: number) => number = (t: number): number => {
  const u: number = Math.max(0, Math.min(1, (t - 0.4) / 0.2));
  return 0.6 + (0.25 - 0.6) * (10 * u ** 3 - 15 * u ** 4 + 6 * u ** 5);
};
