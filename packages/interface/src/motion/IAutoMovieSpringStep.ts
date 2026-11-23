/**
 * One scalar spring's updated value and velocity, carried into the next
 * integration step; velocity uses value units per second when dt uses seconds.
 */
export interface IAutoMovieSpringStep {
  /** The sprung value this step. */
  value: number;

  /** Velocity carried into the next step. */
  velocity: number;
}
