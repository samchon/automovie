/**
 * One 2 mm station pair of the vermilion margin: the upper component's
 * lowest vertex and the lower component's highest vertex at one station
 * along the jaw axis. The pairs anchor the margin chains.
 *
 * @author Samchon
 */
export interface IHumanSourceLipMarginPair {
  /** Upper vermilion vertex on the lips surface. */
  upper: number;

  /** Lower vermilion vertex facing it across the fissure. */
  lower: number;
}
