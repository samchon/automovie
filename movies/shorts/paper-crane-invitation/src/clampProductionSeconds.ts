/**
 * Admit a finite seek time and clamp it to the closed production interval.
 * Duration is positive finite seconds; invalid inputs throw before placement.
 *
 * @evidence contracts/common.md#implementation-and-ownership This reusable pure helper has no current Viewer consumer; finite inputs preserve interior time and clamp to zero or the authored duration without retaining state.
 * @evidence contracts/common.md#authoring-interface Supply seconds and a positive finite duration in the same timebase. Nonfinite seconds or invalid duration throw; returned seconds always lie in the closed interval.
 */
export function clampProductionSeconds(
  seconds: number,
  duration: number,
): number {
  if (!Number.isFinite(seconds)) throw new Error("Seek seconds must be finite");
  if (!Number.isFinite(duration) || duration <= 0)
    throw new Error("Production duration must be positive and finite");
  return Math.max(0, Math.min(duration, seconds));
}
