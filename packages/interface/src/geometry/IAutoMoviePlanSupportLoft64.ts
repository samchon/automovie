import type { IAutoMovieConvexSupportLoft } from "../model/IAutoMovieConvexSupportLoft";

/**
 * Inputs for planning incidence events and ruled strips of a cubic support
 * loft.
 *
 * Loft stations, offsets and chord tolerance use local metres; the
 * direction-sine threshold is dimensionless and budgets count events and
 * strips. The caller admits fields and budget ranges; planning refuses
 * exhausted budgets, weak sections and unresolved numerical events without
 * certifying root intervals.
 */
export namespace IAutoMoviePlanSupportLoft64 {
  /**
   * Admitted cubic fields and budgets for continuous plane-pair boundary
   * planning. Three support planes meet when a scalar cubic slack vanishes.
   * Isolated roots use the existing normalized binary64 cubic solver; they are
   * numerical construction events, not certified intervals. The determinant
   * owner's exact-sign fallback distinguishes continuous zero incidence from a
   * small nonzero coefficient without replacing either by a geometric
   * tolerance. Near event phases can share one phase only when all their plane
   * equations hold there within the same relative arithmetic bound; otherwise
   * they refuse.
   *
   * This lower-level planner trusts admission performed by
   * realizeAutoMovieConvexSupportLoft; direct callers must establish the same
   * field and budget premises. The plan borrows source fields and normal
   * tuples, which must remain stable until emission finishes.
   */
  export type IInput = {
    /**
     * Borrowed local-metre fields admitted by
     * realizeAutoMovieConvexSupportLoft: bounded unit XZ directions, increasing
     * adjacent Y intervals and finite cubic offsets with exact shared
     * endpoints. The returned plan retains these field and normal references.
     */
    loft: IAutoMovieConvexSupportLoft;

    /**
     * Caller-admitted finite threshold strictly between zero and one; excludes
     * weak curve pairs and refuses any feasible weak section incidence.
     */
    minimumDirectionSine: number;

    /**
     * Caller-admitted positive finite metre chord tolerance used in the
     * second-derivative strip bound; independent of event-isolation and
     * boundary-roundoff uncertainty.
     */
    tolerance: number;

    /**
     * Caller-admitted nonnegative safe-integer cap on additional distinct
     * interior event stations across spans; endpoints and merged incidences do
     * not increment the count.
     */
    maxEvents: number;

    /**
     * Caller-admitted positive safe-integer cap on the sum of active section
     * edges times axial segments; exceeding it throws before mesh emission.
     */
    maxCells: number;
  };
}
