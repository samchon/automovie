import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";

/** Type contracts exchanged by AutoMovieHumanHeadFrontSource; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanHeadFrontSource {
  /** A station identity, without a surrogate source value.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A station identity, without a surrogate source value.
   * @evidence contracts/development/design.md#principled-representation A station identity, without a surrogate source value. Pick<IAutoMovieViewPart.IKnot, "site" | "station"> retains the referenced owner's constraints and mutability.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanHeadFrontSource.of.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanHeadFrontSource.of, AutoMovieHumanHeadFrontSource.upper for a station identity, without a surrogate source value.
   */
  export type Site = Pick<IAutoMovieViewPart.IKnot, "site" | "station">;
}
