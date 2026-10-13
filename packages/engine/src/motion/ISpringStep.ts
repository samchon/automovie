/**
 * Per-axis state a {@link dampedSpring} threads across frames.
 *
 * @author Samchon
 */
export interface ISpringStep {
  /** The sprung value this step. */
  value: number;
  /** Velocity carried into the next step. */
  velocity: number;
}
