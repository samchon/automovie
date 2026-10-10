import type { IHumanPolynomialRoot } from "../../../common/measure/IHumanPolynomialRoot";
import type { IHumanFaceSkinProjectionOwnership } from "./IHumanFaceSkinProjectionOwnership";

/**
 * Certified signs of two native rational squared-distance quadratics,
 * their root enclosures and clipped interval partitions. Clearing rational
 * denominators retains the same exact distance order as the projection
 * owner; independently rounded affine geometry does not enter comparison.
 *
 * @author Samchon
 */
export interface IHumanFaceSkinProjectionComparison {
  /**
   * Finite root-bearing enclosures of a non-identical polynomial on the full
   * guide, including tangencies and boundary roots. An identical polynomial
   * has no isolated root list: this is empty while sign and every partition
   * interval report zero for its whole-interval tie.
   */
  rootIntervals: readonly IHumanPolynomialRoot[];

  /**
   * Partition the actual validity overlap with certified open-interval ownership.
   * Distinct crossing events require distinct represented boundaries. Tangencies
   * retain their root proof without changing open-interval ownership.
   */
  partition(
    lower: number,
    upper: number,
  ): readonly IHumanFaceSkinProjectionOwnership[];

  /**
   * Negative means the first feature is nearer; zero is an exact distance tie.
   * Parameters outside [0,1] or nonfinite parameters refuse.
   */
  sign(parameter: number): number;
}
