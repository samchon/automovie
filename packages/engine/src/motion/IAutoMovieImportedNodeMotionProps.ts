import type {
  AutoMovieHumanoidBone,
  IAutoMovieClip,
  IAutoMovieSkeleton,
} from "@automovie/interface";

import type { IAutoMovieJointAxes } from "../kinematics/IAutoMovieJointAxes";
import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { IAutoMovieImportedNodeBoneMapping } from "./IAutoMovieImportedNodeBoneMapping";

/**
 * Complete deterministic lowering input for one imported node-track clip.
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
   * table.
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
