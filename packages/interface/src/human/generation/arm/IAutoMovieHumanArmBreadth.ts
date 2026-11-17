import type { IAutoMovieHumanSiteViewPart } from "../limb/IAutoMovieHumanSiteViewPart";

/** Type contracts exchanged by AutoMovieHumanArmBreadth; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanArmBreadth {
  /** Actual source and positive family multiplier after residual admission.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Actual source and positive family multiplier after residual admission.
   * @evidence contracts/development/design.md#principled-representation `input`: Identical source declaration to be lofted by the production caller. `scale`: Dimensionless across multiplier, with no person-specific coefficient.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanArmBreadth.fit. Also types AutoMovieHumanArmWalk.normalized.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `input`, `scale`; callers supply the complete record.
   */
  export interface IResult {
    /** Identical source declaration to be lofted by the production caller. */
    input: IAutoMovieHumanSiteViewPart.IInput;
    /** Dimensionless across multiplier, with no person-specific coefficient. */
    scale: number;
  }

  /** Physical deltoid support-search interval [lower, upper], millimetres along the source axis. maximum refuses a non-increasing interval or an endpoint outside the admitted outline. Read the selected source's outward support using the common scalar owner.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Physical deltoid support-search interval [lower, upper], millimetres along the source axis.
   * @evidence contracts/development/design.md#principled-representation Physical deltoid support-search interval [lower, upper], millimetres along the source axis. maximum refuses a non-increasing interval or an endpoint outside the admitted outline. The outer tuple/array is readonly; nested element types determine whether their contents can change.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanArmBreadth.MaximumDomain is the canonical exchange used by AutoMovieHumanArmBreadth.maximum.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanArmBreadth.maximum, AutoMovieHumanArmBreadth.fit for physical deltoid support-search interval [lower, upper], millimetres along the source axis.
   */
  export type Domain = readonly [
    lowerMillimetres: number,
    upperMillimetres: number,
  ];

  /** Maximum outward deltoid support with its attaining station, both millimetres; a string is the source admission or nonfinite-support refusal. Read the selected source's outward support using the common scalar owner.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Maximum outward deltoid support with its attaining station, both millimetres; a string is the source admission or nonfinite-support refusal.
   * @evidence contracts/development/design.md#principled-representation Maximum outward deltoid support with its attaining station, both millimetres; a string is the source admission or nonfinite-support refusal. Alternatives are a record with radius, station; string.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanArmBreadth.IMaximumResult is the canonical exchange used by AutoMovieHumanArmBreadth.maximum.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanArmBreadth.maximum for maximum outward deltoid support with its attaining station, both millimetres; a string is the source admission or nonfinite-support refusal.
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
