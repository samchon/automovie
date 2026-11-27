import type { IAutoMovieDeliveryCrop } from "../cinematics/IAutoMovieDeliveryCrop";
import type { IAutoMovieSequence } from "../cinematics/IAutoMovieSequence";
import type { IAutoMovieShot } from "../cinematics/IAutoMovieShot";
import type { IAutoMovieMotion } from "../motion/IAutoMovieMotion";
import type { IAutoMovieScene } from "../scene/IAutoMovieScene";
import type { IAutoMovieSkeleton } from "../skeleton/IAutoMovieSkeleton";

/**
 * Sequence clock and resolvable scene/motion/skeleton inputs for projected
 * joint records. planPoseKeypointSidecar preserves one row per output frame,
 * skips unresolved actors, and uses full-frame projection unless crop is
 * supplied. Aspect defaults to 16/9 in resolvePoseKeypoints; this declaration
 * performs no numerical admission.
 */
export interface IAutoMoviePlanPoseKeypointSidecarProps {
  /** The cut being rendered. */
  sequence: IAutoMovieSequence;

  /** Every shot the cut references; extra shots are ignored. */
  shots: IAutoMovieShot[];

  /** The staged scenes the shots play over. */
  scenes: readonly IAutoMovieScene[];

  /** The motions the shots' performances reference. */
  motions: readonly IAutoMovieMotion[];

  /** The skeletons the motions target. */
  skeletons: readonly IAutoMovieSkeleton[];

  /** Output frames per second, the render clock, not necessarily `sequence.fps`. */
  fps: number;

  /**
   * Render aspect, width over height; `resolvePoseKeypoints` assumes 16/9 when
   * omitted.
   */
  aspect?: number;

  /**
   * Normalized delivery crop the keypoints are expressed in; the whole frame
   * when omitted.
   */
  crop?: IAutoMovieDeliveryCrop;
}
