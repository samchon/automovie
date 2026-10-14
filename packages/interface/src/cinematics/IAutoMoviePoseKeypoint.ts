import { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * One named humanoid joint numerically projected into the delivered frame, with a top-left origin after any crop. Inside the frame, `x` and `y` lie in `[0, 1]`; a host scales them to its raster. These values use the engine's default joint axes and rest frames, so correspondence with a renderer requires matching conventions and is not observed pixel evidence.
 *
 * Projection never clamps coordinates. Behind-camera and off-frame joints remain with `inFrame: false` under valid camera premises, and zero view depth can yield Infinity or NaN coordinates. Requested bones absent from resolved FK are omitted. The flag tests clip-depth and rectangle membership, not occlusion by other geometry.
 *
 * @evidence contracts/common.md#principled-implementation `resolvePoseKeypoints` resolves the pose by forward kinematics, lifts each bone by the staged node's TRS, projects it with `projectToNdc` through the camera's vertical field of view, the render aspect and the delivery crop, then maps NDC to the top-left frame by `x = (ndcX + 1) / 2` and `y = (1 - ndcY) / 2`.
 * @evidence contracts/common.md#clear-and-simple-design The record carries only the bone, two normalized coordinates and one visibility flag, so pixel scaling and confidence policy stay with the host that knows its raster.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Off-frame points are not snapped to edges, missing resolved bones are not invented, and zero-depth nonfinite projection is exposed rather than replaced. The membership flag makes no occlusion or observed-image claim.
 * @evidence contracts/common.md#meaningful-documentation States delivered-frame coordinates, default-FK compatibility premises, omission, unclamped and zero-depth results, and the depth/rectangle test without an occlusion guarantee.
 * @author Samchon
 */
export interface IAutoMoviePoseKeypoint {
  /** The named humanoid bone this keypoint locates. */
  bone: AutoMovieHumanoidBone;

  /** Normalized horizontal position, `0` at the left edge, `1` at the right. */
  x: number;

  /** Normalized vertical position, `0` at the top edge, `1` at the bottom. */
  y: number;

  /**
   * Whether the joint's view depth lies within the camera's near and far clip
   * distances and its projection lies within the frame rectangle.
   */
  inFrame: boolean;
}
