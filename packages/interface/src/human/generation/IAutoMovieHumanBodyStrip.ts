import type { AutoMovieVector3Tuple } from "../../geometry/AutoMovieVector3Tuple";

/**
 * Appendage/base endpoint jets and arclength derivatives used to bridge a skin strip. Runtime construction and admission remain with AutoMovieHumanBodyStrip in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes appendage/base endpoint jets and arclength derivatives used to bridge a skin strip; nested declarations retain their units, frames, optional states and callback contracts.
 * @evidence contracts/development/design.md#principled-representation Appendage/base endpoint jets and arclength derivatives used to bridge a skin strip. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these dependency-free exchange types for AutoMovieHumanBodyStrip; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups the existing BodyStrip contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.
 */
export namespace IAutoMovieHumanBodyStrip {
  /** Both edges of one column: points and outward arc-length derivatives.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Both edges of one column: points and outward arc-length derivatives.
   * @evidence contracts/development/design.md#principled-representation `A`: Appendage end point. `a1`: Appendage's unit tangent leaving its end, into the strip. `a2`: Appendage's curvature vector there.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanBodyStrip.column. Read by AutoMovieHumanBodyStrip.blend. Also types AutoMovieHumanBodyStrip.c, AutoMovieHumanBodyStrip.before.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `A`, `a1`, `a2`, `C`, `c1`, `c2`, `l`; callers supply the complete record.
   */
  export interface IColumn {
    /** Appendage end point. */
    A: AutoMovieVector3Tuple;

    /** Appendage's unit tangent leaving its end, into the strip. */
    a1: AutoMovieVector3Tuple;

    /** Appendage's curvature vector there. */
    a2: AutoMovieVector3Tuple;

    /** Base point on the root loop. */
    C: AutoMovieVector3Tuple;

    /** Base's unit tangent across the loop, away from the hole. */
    c1: AutoMovieVector3Tuple;

    /** Base's curvature vector there. */
    c2: AutoMovieVector3Tuple;

    /** Edge length: the reach times the chord between the edges, mm. */
    l: number;
  }

  /**
   * First and second arclength derivatives across a chain at the requested chart point, in the chain's world frame. The first is dimensionless; the second has inverse-millimetre units. The owning operation uses the available chain jet or its documented finite-difference estimate.
   *
   * @evidence contracts/development/common.md#meaningful-documentation First and second arclength derivatives across a chain at the requested chart point, in the chain's world frame. The first is dimensionless; the second has inverse-millimetre units. The owning operation uses the available chain jet or its documented finite-difference estimate.
   * @evidence contracts/development/design.md#principled-representation First and second arclength derivatives across a chain at the requested chart point, in the chain's world frame. The first is dimensionless; the second has inverse-millimetre units. The owning operation uses the available chain jet or its documented finite-difference estimate.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanBodyStrip.AcrossResult is the canonical exchange used by AutoMovieHumanBodyStrip.across.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The alias retains the existing AutoMovieHumanBodyStrip input/result boundary and its documented ordering, units and absence states; it introduces no fixture-specific branch or widened escape type.
   */
  export type AcrossResult = [AutoMovieVector3Tuple, AutoMovieVector3Tuple];
}
