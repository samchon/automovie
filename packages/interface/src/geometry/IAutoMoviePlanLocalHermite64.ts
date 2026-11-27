import type { IAutoMovieLocalHermiteField64 } from "./IAutoMovieLocalHermiteField64";
import type { IAutoMoviePlanLocalHermite64Plan } from "./IAutoMoviePlanLocalHermite64Plan";

/** Prepared physical Hermite field and bounded per-interval planning closure. */
export namespace IAutoMoviePlanLocalHermite64 {
  /**
   * Bounded adaptive planner and analytic field for one immutable physical
   * Hermite run. Input admission occurs before this record is returned. The
   * closures retain the input and prepared field; keep stations, courses and
   * policy unchanged until both closures are released.
   */
  export type IResult = {
    /**
     * Prepared field closures borrowing admitted courses and physical stations;
     * field interval/station query errors propagate directly from those
     * operations.
     */
    field: IAutoMovieLocalHermiteField64.Prepared;

    /**
     * Recomputes an owned plan for a zero-based interval on each call. Indices
     * at or beyond courses.length-1 return empty arrays for terminal lookahead;
     * invalid earlier indices and local arithmetic become a reason. Budget
     * exhaustion discards all leaves for that interval.
     */
    plan: (interval: number) => IAutoMoviePlanLocalHermite64Plan;
  };
}
