import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Selected represented foot of one analytic ocular exterior for a query.
 * Head-frame metres. `signedDistance` is negative inside the cap-replaced
 * solid. Numerical meridian/profile uncertainty does not enclose world-frame
 * reduction, placement or returned-distance roundoff and is separate from
 * tissue clearance.
 *
 *
 * @evidence contracts/common.md#principled-implementation A selected represented foot accompanies its normal, signed query distance and represented meridian/profile uncertainty; world-frame and final-distance arithmetic are not enclosed by that value.
 * @evidence contracts/common.md#clear-and-simple-design The analytic exterior producer owns candidate selection and downstream seating/contact keep their separate representations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The foot need not be the real minimizer and numeric uncertainty cannot become a contact tolerance.
 * @evidence contracts/common.md#meaningful-documentation Fields give head-frame metres, selected foot meaning, inside sign and separate error.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IHumanFaceOcularSurfaceHit is an erased geometry/source contract; its concrete producer or reader owns actual algorithms and population traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IHumanFaceOcularSurfaceHit declares correspondence only; its concrete owner decides geometry copies, shared readings and invalidation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IHumanFaceOcularSurfaceHit acquires no runtime buffer, handle or task; concrete builders/readers own referenced arrays and optional callback retention.
 *
 * @author Samchon
 */
export interface IHumanFaceOcularSurfaceHit {
  /** Selected feasible represented foot; it need not be the exact real minimizer. */
  point: IAutoMovieVector3;

  /** Unit outward normal of the exterior at that point. */
  normal: IAutoMovieVector3;

  /** Distance to the selected represented foot, negative inside the analytic solid. */
  signedDistance: number;

  /** Represented meridian root/profile-evaluation uncertainty; excludes frame reduction, world placement and final-distance roundoff, and is not a contact tolerance. */
  distanceErrorMetres: number;
}
