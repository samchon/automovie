import { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * One named humanoid joint projected to screen space: the OpenPose-style
 * keypoint automovie can emit exactly because it already knows every bone's 3D
 * world position. `x` and `y` are normalized to the delivered frame (`[0, 1]`,
 * top-left origin, after any delivery crop), so a host scales them to whatever
 * resolution it renders at.
 *
 * A joint behind the camera or outside the frame rectangle is still projected
 * and flagged `inFrame: false` instead of clamped, because a clamped off-screen
 * point reads as a false edge keypoint and corrupts pose conditioning; a
 * consumer keeps or drops it deliberately. Such a joint's `x` or `y` may lie
 * outside `[0, 1]`. A bone the skeleton lacks is omitted rather than emitted.
 *
 * @evidence contracts/common.md#principled-implementation `resolvePoseKeypoints` resolves the pose by forward kinematics, lifts each bone by the staged node's TRS, projects it with `projectToNdc` through the camera's vertical field of view, the render aspect and the delivery crop, then maps NDC to the top-left frame by `x = (ndcX + 1) / 2` and `y = (1 - ndcY) / 2`.
 * @evidence contracts/common.md#clear-and-simple-design The record carries only the bone, two normalized coordinates and one visibility flag, so pixel scaling and confidence policy stay with the host that knows its raster.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Off-frame and behind-camera joints are reported unclamped with the flag set rather than snapped to an edge or dropped, and a missing bone is omitted rather than invented at a guessed position.
 * @evidence contracts/common.md#meaningful-documentation States the coordinate origin, direction and normalization including the crop, why off-frame points are kept unclamped, that coordinates may leave `[0, 1]`, and the exact visibility test.
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
