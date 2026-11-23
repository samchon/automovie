import { AutoMovieArchetypeRefusal } from "../core";

/**
 * Turn a pose solver's geometric failure at one sample into the ride's typed
 * refusal, naming the film second.
 *
 * The pose solver reports an unreachable foothold or an empty body-height
 * interval as a RangeError. A ride sampled by a consumer must instead refuse as
 * the ride contract states, with the course second at fault, so a timed route
 * or authored course can be corrected there.
 *
 * @param archetype The archetype name.
 * @param seconds The film second sampled.
 * @param error The solver's error.
 * @returns The typed refusal for a RangeError.
 * @throws {unknown} Any other error, unchanged.
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
