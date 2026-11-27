import type { IAutoMoviePoseKeypointFrame } from "./IAutoMoviePoseKeypointFrame";

/**
 * The per-frame pose-keypoint sidecar of one sequence render: the
 * machine-readable, OpenPose-style companion to the rendered `pose` guide pass,
 * as the caption sidecar accompanies the beauty frames.
 *
 * A diffusion host can read it frame for frame to drive pose-conditioned
 * (ControlNet) generation. `planPoseKeypointSidecar` builds it and
 * `renderPoseKeypointSidecar` serializes it for the host to write; this
 * declaration does not implement that external host.
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
