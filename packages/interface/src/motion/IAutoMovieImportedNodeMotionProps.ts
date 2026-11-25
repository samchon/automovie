import type { IAutoMovieClip } from "../core/IAutoMovieClip";
import type { IAutoMovieRestFrame } from "../pose/IAutoMovieRestFrame";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieJointAxes } from "../skeleton/IAutoMovieJointAxes";
import type { IAutoMovieSkeleton } from "../skeleton/IAutoMovieSkeleton";
import type { IAutoMovieImportedNodeBoneMapping } from "./IAutoMovieImportedNodeBoneMapping";

/**
 * Complete deterministic lowering input for one imported node-track clip.
 * Conversion keeps authored source key times and admits only one common step or
 * linear interpolation law. Linear quaternion slerp generally differs from
 * clinical-axis interpolation between retained keys; step retains interval
 * values. Each mapped node needs a rotation track; only hips translation is
 * representable beside those rotations.
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
