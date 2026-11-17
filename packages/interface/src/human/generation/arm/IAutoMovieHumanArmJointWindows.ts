/**
 * Full physical lengths of the elbow and wrist C2 turning windows.
 * ArmWalk forwards these measured joint depths to ArmFrame, which halves each
 * length for the jointed axis's transition input. These are not joint stations.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Full physical lengths of the elbow and wrist C2 turning windows.
 * @evidence contracts/development/design.md#principled-representation `elbow`: Full elbow depth defining the elbow's physical C2 turn window, millimetres. `wrist`: Full wrist depth defining the wrist's physical C2 turn window, millimetres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanArmJointWindows is the canonical exchange used by AutoMovieHumanArmWalk.prepare, AutoMovieHumanArmWalk.create.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `elbow`, `wrist`; callers supply the complete record.
 */
export interface IAutoMovieHumanArmJointWindows {
  /** Full elbow depth defining the elbow's physical C2 turn window, millimetres. */
  elbow: number;

  /** Full wrist depth defining the wrist's physical C2 turn window, millimetres. */
  wrist: number;
}
