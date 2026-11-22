/**
 * Seat release in seconds after the rise begins. McDonald, Villarejo Mayor
 * and Lennon (2025, Frontiers in Bioengineering and Biotechnology 13:1605524)
 * place the end of the flexion phase at 36 percent of sit-to-stand time.
 * Requested balance acts on the resulting support phase without moving this event.
 *
 * @param rising Duration of the rise in seconds.
 * @returns Seconds from the start of the rise to seat release.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the clock origin, units, balance relationship and published phase share.
 * @evidence contracts/development/implementation.md#principled-implementation Scales the authored duration by the sourced end of trunk flexion, when support transfers away from the seat.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The event uses one multiplication of the caller's rise duration.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The phase follows elapsed rise time independent of build size, sample rate and optional balance fitting.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A scalar multiplication with no numerical search.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work There is no intermediate value required by another computation.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function holds no state and allocates no input-dependent storage.
 */
export function riseSeatOff(rising: number): number {
  return 0.36 * rising;
}
