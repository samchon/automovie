/**
 * Stiffness (pull toward target) and damping (energy bleed) of a spring.
 *
 * @author Samchon
 */
export interface ISpringParams {
  /** How hard the spring pulls toward the target. Higher = snappier. */
  stiffness: number;
  /** How fast oscillation decays. Higher = less overshoot. */
  damping: number;
}
