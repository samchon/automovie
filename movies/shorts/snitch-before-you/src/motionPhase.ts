/**
 * Resolve a deterministic smooth phase on the production's seconds clock.
 *
 * @evidence contracts/common.md#implementation-and-ownership Uses a bounded cubic with zero endpoint velocity; no retained state, random draw or simulation step changes replay.
 * @evidence contracts/common.md#authoring-interface Finite seconds and increasing finite start/end are required. Returns0 beforestart,1 afterend and the admitted interior phase; malformed input throws.
 */
export function motionPhase(seconds: number, start: number, end: number): number {
  if (![seconds, start, end].every(Number.isFinite) || end <= start) throw new Error("Invalid motion phase interval");
  const u: number = Math.max(0, Math.min(1, (seconds - start) / (end - start)));
  return u * u * (3 - 2 * u);
}
