import { IAutoMovieSweep } from "./IAutoMovieSweep";
import { compileAutoMovieSweepProfile } from "./compileAutoMovieSweepProfile";

/**
 * Compile one silhouette guide's angle and positive radius profile.
 *
 * @param guide Authored guide, read without mutation
 * @param index Its index for refusal diagnostics
 * @returns A wrapped angle and compiled positive finite radius query
 * @throws Error for a non-finite angle or an invalid profile or profile query
 *
 * @evidence contracts/common.md#principled-implementation Wraps a finite angle modulo one turn and delegates the positive radius domain to the shared scalar profile compiler.
 * @evidence contracts/common.md#clear-and-simple-design Owns guide admission separately from Gordon row composition and station/feature evaluation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Refuses invalid values without clamping radii, sorting knots or treating one consumer differently.
 * @evidence contracts/common.md#meaningful-documentation States angle wrapping, positive profile ownership and refusal behavior.
 * @evidence contracts/performance.md#efficient-algorithms Constant angle work plus the shared K-knot profile compilation; queries retain its O(log K) evaluation cost.
 * @evidence contracts/performance.md#reuse-equivalent-work The returned guide retains one compiled scalar profile reused by every row query.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Transfers one closure with O(K) spline coefficients and a diagnostic name to the sweep, released with that sweep.
 */
export function compileAutoMovieSweepGuide(
  guide: IAutoMovieSweep.IGuide,
  index: number,
): IOutput {
  if (!Number.isFinite(guide.angle))
    throw new Error(`sweep guide ${index} angle is not finite`);
  return {
    angle: ((guide.angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI),
    radius: compileAutoMovieSweepProfile(guide.radii, `sweep guide ${index}`),
  };
}

/**
 * Wrapped direction and its independently compiled radius profile.
 *
 * @author Samchon
 */
interface IOutput {
  /** Radians in one turn. */
  angle: number;

  /** Radius in metres, positive and finite at a successful query. */
  radius: (u: number) => number;
}
