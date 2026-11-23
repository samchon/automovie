import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * One named humanoid joint numerically projected into the delivered frame, with
 * a top-left origin after any crop. Inside the frame, `x` and `y` lie in `[0,
 * 1]`; a host scales them to its raster. These values use the engine's default
 * joint axes and rest frames, so correspondence with a renderer requires
 * matching conventions and is not observed pixel evidence.
 *
 * Projection never clamps coordinates. Behind-camera and off-frame joints
 * remain with `inFrame: false` under valid camera premises, and zero view depth
 * can yield Infinity or NaN coordinates. Requested bones absent from resolved
 * FK are omitted. The flag tests clip-depth and rectangle membership, not
 * occlusion by other geometry.
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
