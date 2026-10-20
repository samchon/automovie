import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * A target that is a fixed world point, for a place no staged node marks, such
 * as a spot on the ground to walk to. Use an {@link IAutoMovieNodeTarget} when
 * the target is a thing in the scene.
 *
 * `resolveTargetPoint` returns the point itself, and `performShot` refuses a
 * missing point or one with a non-finite coordinate. A camera framing a point
 * frames a stand-in figure of default height standing on it.
 *
 * @evidence contracts/common.md#principled-implementation resolveTargetPoint returns the supplied vector by reference in world metres. Shot admission first checks finite point components, then may prefer a host targetAt answer; the reference actor synthesizer uses the literal point directly, so callback consistency remains a host premise.
 * @evidence contracts/common.md#clear-and-simple-design One vector is the whole target, and it reuses the shared `IAutoMovieVector3` rather than three loose numbers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A non-finite point is refused rather than clamped, and the point is never snapped to a nearby node.
 * @evidence contracts/common.md#meaningful-documentation States when to use it and when not, how it resolves, the refusals and how a camera frames it; the member gives the frame and unit.
 */
export interface IAutoMoviePointTarget {
  /** Selects a fixed world-space point as the target representation. */
  kind: "point";

  /** World-space point in metres. */
  point: IAutoMovieVector3;
}
