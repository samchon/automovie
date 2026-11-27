/**
 * Full physical lengths of the elbow and wrist C2 turning windows. ArmWalk
 * forwards these measured joint depths to ArmFrame, which halves each length
 * for the jointed axis's transition input. These are not joint stations.
 */
export interface IAutoMovieHumanArmJointWindows {
  /** Full elbow depth defining the elbow's physical C2 turn window, millimetres. */
  elbow: number;

  /** Full wrist depth defining the wrist's physical C2 turn window, millimetres. */
  wrist: number;
}
