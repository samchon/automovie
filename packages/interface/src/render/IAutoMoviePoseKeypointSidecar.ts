import type { IAutoMoviePoseKeypointFrame } from "./IAutoMoviePoseKeypointFrame.js";

/**
 * The per-frame pose-keypoint sidecar of one sequence render: the machine-readable, OpenPose-style companion to the rendered `pose` guide pass, as the caption sidecar accompanies the beauty frames.
 *
 * A diffusion host can read it frame for frame to drive pose-conditioned (ControlNet) generation. `planPoseKeypointSidecar` builds it and `renderPoseKeypointSidecar` serializes it for the host to write; this declaration does not implement that external host.
 *
 * @evidence contracts/development/design.md#principled-representation The sidecar is addressed in output frames on the render's own clock, `round(runtime * fps)` frames at `i / fps`, the same schedule the render captures, so frame `i` of the sidecar describes frame `i` of the video.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The record holds the target, the clock, the frame count and the frame list, nothing a consumer could not use, and the planner and serializer are separate so a host can inspect or slice before writing.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every output frame has a record even when nothing resolves on it, and no host-specific field is added.
 * @evidence contracts/development/common.md#meaningful-documentation The doc states what the sidecar accompanies, who reads it and for what, who builds and serializes it, and each member states its unit and invariant.
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
