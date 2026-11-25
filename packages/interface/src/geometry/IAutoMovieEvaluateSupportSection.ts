import type { IAutoMovieSupportSectionVertex } from "./IAutoMovieSupportSectionVertex";

/**
 * One convex XZ section obtained by intersecting oriented half-planes.
 *
 * Offsets and points use the same local metre chart; pair and tight entries
 * refer to the supplied normal order. Callers admit finite dense arrays, unit
 * normals, bounded directions and the sine threshold; numerical intersection,
 * weak-direction and area refusals propagate.
 */
export namespace IAutoMovieEvaluateSupportSection {
  /**
   * Oriented unit half-planes to intersect in an admitted finite XZ chart.
   * Enumerate boundary pairs and retain intersections satisfying every
   * inequality. Tight constraints, rather than coordinate proximity, identify a
   * common vertex. A relative residual filter delegates uncertain signs to the
   * exact-sign determinant owner. Zero incidence means exact equality for the
   * supplied doubles, independently of observation uncertainty. A weak feasible
   * pair refuses. Callers supply finite dense arrays, unit normals and a
   * bounded section.
   */
  export type IInput = {
    /**
     * Ordered unit [nx,nz] half-plane normals in the common XZ chart; the
     * caller admits finite dense directions surrounding a bounded section.
     */
    normals: readonly (readonly [number, number])[];

    /**
     * Finite metre offsets h for nx X + nz Z <= h, one per normal in identical
     * order; borrowed only for this call.
     */
    offsets: readonly number[];

    /**
     * Caller-admitted finite threshold in (0,1); a feasible tight pair below
     * this absolute determinant refuses as weakly resolved.
     */
    minimumDirectionSine: number;
  };

  /**
   * The feasible corners of one admitted half-plane intersection, with
   * canonical plane-pair identity and exact tight incidence.
   *
   * A newly owned mutable polygon with at least three distinct positive-area
   * corners. It is counter-clockwise in XZ, has no duplicate closing point and
   * throws rather than returning an empty or unresolved section.
   */
  export type IResult = IAutoMovieSupportSectionVertex[];
}
