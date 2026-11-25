/**
 * Seat release in seconds after the rise begins. McDonald, Villarejo Mayor and
 * Lennon (2025, Frontiers in Bioengineering and Biotechnology 13:1605524) place
 * the end of the flexion phase at 36 percent of sit-to-stand time. Requested
 * balance acts on the resulting support phase without moving this event.
 *
 * @param rising Duration of the rise in seconds.
 * @returns Seconds from the start of the rise to seat release.
 */
export function riseSeatOff(rising: number): number {
  return 0.36 * rising;
}
