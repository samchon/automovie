import type { IAutoMovieHumanFaceBasisEye } from "./IAutoMovieHumanFaceBasisEye";
import type { IAutoMovieHumanFaceBasisJaw } from "./IAutoMovieHumanFaceBasisJaw";

/**
 * The articulated performance of a face basis: one mandible and two globes
 * (`IAutoMovieHumanFaceBasis.articulation` states the model and its sources).
 *
 * @evidence contracts/common.md#principled-implementation One source-authored mandible and named globe records compose the basis's deterministic articulation model, with shaped landmark centres and supported joint paths owned by their declarations.
 * @evidence contracts/common.md#clear-and-simple-design Jaw and eye-list ownership stay distinct, while the enclosing basis documents the common frame and approximation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts These records do not certify an individual's clinical jaw/gaze trajectory, universal ranges or independent simultaneous extrema; admission stays with the resolver/build owners.
 * @evidence contracts/common.md#meaningful-documentation The comment links the complete model/source account and members identify the mandible and anatomical leftEye/rightEye identities.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This schema performs no rigid transform, landmark evaluation or motion-budget comparison.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The joint grouping defines no shaped-pose cache or shared transform result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The basis owns its eye records; this declaration allocates no rig buffers or runtime handle.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceBasisArticulation {
  /** The mandible. */
  jaw: IAutoMovieHumanFaceBasisJaw;

  /** The globes, `leftEye` and `rightEye`. */
  eyes: IAutoMovieHumanFaceBasisEye[];
}
