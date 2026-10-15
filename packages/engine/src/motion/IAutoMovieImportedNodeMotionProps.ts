import type {
  AutoMovieHumanoidBone,
  IAutoMovieClip,
  IAutoMovieJointAxes,
  IAutoMovieSkeleton,
} from "@automovie/interface";

import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { IAutoMovieImportedNodeBoneMapping } from "./IAutoMovieImportedNodeBoneMapping";

/**
 * Complete deterministic lowering input for one imported node-track clip.
 * Conversion keeps authored source key times and admits only one common
 * step or linear interpolation law. Linear quaternion slerp generally differs from clinical-axis interpolation between retained keys; step retains interval values. Each mapped node needs a rotation track;
 * only hips translation is representable beside those rotations.
 *
 * @evidence contracts/common.md#principled-implementation Supplies the selected clip, normalized source skeleton and explicit one-to-one mapping needed to remove rest rotation and decompose source quaternions into clinical coordinates under declared axes and rest frames.
 * @evidence contracts/common.md#clear-and-simple-design Imported channel facts and clinical interpretation enter one conversion boundary; target-skeleton retargeting remains a later operation with separate inputs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unmapped channels, non-hips translation, scales, weights, mixed interpolation and cubic splines are refused instead of sampled into an approximate supported form.
 * @evidence contracts/common.md#meaningful-documentation Identifies retained key times, supported channels/laws, explicit mapping and clinical defaults, and states the between-key quaternion-versus-axis interpolation limitation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This input bundle performs no key-time union or quaternion decomposition; the converter owns those traversals.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Borrowing one selected take and skeleton creates no promise to reuse conversions after either mutable input changes.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns the clip, skeleton and mapping list for the conversion call; no copied keyframe buffer or native handle belongs to the props type.
 *
 * @author Samchon
 */
export interface IAutoMovieImportedNodeMotionProps {
  /** Selected imported node-track take. */
  clip: IAutoMovieClip;

  /** Declared normalized skeleton describing source clinical semantics. */
  sourceSkeleton: IAutoMovieSkeleton;

  /** Explicit one-to-one node-to-bone mapping. */
  mapping: readonly IAutoMovieImportedNodeBoneMapping[];

  /** Stable id for the native clinical motion. */
  motionId: string;

  /**
   * Optional source-rig clinical axes, falling back to the canonical humanoid
   * table; a source bone's own declared axes take precedence.
   */
  sourceJointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;

  /**
   * Optional source clinical rest frames, falling back to the canonical
   * humanoid table.
   */
  sourceRestFrames?: Partial<
    Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>
  >;
}
