/**
 * Vertical body-mass oscillation attached to a gait cycle.
 *
 * @author Samchon
 */
export interface IAutoMovieGaitRootBob {
  /** Peak displacement from `center`, in meters. */
  amplitude: number;

  /** Cycle phase offset in `[0, 1)`. */
  phase: number;

  /** Neutral vertical translation, in meters. */
  center: number;
}
