/**
 * One planned direction to look at a subject from.
 *
 * A viewpoint is stated relative to the subject rather than in world
 * coordinates. Angles stay the same across subjects; distance follows the
 * subject's framing radius with the minimum neighbourhood radius defined by
 * {@link frameAutoMovieViewerSubject}.
 *
 * @author Samchon
 */
export interface IAutoMovieViewerViewpoint {
  /**
   * Deterministic identity of this viewpoint within its plan.
   *
   * Derived from the angles, so the same plan yields the same identities and a
   * coverage record can say which of them were actually rendered.
   */
  id: string;

  /**
   * Compass angle around the subject's world-up axis, in degrees, measured
   * from `+Z` toward `+X`.
   */
  azimuthDeg: number;

  /**
   * Angle above the subject's horizontal plane, in degrees.
   */
  elevationDeg: number;

  /**
   * Multiplier on the distance that exactly fits the subject, where `1` fits
   * it and larger values leave surrounding context in frame.
   */
  distanceFactor: number;
}
