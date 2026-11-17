import type { IAutoMovieMinimumJerk } from "@automovie/interface";

/**
 * The minimum-jerk normalized profile and its first two derivatives: the
 * share of a point-to-point movement completed at normalized time `u`.
 *
 * Flash and Hogan (1985, J. Neurosci. 5:1688) showed that unconstrained
 * point-to-point arm movements follow the trajectory minimizing integrated
 * squared jerk, which for rest-to-rest motion is the quintic
 * `s(u) = 10 u^3 - 15 u^4 + 6 u^5`: zero velocity and acceleration at both
 * ends and a bell-shaped speed profile peaking at `u = 0.5` with 1.875 times
 * the mean speed. Outside `[0, 1]` the profile holds its end value with zero
 * derivatives, so a sum of units can be evaluated at any time.
 *
 * Derivatives are with respect to `u`; divide the first by the duration and
 * the second by its square for seconds.
 *
 * @param u Normalized time, any finite number.
 * @returns The share `s`, its rate `ds` and its acceleration `dds`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Cites the model, gives the polynomial, its boundary values, the out-of-range behaviour and the derivative units.
 * @evidence contracts/development/implementation.md#principled-implementation The closed-form minimum-jerk solution of Flash and Hogan 1985, evaluated as a polynomial.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Three polynomials of one variable.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A non-finite time throws.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its input.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Allocates one small record.
 */
export function minimumJerk(u: number): IAutoMovieMinimumJerk.IProfile {
  if (!Number.isFinite(u)) throw new Error("Minimum-jerk time must be finite");
  if (u <= 0) return { s: 0, ds: 0, dds: 0 };
  if (u >= 1) return { s: 1, ds: 0, dds: 0 };
  const u2: number = u * u;
  const u3: number = u2 * u;
  return {
    s: u3 * (10 - 15 * u + 6 * u2),
    ds: 30 * u2 * (1 - 2 * u + u2),
    dds: 60 * u * (1 - 3 * u + 2 * u2),
  };
}
