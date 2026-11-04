import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieSurfaceFrame } from "./IAutoMovieSurfaceFrame";

/**
 * Three rigid sample points prepared by prepareAutoMovieSurfaceFrame.
 * All records and the offset tuple are frozen. Offsets are centroid-relative
 * metres along forward, normal-cross-forward, and normal, respectively. Their
 * order is the original point order; placement never refits their lengths.
 *
 * @evidence contracts/common.md#principled-implementation Coordinates in an orthonormal source basis preserve the original triangle under a change to another orthonormal basis, up to binary64 rounding.
 * @evidence contracts/common.md#clear-and-simple-design Retains the source placement and three fixed offsets rather than retaining a mesh, skeleton or evaluator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No dimensions are guessed or snapped to a plane; the normal-coordinate residual is retained rather than discarded.
 * @evidence contracts/common.md#meaningful-documentation States the factory, frozen ownership, centroid basis, metre unit, point ordering and retained floating-point residual.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This type declares fixed data; preparation and placement own their arithmetic.
 * @evidence contracts/performance.md#reuse-equivalent-work The frozen offsets remain reusable for every destination while the three source sample points are unchanged; editing source points requires preparing again.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns one frame and exactly three offsets until it releases this record; no input array, scene or query history is retained.
 */
export interface IAutoMoviePreparedSurfaceFrame {
  /** Frozen centroid and unit source directions, useful for a round trip. */
  readonly frame: IAutoMovieSurfaceFrame;

  /** Frozen original-order point coordinates in the orthonormal source basis. */
  readonly offsets: readonly [
    Readonly<IAutoMovieVector3>,
    Readonly<IAutoMovieVector3>,
    Readonly<IAutoMovieVector3>,
  ];
}
