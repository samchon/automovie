import { AutoMovieGravity } from "@automovie/engine";

import { ArchetypeRefusal } from "./ArchetypeRefusal";
import type { ArchetypeTrack } from "./ArchetypeTrack";

/**
 * Admit one pendulum's physical figures and compute its angular frequency.
 *
 * @param archetype The consumer's refusal name.
 * @param body Finite positive mass, gravity lever and axis moment, and finite neutral travel.
 * @returns A finite positive angular frequency, radians per second.
 * @throws {ArchetypeRefusal} For invalid physical inputs or an unrepresentable frequency.
 * @evidence contracts/development/common.md#meaningful-documentation States units, physical premises, the frequency and explicit numerical failure.
 * @evidence contracts/development/implementation.md#principled-implementation The physical pendulum frequency is sqrt(m*g*arm/moment). The ordinary calculation is retained when every intermediate product and the radicand are finite and normal; the same positive law in logarithms rescues intermediate overflow or subnormal loss before exponentiating the frequency.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit physical figures, use ordinary or exceptional frequency, then admit the result.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No moment, mass, gravity lever, neutral pose, numeric floor or guessed frequency is substituted; least-normal binary64 marks precision loss rather than a physical cutoff.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A fixed number of scalar operations, with logarithms only at exceptional numeric scale.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work One frequency is prepared for each swing, never recomputed per sample.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources No body, input history or resource is retained.
 */
export function ArchetypePendulumFrequency(
  archetype: string,
  body: ArchetypeTrack.IPendulum,
): number {
  for (const axis of ["mass", "moment", "arm"] as const)
    if (!(Number.isFinite(body[axis]) && body[axis] > 0))
      throw new ArchetypeRefusal({
        kind: "parameter",
        archetype,
        axis: `pendulum.${axis}`,
        value: body[axis],
        feasible: null,
        reason:
          "a pendulum needs finite positive mass, moment and gravity lever",
        fix: "give the physical pendulum's positive SI figures",
      });
  if (!Number.isFinite(body.rest))
    throw new ArchetypeRefusal({
      kind: "parameter",
      archetype,
      axis: "pendulum.rest",
      value: body.rest,
      feasible: null,
      reason: "a pendulum needs finite neutral travel",
      fix: "give the neutral travel in degrees",
    });
  const weight: number = body.mass * AutoMovieGravity.STANDARD;
  const numerator: number = weight * body.arm;
  const squared: number = numerator / body.moment;
  const omega: number =
    Number.isFinite(weight) &&
    weight >= 2 ** -1022 &&
    Number.isFinite(numerator) &&
    numerator >= 2 ** -1022 &&
    Number.isFinite(squared) &&
    squared >= 2 ** -1022
      ? Math.sqrt(squared)
      : Math.exp(
          (Math.log(body.mass) +
            Math.log(AutoMovieGravity.STANDARD) +
            Math.log(body.arm) -
            Math.log(body.moment)) /
            2,
        );
  if (!(Number.isFinite(omega) && omega > 0))
    throw new ArchetypeRefusal({
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
