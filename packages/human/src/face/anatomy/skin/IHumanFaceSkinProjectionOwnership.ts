/**
 * A represented guide interval with a certified exact open-interval owner.
 * Bounds round actual ordered crossings; the sign is read between their
 * exact root enclosures, not from a rounded midpoint that could be a tie.
 *
 * @author Samchon
 */
export interface IHumanFaceSkinProjectionOwnership {
  /** Lower represented guide parameter of the interval. */
  lower: number;
  /** Upper represented guide parameter of the interval. */
  upper: number;
  /** Negative selects the first feature, positive the second, zero a whole-interval tie. */
  sign: number;
}
