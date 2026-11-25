import type { IAutoMovieGaitCycle } from "./IAutoMovieGaitCycle";
import type { IAutoMovieKeyframe } from "./IAutoMovieKeyframe";

/**
 * A time-based animation clip: an ordered sequence of keyframes over a fixed
 * duration, targeting one skeleton.
 *
 * The engine samples sparse keyframes with their outgoing easing for playback
 * and compilation. Motion validation checks ordered timing, per-keyframe
 * angular changes and declared joint ranges. The repository currently
 * implements no VRMA, VMD or glTF animation exporter; its model GLB exporter
 * emits static rest geometry.
 *
 * The clip is frame-rate independent: `duration` and keyframe `time`s are in
 * seconds, sampled at whatever fps the consumer renders.
 */
export interface IAutoMovieMotion {
  /** Stable id so scenes and exports can cite this clip. */
  id: string;

  /** Which skeleton this clip animates. Every keyframe pose targets this rig. */
  skeleton: string;

  /** Total clip length, seconds. Every keyframe `time` must be `<= duration`. */
  duration: number;

  /**
   * Whether sampling wraps time modulo duration. The author must make the last
   * pose continuous with the first; motion validation does not prove the seam.
   */
  loop: boolean;

  /**
   * Keyframes in strictly increasing `time` order. At least two are required: a
   * clip needs a start and an end to interpolate between.
   */
  keyframes: IAutoMovieKeyframe[];

  /**
   * The gait cycle this motion carries ({@link IAutoMovieGaitCycle}), when it
   * was baked from or composed around a cyclic locomotion, lets the beat-end
   * handoff read a stride phase off a non-looping composite. Absent/`null` = no
   * carried cycle; a looping clip can still resume its duration-based phase.
   */
  gaitCycle?: IAutoMovieGaitCycle | null;
}
