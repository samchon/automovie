import { AutoMovieArchetypeRefusal } from "../core";

/**
 * Turn a pose solver's geometric failure at one sample into the ride's typed refusal, naming the film second.
 *
 * The pose solver reports an unreachable foothold or an empty body-height interval as a RangeError. A ride sampled by a consumer must instead refuse as the ride contract states, with the course second at fault, so a timed route or authored course can be corrected there.
 *
 * @param archetype The archetype name.
 * @param seconds The film second sampled.
 * @param error The solver's error.
 * @returns The typed refusal for a RangeError.
 * @throws {unknown} Any other error, unchanged.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is converted and what passes through.
 * @evidence contracts/development/implementation.md#principled-implementation A RangeError from the reach and body-floor intersection is a request the fixed limb chains cannot satisfy at that second.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One type test.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is retried or relaxed; the refusal carries the solver's own reason.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one error.
 */
export function refuseQuadrupedReach(
  archetype: string,
  seconds: number,
  error: unknown,
): AutoMovieArchetypeRefusal {
  if (!(error instanceof RangeError)) throw error;
  return new AutoMovieArchetypeRefusal({
    kind: "parameter",
    archetype,
    axis: "course",
    value: seconds,
    feasible: null,
    reason: `at ${seconds} s the limbs cannot reach the course's footholds: ${error.message}`,
    fix: "Widen the bend, lower the speed there or move the foothold within reach.",
  });
}
