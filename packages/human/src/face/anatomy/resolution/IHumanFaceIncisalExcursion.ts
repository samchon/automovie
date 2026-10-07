/**
 * Incisal movement from the same identity's closed reference, in millimetres
 * along the shared contact axes. Absolute final overjet and dental-midline
 * offset are different quantities owned by IHumanFaceIncisalOffset.
 *
 * @evidence contracts/common.md#principled-implementation The two reference-relative components retain movement separately from the initial incisal relationship.
 * @evidence contracts/common.md#clear-and-simple-design One field for protrusive and one for lateral excursion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Values come from two evaluated homologous incisor states, not an assumed zero reference.
 * @evidence contracts/common.md#meaningful-documentation States the reference, units, signs and distinction from absolute positions.
 * @evidence contracts/modeling.md#spatial-conventions Millimetres in the same contact frame at both states.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record creates no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The record moves no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record creates no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The reader and context own measurement and presentation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The excursion reader states the clinical quantity and source limitations.
 * @evidenceExclude contracts/anatomy.md#permitted-range The capacity owner checks the observed maximum.
 * @evidenceExclude contracts/anatomy.md#parametric-authority This is a result, not an authoring input.
 * @author Samchon
 */
export interface IHumanFaceIncisalExcursion {
  /** Positive anterior movement from closed reference, including initial overjet. */
  forward: number;

  /** Positive anatomical-left movement, correcting initial midline deviation. */
  left: number;
}
