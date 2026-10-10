import type { IHumanExactFraction } from "./IHumanExactFraction";

/** Exact rational enclosures of sine and cosine at one represented angle.
 *
 * @author Samchon
 */
export interface IHumanTrigonometricBounds {
  /** Dimensionless lower and upper enclosure of the real sine. */
  sin: readonly [IHumanExactFraction, IHumanExactFraction];

  /** Dimensionless lower and upper enclosure of the real cosine. */
  cos: readonly [IHumanExactFraction, IHumanExactFraction];
}
