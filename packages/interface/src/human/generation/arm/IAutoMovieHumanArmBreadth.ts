import type { IAutoMovieHumanSectionSource } from "../limb/IAutoMovieHumanSectionSource";

/**
 * Type contracts exchanged by AutoMovieHumanArmBreadth; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanArmBreadth {
  /** Actual source and positive family multiplier after residual admission. */
  export interface IResult {
    /** Identical source declaration to be lofted by the production caller. */
    input: IAutoMovieHumanSectionSource;
    /** Dimensionless across multiplier, with no person-specific coefficient. */
    scale: number;
  }

  /**
   * Physical deltoid support-search interval [lower, upper], millimetres along
   * the source axis. maximum refuses a non-increasing interval or an endpoint
   * outside the admitted outline. Read the selected source's outward support
   * using the common scalar owner.
   */
  export type Domain = readonly [
    lowerMillimetres: number,
    upperMillimetres: number,
  ];

  /**
   * Maximum outward deltoid support with its attaining station, both
   * millimetres; a string is the source admission or nonfinite-support refusal.
   * Read the selected source's outward support using the common scalar owner.
   */
  export type IMaximumResult =
    | {
        /** Largest outward deltoid support from the arm axis, millimetres. */
        radius: number;
        /** Arm-axis station attaining that outward support, millimetres. */
        station: number;
      }
    | string;
}
