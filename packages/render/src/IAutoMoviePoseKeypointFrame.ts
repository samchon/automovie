import type { IAutoMoviePoseKeypointActor } from "./IAutoMoviePoseKeypointActor";

/**
 * One output frame of the pose-keypoint sidecar: the live beat and every
 * performing actor's projected joints.
 *
 * Unlike the caption sidecar, which stores run-length spans because a caption
 * holds for a whole shot, the pose sidecar stores every frame, because poses
 * change every frame.
 *
 * @evidence contracts/common.md#principled-implementation One record per output frame is the representation of a per-frame signal, and the frame index and beat are the same frame clock and shot-to-beat mapping the caption plan uses, so the two sidecars align frame for frame.
 * @evidence contracts/common.md#clear-and-simple-design The record holds only the frame index, the beat and the actor list; the clock itself lives once on the sidecar.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A frame whose shot, scene or camera does not resolve keeps its record with an empty actor list, so no frame is skipped or invented.
 * @evidence contracts/common.md#meaningful-documentation The doc states what one record covers and why the sidecar is per frame rather than run-length, and each member states its meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms An interface describes data and runs no algorithm; building frames is answered on `planPoseKeypointSidecar`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A frame record is written once per output frame by the planner and coordinates no work between phases.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A frame record owns no handle; its actor list is part of the sidecar the caller keeps.
 * @author Samchon
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
