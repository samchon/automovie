/**
 * A horizontal neck section with independent anterior/posterior radii.
 * Distances are millimetres in the shared head frame.
 *
 * @evidence contracts/common.md#principled-implementation A section is a height, a transverse half width, separate anterior and posterior radii and the sagittal position of the cervical axis, which is what appendPortraitNeck turns into a ring.
 * @evidence contracts/common.md#clear-and-simple-design Five numeric fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts IPortraitNeckSection carries no behaviour, special case or compensating path; it is a declaration.
 * @evidence contracts/common.md#meaningful-documentation States the units, the descending-height rule and the sign of the sagittal axis.
 * @evidence contracts/modeling.md#spatial-conventions Millimetres in the shared head frame with +Z anterior, stated on the members.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping IPortraitNeckSection is a declaration and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels IPortraitNeckSection carries no parameter channel of a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry IPortraitNeckSection decides no primitive population; it only describes data.
 * @evidenceExclude contracts/modeling.md#shared-boundaries IPortraitNeckSection constructs no surface; it describes data only.
 * @evidenceExclude contracts/modeling.md#rendered-observation IPortraitNeckSection is a declaration and displays nothing itself; the parts built from it are observed by their owners.
 * @author Samchon
 */
export interface IPortraitNeckSection {
  /** Height of this section; sections descend from upper to lower to crop. */
  y: number;

  /** Positive transverse half-width. */
  width: number;

  /** Positive radius anterior to the section's axis. */
  front: number;

  /** Positive radius posterior to the section's axis. */
  back: number;

  /** Sagittal position of the cervical axis; positive Z points forwards. */
  centre: number;
}
