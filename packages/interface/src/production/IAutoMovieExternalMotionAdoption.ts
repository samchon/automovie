import type { IAutoMovieSkeleton } from "../skeleton/IAutoMovieSkeleton";
import { IAutoMovieExternalMotionAdoptionMode } from "./IAutoMovieExternalMotionAdoptionMode";
import { IAutoMovieExternalMotionMappingEntry } from "./IAutoMovieExternalMotionMappingEntry";

/**
 * User-owned decision to adopt one external motion take in one shot.
 *
 * The engine validates and applies this record. It does not select the asset,
 * take, target actor, adoption mode, or retarget mapping.
 *
 * @evidence requirements/motion/external-motion-inputs.md#motion-external-adoption-mode Makes native use and retargeting explicit user choices.
 * @evidence specifications/interchange-and-adoption/adoption-decisions-and-composition.md#interchange-selection-override-resolution Carries the selected source member, target, and composition mode.
 *
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Types `IAutoMovieExternalMotionAdoption` for the performance motion external adoption receipt system contract.
 * @author Samchon
 */
export interface IAutoMovieExternalMotionAdoption {
  /**
   * Stable adoption identity.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-adoption-receipt Gives the adoption a production-owned receipt identity.
   * @evidence specifications/interchange-and-adoption/adoption-decisions-and-composition.md#interchange-selection-override-resolution Identifies this exact source-to-target decision.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-adoption-mode Exposes `id` as the portable data boundary for the motion external adoption mode requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Types `id` for the performance motion external adoption receipt system contract.
   */
  id: string;

  /**
   * Manifest-owned external motion asset path.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-adoption-mode Joins the decision to digest-bound source bytes.
   * @evidence specifications/interchange-and-adoption/adoption-decisions-and-composition.md#interchange-selection-override-resolution Names the adopted source identity.
   *
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Types `asset` for the performance motion external adoption receipt system contract.
   */
  asset: string;

  /**
   * Take id from the asset's inspected motion record.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-adoption-mode Makes source-member selection explicit.
   * @evidence specifications/interchange-and-adoption/adoption-decisions-and-composition.md#interchange-selection-override-resolution Selects one inspected member without provider inference.
   *
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Types `take` for the performance motion external adoption receipt system contract.
   */
  take: string;

  /**
   * Shot contract in which the adoption is available.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-adoption-mode Bounds use to one authored shot decision.
   * @evidence specifications/interchange-and-adoption/adoption-decisions-and-composition.md#interchange-selection-override-resolution Identifies the composition scope.
   *
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Types `shot` for the performance motion external adoption receipt system contract.
   */
  shot: string;

  /**
   * Actor participant that performs the adopted take.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-adoption-mode Leaves target selection to the production.
   * @evidence specifications/interchange-and-adoption/adoption-decisions-and-composition.md#interchange-selection-override-resolution Identifies the selected target participant.
   *
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Types `actor` for the performance motion external adoption receipt system contract.
   */
  actor: string;

  /**
   * Stable clip id exposed to the shot source after successful adoption.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-adoption-receipt Gives downstream composition a stable adopted-result identity.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Preserves motion identity at the source boundary.
   */
  clip: string;

  /**
   * Authored semantic source rig reconciled with the byte-inspected basis.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-source-basis Provides the source rig basis needed to interpret imported node tracks.
   * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-external-adoption-retarget-characterization Carries source rest hierarchy for native compatibility and retarget characterization.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-adoption-mode Exposes `sourceRig` as the portable data boundary for the motion external adoption mode requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Types `sourceRig` for the performance motion external adoption receipt system contract.
   */
  sourceRig: IAutoMovieSkeleton;

  /**
   * Explicit source-node to target-semantic-bone mappings.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-compatibility-override Makes imported channel interpretation explicit in both adoption modes.
   * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-external-adoption-retarget-characterization Carries the characterized node-to-semantic mapping.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-adoption-mode Exposes `mapping` as the portable data boundary for the motion external adoption mode requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Types `mapping` for the performance motion external adoption receipt system contract.
   */
  mapping: IAutoMovieExternalMotionMappingEntry[];

  /**
   * Explicit native or humanoid-retarget adoption decision.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-adoption-mode Prevents the engine from choosing retargeting on the user's behalf.
   * @evidence specifications/interchange-and-adoption/adoption-decisions-and-composition.md#interchange-selection-override-resolution Records the selected adoption mode and its parameters.
   *
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Types `mode` for the performance motion external adoption receipt system contract.
   */
  mode: IAutoMovieExternalMotionAdoptionMode;
}
