import { AutoMovieGravity } from "@automovie/engine";

import { AutoMovieArchetypeRefusal } from "./AutoMovieArchetypeRefusal";
import type { AutoMovieArchetypeTrack } from "./AutoMovieArchetypeTrack";

/**
 * Admit one pendulum's physical figures and compute its angular frequency.
 *
 * @param archetype The consumer's refusal name.
 * @param body Finite positive mass, gravity lever and axis moment, and finite
 *   neutral travel.
 * @returns A finite positive angular frequency, radians per second.
 * @throws {AutoMovieArchetypeRefusal} For invalid physical inputs or an
 *   unrepresentable frequency.
 */
export function ArchetypePendulumFrequency(
  archetype: string,
  body: AutoMovieArchetypeTrack.IPendulum,
): number {
  for (const axis of ["mass", "moment", "arm"] as const)
    if (!(body[axis] > 0))
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype,
        axis: `pendulum.${axis}`,
        value: body[axis],
        feasible: null,
        reason:
          "a pendulum needs finite positive mass, moment and gravity lever",
        fix: "give the physical pendulum's positive SI figures",
      });
  const weight: number = body.mass * AutoMovieGravity.STANDARD;
  const numerator: number = weight * body.arm;
  const squared: number = numerator / body.moment;
  // The square can overflow even when the frequency itself is representable.
  const omega: number =
    weight >= 2 ** -1022 &&
    numerator >= 2 ** -1022 &&
    squared >= 2 ** -1022 &&
    squared !== Infinity
      ? Math.sqrt(squared)
      : Math.exp(
          (Math.log(body.mass) +
            Math.log(AutoMovieGravity.STANDARD) +
            Math.log(body.arm) -
            Math.log(body.moment)) /
            2,
        );
  if (!(omega > 0) || omega === Infinity)
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype,
      axis: "pendulum",
      value: omega,
      feasible: null,
      reason: "the pendulum's frequency is not representable and positive",
      fix: "use physical figures with a representable angular frequency",
    });
  return omega;
}
