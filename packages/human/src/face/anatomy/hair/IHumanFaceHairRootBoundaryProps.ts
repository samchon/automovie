/**
 * The current closed collider whose original skin faces precede appended cap faces.
 *
 * @evidence contracts/common.md#principled-implementation Original and appended face incidence are aligned with one current coordinate snapshot.
 * @evidence contracts/common.md#clear-and-simple-design One coordinate/incidence pair defines the boundary compiler input.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The boundary reads actual source faces rather than a radius-based surrogate.
 * @evidence contracts/common.md#meaningful-documentation States current stage, caller ownership, frame and original-face prefix.
 * @evidence contracts/modeling.md#spatial-conventions Current coordinates are head-frame metres and incidence is dimensionless.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The source owns parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels This record defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The closure compiler owns cap population.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The boundary compiler admits actual support.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair consumer observes output.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Numerical collider incidence certifies no tissue anatomy.
 * @evidenceExclude contracts/anatomy.md#permitted-range No clinical range is admitted.
 * @evidenceExclude contracts/anatomy.md#parametric-authority This is compiled geometry, not a personal control.
 *
 * @author Samchon
 */
export interface IHumanFaceHairRootBoundaryProps {
  /** Flat current XYZ coordinates, head-frame metres, owned by the caller. */
  positions: readonly number[];

  /** Original oriented incidence plus the current cap's appended faces. */
  indices: readonly number[];
}
