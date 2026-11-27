import type { IAutoMoviePoseKeypointActor } from "./IAutoMoviePoseKeypointActor";

/**
 * One output frame of the pose-keypoint sidecar: the live beat and every
 * performing actor's projected joints.
 *
 * Unlike the caption sidecar, which stores run-length spans because a caption
 * holds for a whole shot, the pose sidecar stores every frame, because poses
 * change every frame.
 */
export interface IAutoMoviePoseKeypointFrame {
  /** Output frame index, from 0, on the sidecar's `fps` clock. */
  frame: number;

  /**
   * Id of the beat whose shot is live on this frame: the shot id without its
   * `shot:` prefix, or the shot id itself when it has none.
   */
  beat: string;

  /** Every resolvable performing actor's keypoints on this frame, possibly none. */
  actors: IAutoMoviePoseKeypointActor[];
}
