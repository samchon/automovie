/**
 * Legacy project record boundary. The stored format preserves its existing
 * identities and units; runtime consumers use the same declared fields.
 */
import type { IAutoMovieGaitCycle } from "@automovie/interface";
import type { IAutoMovieLegacyKeyframe } from "./IAutoMovieLegacyKeyframe";

/**
 * JSON-safe motion clip crossing the v1 `perform` boundary, returned as the
 * compiled per-actor clips, and supplied by the caller as the authored clips an
 * `enact` action plays (#1148).
 *
 * @author Samchon
 */
export interface IAutoMovieLegacyMotion {
  /**
   * Stable id so scenes and exports can cite this clip.
   */
  id: string;

  /**
   * Which skeleton this clip animates. Every keyframe pose targets this rig.
   */
  skeleton: string;

  /**
   * Total clip length, seconds. Every keyframe `time` must be `<= duration`.
   */
  duration: number;

  /**
   * Whether the clip loops seamlessly. When `true`, the engine expects the last
   * keyframe to be continuous with the first.
   */
  loop: boolean;

  /**
   * Keyframes in strictly increasing `time` order. At least two are required: a
   * clip needs a start and an end to interpolate between.
   */
  keyframes: IAutoMovieLegacyKeyframe[];

  /**
   * The gait cycle the motion carries ({@link IAutoMovieGaitCycle}), how a
   * non-looping compiled performance still reports a stride phase at the beat
   * end. Absent/null = no cycle to resume.
   */
  gaitCycle?: IAutoMovieGaitCycle | null;
}
