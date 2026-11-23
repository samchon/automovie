import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";

/**
 * Named physical stations borrowed from the original view-part knot contract.
 * Runtime construction and admission remain with AutoMovieHumanHeadFrontSource
 * in Human.
 */
export namespace IAutoMovieHumanHeadFrontSource {
  /** A station identity, without a surrogate source value. */
  export type Site = Pick<IAutoMovieViewPart.IKnot, "site" | "station">;
}
