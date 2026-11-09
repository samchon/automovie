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
 * @evidence contracts/development/design.md#principled-representation Supplies the selected clip, normalized source skeleton and explicit one-to-one mapping needed to remove rest rotation and decompose source quaternions into clinical coordinates under declared axes and rest frames.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Imported channel facts and clinical interpretation enter one conversion boundary; target-skeleton retargeting remains a later operation with separate inputs.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Unmapped channels, non-hips translation, scales, weights, mixed interpolation and cubic splines are refused instead of sampled into an approximate supported form.
 * @evidence contracts/development/common.md#meaningful-documentation Identifies retained key times, supported channels/laws, explicit mapping and clinical defaults, and states the between-key quaternion-versus-axis interpolation limitation.
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
