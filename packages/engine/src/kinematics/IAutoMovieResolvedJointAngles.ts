/**
 * Three fully resolved angular coordinates of one joint, in degrees.
 *
 * All values are numbers: unlike an authored joint pose, none is an omitted
 * axis and this result carries no bone identity. Quaternion decomposition
 * obtains rest-relative coordinates and lifts them through the caller's
 * optional clinical rest frame. The conversion owner determines which frame
 * the numbers use; this record does not declare physiological capacity.
 *
 * @author Samchon
 */
export interface IAutoMovieResolvedJointAngles {
  /**
   * Resolved flexion/extension coordinate, degrees in the conversion owner's declared frame.
   */
  flexion: number;

  /** Resolved abduction/adduction coordinate, degrees in the same frame. */
  abduction: number;

  /** Resolved axial twist coordinate, degrees in the same frame. */
  twist: number;
}
