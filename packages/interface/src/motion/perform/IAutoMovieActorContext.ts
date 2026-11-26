import type { IAutoMovieVector3 } from "../../geometry/IAutoMovieVector3";
import type { IAutoMoviePose } from "../../pose/IAutoMoviePose";
import type { IAutoMovieRestFrame } from "../../pose/IAutoMovieRestFrame";
import type { AutoMovieHumanoidBone } from "../../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieSkeleton } from "../../skeleton/IAutoMovieSkeleton";
import type { IAutoMovieGait } from "../IAutoMovieGait";

/**
 * Borrowed per-actor inputs to the reference action synthesizer: skeleton id,
 * named gaits, staged metre position, ground speed, +Y facing, eye height and
 * rest articulation. Optional rig and clinical rest frames enable constrained
 * gaze and arm/reaction solves.
 */
export interface IAutoMovieActorContext {
  /** Id shared by the actor's poses, gaits and optional rig. */
  skeleton: string;

  /**
   * Borrowed available cycles; reference synthesis rejects duplicate names and
   * looks up exact action gait names.
   */
  gaits: IAutoMovieGait[];

  /**
   * Staged actor ground origin in world metres; a verified prior beat can
   * replace it with its carried translation.
   */
  position: IAutoMovieVector3;

  /**
   * Positive finite ground speed in metres/second used for locomotion sizing,
   * not vertical travel speed.
   */
  speed: number;

  /**
   * Seconds into the looping gait cycle at the opening beat; omitted or null
   * starts at the cycle beginning.
   */
  gaitPhase?: number | null;

  /** The previous gait's cycle duration in seconds, when known. */
  gaitPeriod?: number;

  /**
   * Finite degrees about +Y, zero facing +Z; staged synthesis supports this
   * rigid heading rather than arbitrary affine placement.
   */
  facingDeg: number;

  /**
   * Finite vertical eye offset in metres for gaze origin and staged actor aim
   * targets; animated eye FK is not represented.
   */
  eyeHeight: number;

  /**
   * Borrowed clinical articulation used by hold and seeded into gait bones that
   * the cycle does not drive.
   */
  restPose: IAutoMoviePose;

  /**
   * Optional matching skeleton geometry and clinical constraints;
   * arms/reactions require it, gaze distributes over its neck/head ranges when
   * present and otherwise uses its existing single-head fallback.
   */
  rig?: IAutoMovieSkeleton;

  /**
   * Optional clinical sign/neutral frames for arm IK, paired with the same
   * convention in playback; omitted entries use reachPose's canonical humanoid
   * rest frames rather than raw rest-relative angles.
   */
  restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;
}
