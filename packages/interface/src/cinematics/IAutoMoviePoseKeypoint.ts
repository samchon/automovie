import { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * One named humanoid joint projected to screen space (#1168): the exact
 * OpenPose-style keypoint automovie can emit because it already knows every
 * bone's exact 3D world position. `x`/`y` are normalized to the frame (`[0,
 * 1]`, top-left origin), resolution-independent so a host scales them to
 * whatever it renders at.
 *
 * A joint behind the camera or outside the frame rectangle is still projected
 * (never silently clamped: a clamped off-screen point reads as a false edge
 * keypoint and corrupts ControlNet conditioning) but flagged `inFrame: false`,
 * so a consumer keeps it or drops it deliberately. Such a joint's `x` or `y`
 * may lie outside `[0, 1]`. A bone the skeleton lacks is omitted rather than
 * emitted.
 *
 * @evidence contracts/common.md#principled-implementation `resolvePoseKeypoints` runs forward kinematics in rig space, applies the staged node's TRS, projects through the shot camera at the sampled time with the delivery crop, and maps NDC onto a top-left unit frame without clamping.
 * @evidence contracts/common.md#clear-and-simple-design Carries only bone, position and a visibility flag; aspect, crop and joint selection are resolver inputs, so one record serves every raster size.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Bones the skeleton lacks are skipped rather than given a fabricated position; when no aspect is passed the resolver assumes 16:9, which misplaces `x` for any other raster.
 * @evidence contracts/common.md#meaningful-documentation States the frame origin and axes, that off-frame points are projected unclamped and may leave [0, 1], that missing bones are omitted, and that `inFrame` also requires depth within the clip range.
 * @author Samchon
 */
export interface IAutoMoviePoseKeypoint {
  /** The named humanoid bone this keypoint locates. */
  bone: AutoMovieHumanoidBone;

  /** Normalized horizontal position, `0` = left frame edge, `1` = right. */
  x: number;

  /** Normalized vertical position, `0` = top frame edge, `1` = bottom. */
  y: number;

  /**
   * Whether the joint lies between the camera's near and far clip distances
   * AND within the frame rectangle.
   */
  inFrame: boolean;
}
