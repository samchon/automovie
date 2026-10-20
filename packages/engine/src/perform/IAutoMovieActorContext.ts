import {
  AutoMovieHumanoidBone,
  IAutoMovieGait,
  IAutoMoviePose,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";

import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";

/**
 * Borrowed per-actor inputs to the reference action synthesizer: skeleton id, named gaits, staged metre position, ground speed, +Y facing, eye height and rest articulation. Optional rig and clinical rest frames enable constrained gaze and arm/reaction solves.
 *
 * @evidence contracts/common.md#principled-implementation Collects the exact inputs read by makeActorSynthesizer; host staging supplies finite quantities and matching skeleton/pose/rig data, while prior verified beats may replace position, facing, speed, phase and pose.
 * @evidence contracts/common.md#clear-and-simple-design Keeps synthesis inputs together without owning timeline assembly or importing a renderer object.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Rig-less gaze keeps the existing single-bone fallback, while arm and reaction verbs require geometry; no guessed arm lengths or anatomical height fraction is stored here.
 * @evidence contracts/common.md#meaningful-documentation Member comments state metres, metres/second, degrees, phase seconds, optional-rig behavior and paired clinical rest-frame conventions.
 * @evidence contracts/performance.md#efficient-algorithms The record itself has no runtime algorithm; gait lookup and IK cost live in the synthesizer, and the number of gaits/bones drives those operations.
 * @evidence contracts/performance.md#reuse-equivalent-work Gaits, rest pose, rig and rest frames are borrowed across actions; replacement on a resumed beat happens through a new context record rather than mutation of this record.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The host owns context data for the shot and any resumed snapshots; the interface retains no renderer, native solver or task.
 */
export interface IAutoMovieActorContext {
  /** Id shared by the actor's poses, gaits and optional rig. */
  skeleton: string;

  /** Borrowed available cycles; reference synthesis rejects duplicate names and looks up exact action gait names. */
  gaits: IAutoMovieGait[];

  /** Staged actor ground origin in world metres; a verified prior beat can replace it with its carried translation. */
  position: IAutoMovieVector3;

  /** Positive finite ground speed in metres/second used for locomotion sizing, not vertical travel speed. */
  speed: number;

  /** Seconds into the looping gait cycle at the opening beat; omitted or null starts at the cycle beginning. */
  gaitPhase?: number | null;

  /** Finite degrees about +Y, zero facing +Z; staged synthesis supports this rigid heading rather than arbitrary affine placement. */
  facingDeg: number;

  /** Finite vertical eye offset in metres for gaze origin and staged actor aim targets; animated eye FK is not represented. */
  eyeHeight: number;

  /** Borrowed clinical articulation used by hold and seeded into gait bones that the cycle does not drive. */
  restPose: IAutoMoviePose;

  /** Optional matching skeleton geometry and clinical constraints; arms/reactions require it, gaze distributes over its neck/head ranges when present and otherwise uses its existing single-head fallback. */
  rig?: IAutoMovieSkeleton;

  /** Optional clinical sign/neutral frames for arm IK, paired with the same convention in playback; omitted entries use reachPose's canonical humanoid rest frames rather than raw rest-relative angles. */
  restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;
}
