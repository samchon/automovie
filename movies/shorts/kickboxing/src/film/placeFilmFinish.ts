/**
 * Allocate unchanged final technique clocks before one exact actual impact.
 * @evidence contracts/common.md#implementation-and-ownership Subtracts the actual local first head witness and actual punch handoff duration from the commissioned impact time. Only the independent preceding setup receives the remaining positive duration; technique phases are never stretched to fit a nominal event.
 * @evidence contracts/common.md#authoring-interface Inputs and outputs use seconds. Nonfinite values, nonpositive action spans or a setup with no time refuse. The caller must supply observed admitted source boundaries; this arithmetic creates no contact or supported pose.
 */
export function placeFilmFinish(
  start: number,
  impact: number,
  handoffLocal: number,
  headWitnessLocal: number,
): { hookStart: number; kickStart: number; setupDuration: number } {
  if (
    ![start, impact, handoffLocal, headWitnessLocal].every(Number.isFinite) ||
    start < 0 ||
    handoffLocal <= 0 ||
    headWitnessLocal <= 0
  )
    throw new Error(
      "Finishing placement requires finite positive original action intervals",
    );
  const kickStart: number = impact - headWitnessLocal;
  const hookStart: number = kickStart - handoffLocal;
  const setupDuration: number = hookStart - start;
  if (!Number.isFinite(setupDuration) || setupDuration <= 0)
    throw new Error(
      "The original final actions leave no supported setup interval",
    );
  return { hookStart, kickStart, setupDuration };
}
