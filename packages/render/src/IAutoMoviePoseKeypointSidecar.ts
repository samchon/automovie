import type { IAutoMoviePoseKeypointFrame } from "./IAutoMoviePoseKeypointFrame";

/**
 * The per-frame pose-keypoint sidecar of one sequence render: the machine-readable, OpenPose-style companion to the rendered `pose` guide pass, as the caption sidecar accompanies the beauty frames.
 *
 * A diffusion host can read it frame for frame to drive pose-conditioned (ControlNet) generation. `planPoseKeypointSidecar` builds it and `renderPoseKeypointSidecar` serializes it for the host to write; this declaration does not implement that external host.
 *
 * @evidence contracts/common.md#principled-implementation The sidecar is addressed in output frames on the render's own clock, `round(runtime * fps)` frames at `i / fps`, the same schedule the render captures, so frame `i` of the sidecar describes frame `i` of the video.
 * @evidence contracts/common.md#clear-and-simple-design The record holds the target, the clock, the frame count and the frame list, nothing a consumer could not use, and the planner and serializer are separate so a host can inspect or slice before writing.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every output frame has a record even when nothing resolves on it, and no host-specific field is added.
 * @evidence contracts/common.md#meaningful-documentation The doc states what the sidecar accompanies, who reads it and for what, who builds and serializes it, and each member states its unit and invariant.
 * @evidenceExclude contracts/performance.md#efficient-algorithms An interface describes data and runs no algorithm; planning cost is answered on `planPoseKeypointSidecar`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The sidecar is the planner's result, built once per render and handed to the host; the type itself shares no work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased sidecar type opens no file; planPoseKeypointSidecar creates frame/actor/joint records retained by its caller, with storage driven by output samples and their observed populations.
 */
export interface IAutoMoviePoseKeypointSidecar {
  /** Id of the sequence the sidecar tracks. */
  target: string;

  /** Output frames per second the frames are addressed in, the render clock. */
  fps: number;

  /** Number of output frames, `round(runtime * fps)`, and of `frames`. */
  frameCount: number;

  /** One record per output frame, in play order, `frames[i].frame === i`. */
  frames: IAutoMoviePoseKeypointFrame[];
}
