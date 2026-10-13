import type { AutoMovieHumanBodyNonemptyMeasurements } from "./AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyWholeBodyVolume } from "./IAutoMovieHumanBodyWholeBodyVolume";

/**
 * Whole-body material totals constraining, rather than replacing, regional anatomy.
 *
 * Regional quantities must use compatible tissue definitions and scan coverage before comparison with a whole-body observation. A single anatomical level or partial scan cannot populate complete-body totals. A total supplies no missing location or boundary of an individual muscle or fat depot; neither tape circumference nor body mass separates these compartments. Actual head-to-foot coverage must be established for whole-body observations, and supine tissue totals alone do not establish standing skin geometry.
 *
 * @evidence contracts/common.md#principled-implementation Sparse whole-body totals use the whole-body volume contract; coverage and compatible compartment definitions remain necessary premises.
 * @evidence contracts/common.md#clear-and-simple-design Three distinct material totals constrain regional anatomy without absorbing individual tissue boundary ownership.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Partial or single-level scans cannot populate complete-body totals, and body mass cannot split compartments.
 * @evidence contracts/common.md#meaningful-documentation Prose explains head-to-foot coverage, regional consistency, absent spatial boundaries and supine/standing limitations.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Composition typing executes no region summation or whole-body voxel segmentation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The composition union shares quantity definitions but coordinates no cross-scan integration or cached totals.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Whole-body scalar records retain no scan volumes, regional mesh arrays or acquisition sessions.
 * @author Samchon
 */
export type IAutoMovieHumanBodyCompositionMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Complete-body skeletal muscle, excluding organs and adipose. */
    skeletalMuscleVolume?: IAutoMovieHumanBodyWholeBodyVolume;

    /** Entire outer subcutaneous adipose depot, excluding visceral fat. */
    subcutaneousAdiposeVolume?: IAutoMovieHumanBodyWholeBodyVolume;

    /** Entire osseous skeleton, excluding articular cartilage. */
    boneVolume?: IAutoMovieHumanBodyWholeBodyVolume;
  }>;
