import type { AutoMovieVector3Tuple } from "../../geometry/AutoMovieVector3Tuple";

/** Type contracts exchanged by AutoMovieHumanBodyStrip; runtime evaluation remains in Human. */
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

  /** Result of AutoMovieHumanBodyStrip.across. First and second derivatives of a chain along the chart direction
  `(dt, ds)` (phase, station) at a chart point, by arc length: from its
  jet where the chain carries one, otherwise from differences of its
  points over about {@link H} mm.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation First and second derivatives of a chain along the chart direction `(dt, ds)` (phase, station) at a chart point, by arc length: from its jet where the chain carries one, otherwise from differences of its points over about {@link H} mm.
 * @evidence contracts/development/design.md#principled-representation First and second derivatives of a chain along the chart direction `(dt, ds)` (phase, station) at a chart point, by arc length: from its jet where the chain carries one, otherwise from differences of its points over about {@link H} mm. Ordered tuple slots are 0, 1; fixed arity preserves their correspondence.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanBodyStrip.AcrossResult is the canonical exchange used by AutoMovieHumanBodyStrip.across.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanBodyStrip.across for first and second derivatives of a chain along the chart direction `(dt, ds)` (phase, station) at a chart point, by arc length: from its jet where the chain carries one, otherwise from differences of its points over about {@link H} mm.
 */
  export type AcrossResult = [AutoMovieVector3Tuple, AutoMovieVector3Tuple];
}
