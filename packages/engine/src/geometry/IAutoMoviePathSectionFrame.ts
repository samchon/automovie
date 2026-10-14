import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The orthonormal frame a swept or lofted section is placed in at one path
 * point, produced by `pathFrames`.
 *
 * A section point `(x, y)` sits at `point + right * x + up * y`, and the
 * section faces along `tangent`. The three unit vectors form a right-handed
 * basis with `up = tangent x right`, in the path's metre frame.
 *
 * @evidence contracts/common.md#principled-implementation Three unit axes are the minimum that place a planar section in space, and keeping the tangent beside them lets the builders orient end caps without recomputing it.
 * @evidence contracts/common.md#clear-and-simple-design A named record for what `pathFrames` returns and the sweep and loft read, instead of a private shape each consumer had to infer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The frame carries no scale or twist correction of its own; any twist is what the transport produced and is visible in the section's placement.
 * @evidence contracts/common.md#meaningful-documentation States the producer, how a section point is placed, the handedness, and the frame and unit.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A record; the transport cost is answered on `pathFrames`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One frame per path point, computed once per builder call.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Three owned vectors per path point, released with the builder's frame list when it returns.
 * @author Samchon
 */
export interface IAutoMoviePathSectionFrame {
  /** Unit direction of travel along the path at this point. */
  tangent: IAutoMovieVector3;

  /** Unit section X axis, perpendicular to the tangent. */
  right: IAutoMovieVector3;

  /** Unit section Y axis, `tangent x right`. */
  up: IAutoMovieVector3;
}
