/**
 * Finite nonnegative coefficients for a unit-mass scalar spring; stiffness uses
 * inverse seconds squared and damping inverse seconds when dt is seconds.
 */
export interface IAutoMovieSpringParams {
  /** How hard the spring pulls toward the target. Higher = snappier. */
  stiffness: number;

  /** How fast oscillation decays. Higher = less overshoot. */
  damping: number;
}
