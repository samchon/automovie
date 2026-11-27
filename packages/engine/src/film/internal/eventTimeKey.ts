/*
 * The time segment of an interaction event id: shot-local seconds written with
 * `toFixed(6)` formatting, as in `hit:arrow:foe:1.250000`.
 *
 * Fixed precision keeps an id stable across producers that compute the same
 * numeric instant and keeps ordinary shot times readable. Distinct instants in
 * the same rounding bin collide; arbitrarily close instants can straddle a bin
 * boundary. Magnitudes at least 1e21 use exponent notation, and nonfinite
 * inputs retain their standard number spelling.
 */
export function eventTimeKey(time: number): string {
  return time.toFixed(6);
}
