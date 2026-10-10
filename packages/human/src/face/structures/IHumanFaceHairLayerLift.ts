/**
 * Outward styling bias and its arc-length decay on a connected hair lock.
 * This direction field is authored kinematics, not a force or tissue law.
 *
 * @author Samchon
 */
export interface IHumanFaceHairLayerLift {
  /** Nonnegative dimensionless outward direction weight. */
  strength: number;

  /** Positive exponential decay distance along the lock, metres. */
  reach: number;
}
