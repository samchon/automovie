/** Transverse support dimensions and section twist of one arm.
 */
export interface IAutoMovieHumanArmSupplement {
  /** Fore-aft depth of the internal upper-arm support section, mm. */
  upperArmDepthMm: number;

  /** Fore-aft depth of the internal forearm support section, mm. */
  forearmDepthMm: number;

  /** Transverse elbow support breadth, mm. */
  elbowBreadthMm: number;

  /** Fore-aft elbow support depth, mm. */
  elbowDepthMm: number;

  /** Forearm section rotation relative to its proximal chart, degrees. */
  forearmTwistDegrees: number;
}
