import type { IAutoMovieHumanBodyMuscleMeasurements } from "../measurements/IAutoMovieHumanBodyMuscleMeasurements";

/**
 * Target or observed measures of one gluteus maximus, separate from outer fat.
 *
 * Its broad origins span posterior ilium and sacral structures; superficial and deep fibres insert through the iliotibial tract and gluteal tuberosity. Those attachments are anatomical relations of the generated component, never XYZ coordinates a document author must sculpt. The volume below is one side's muscle belly, not buttock girth, skin projection or tissue stiffness. MRI fat fraction may accompany or replace volume as an observed scalar; it is not subcutaneous fat volume and does not establish standing skin displacement.
 *
 * @evidence contracts/common.md#principled-implementation Maximus measurements reuse independent muscle volume and PDFF provenance while preserving one-sided muscle ownership.
 * @evidence contracts/common.md#clear-and-simple-design The superficial gluteal owner shares quantity fields and keeps anatomical attachment relations separate from input scalars.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Buttock girth, skin projection, stiffness and exterior adipose are not substituted for the muscle-belly quantities.
 * @evidence contracts/common.md#meaningful-documentation Prose names cross-region origins/insertions and separates internal scalars from standing skin displacement.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Maximus typing performs no skin displacement calculation or gluteal surface reconstruction.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The gluteal alias coordinates no repeated attachment or muscle-integration solve.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Maximus metadata acquires no gluteal meshes, scans or mechanical solver tasks.
 * @author Samchon
 */
export type IAutoMovieHumanBodyGluteusMaximusMeasurements =
  IAutoMovieHumanBodyMuscleMeasurements;
