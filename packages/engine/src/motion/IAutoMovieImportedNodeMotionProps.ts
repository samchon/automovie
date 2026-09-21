import type { AutoMovieHumanoidBone, IAutoMovieClip, IAutoMovieSkeleton } from "@automovie/interface";
import type { IAutoMovieJointAxes } from "../kinematics/IAutoMovieJointAxes";
import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { IAutoMovieImportedNodeBoneMapping } from "./IAutoMovieImportedNodeBoneMapping";

/**
 * Complete deterministic lowering input for one imported node-track clip.
 *
 * @evidence requirements/motion/external-motion-inputs.md#motion-external-adoption-mode Implements the explicitly selected retarget conversion path.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Defines the source-to-native conversion boundary.
 * @author Samchon
 */
export interface IAutoMovieImportedNodeMotionProps {
  /**
   * Selected imported node-track take.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-source-basis Consumes the exact selected take, duration, clock, channels, and loop basis.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Retains the take's declared source basis in the adopted motion.
   */
  clip: IAutoMovieClip;
  /**
   * Declared normalized skeleton describing source clinical semantics.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-source-basis Fixes the source rig and rest basis.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Preserves the imported skeleton and rest basis as part of the chosen source.
   */
  sourceSkeleton: IAutoMovieSkeleton;
  /**
   * Explicit one-to-one node-to-bone mapping.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-compatibility-override Refuses an unresolved or ambiguous semantic map.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Makes the accepted source-to-bone mapping part of the explicit adoption input.
   */
  mapping: readonly IAutoMovieImportedNodeBoneMapping[];
  /**
   * Stable id for the native clinical motion.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-adoption-receipt Lets the caller bind the converted result to its receipt.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Avoids an engine-invented output identity.
   */
  motionId: string;
  /**
   * Optional source-rig clinical axes, falling back to the canonical humanoid
   * table.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-source-basis Makes the source rotation basis explicit.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Preserves the selected source joint basis through adoption.
   */
  sourceJointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;
  /**
   * Optional source clinical rest frames, falling back to the canonical
   * humanoid table.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-source-basis Preserves the declared source rest basis used to interpret node rotations.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Carries the selected clinical rest basis into deterministic lowering.
   */
  sourceRestFrames?: Partial<
    Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>
  >;
}
