/**
 * Three fully resolved angular coordinates of one joint, in degrees.
 *
 * All values are numbers: unlike an authored joint pose, none is an omitted
 * axis and this result carries no bone identity. `decomposeJointRotation`
 * obtains rest-relative coordinates from a quaternion and lifts them through
 * the caller's optional clinical rest frame, so the conversion owner decides
 * which frame the numbers use. The record does not claim the angles are within
 * any physiological range.
 */
export interface IAutoMovieResolvedJointAngles {
  /** Flexion or extension coordinate, degrees in the conversion owner's frame. */
  flexion: number;

  /** Abduction or adduction coordinate, degrees in the same frame. */
  abduction: number;

  /** Axial twist coordinate, degrees in the same frame. */
  twist: number;
}
