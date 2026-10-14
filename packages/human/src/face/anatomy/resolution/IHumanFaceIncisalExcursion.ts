/**
 * Incisal movement from the same identity's closed reference, in millimetres along the shared contact axes. Absolute final overjet and dental-midline offset are different quantities owned by IHumanFaceIncisalOffset.
 *
 * @evidence contracts/common.md#principled-implementation Performed-minus-same-identity reference offsets distinguish anterior/lateral movement from absolute final dental relationships.
 * @evidence contracts/common.md#clear-and-simple-design Jaw capacity and measurement readers consume this reference-relative result separately from IHumanFaceIncisalOffset.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No clinical motion bound or source trajectory is inferred, and missing reference remains a gap.
 * @evidence contracts/common.md#meaningful-documentation Forward and anatomical-left movement use millimetres in the shared contact frame.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Offset subtraction executes in readHumanFaceIncisalExcursion.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The shared offset instrument supplies both performed and shaped reference readings.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only two derived scalars belong to the caller; source point/context lifetime remains with the measurement build.
 *
 * @author Samchon
 */
export interface IHumanFaceIncisalExcursion {
  /** Positive anterior movement from closed reference, including initial overjet. */
  forward: number;

  /** Positive anatomical-left movement, correcting initial midline deviation. */
  left: number;
}
