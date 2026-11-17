import type { IAutoMovieLocalHermiteField64 } from "./IAutoMovieLocalHermiteField64";
import type { IAutoMoviePlanLocalHermite64Plan } from "./IAutoMoviePlanLocalHermite64Plan";

/**
 * Prepared physical Hermite field and bounded per-interval planning closure.
 *
 * @evidence contracts/development/design.md#principled-representation The prepared field uses physical millimetre stations while interval leaves carry normalized coordinates and millimetre estimates.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IResult gives tessellation one field evaluator and one current/next interval planner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Local budget or arithmetic failure is represented by an empty plan and reason, not coarse fallback geometry.
 * @evidence contracts/development/common.md#meaningful-documentation The result describes retained inputs, lookahead and per-call planning behavior.
 */
export namespace IAutoMoviePlanLocalHermite64 {
  /**
   * Bounded adaptive planner and analytic field for one immutable physical Hermite run.
   * Input admission occurs before this record is returned. The closures retain
   * the input and prepared field; keep stations, courses and policy unchanged
   * until both closures are released.
   *
   * @evidence contracts/development/design.md#principled-representation Physical station distances in millimetres remain distinct from normalized u,t leaf coordinates and millimetre approximation estimates.
   * @evidence contracts/development/design.md#minimal-and-owned-surface tessellateAutoMovieLocalHermite64 uses field for analytic jets and plan for current/next interval conformity.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A budget or arithmetic failure returns an empty interval plan with a reason instead of retaining unqualified coarse cells.
   * @evidence contracts/development/common.md#meaningful-documentation States closure lifetime, interval addressing, terminal lookahead and local failure handling.
   */
  export type IResult = {
    /** Prepared field closures borrowing admitted courses and physical stations; field interval/station query errors propagate directly from those operations. */
    field: IAutoMovieLocalHermiteField64.Prepared;

    /**
     * Recomputes an owned plan for a zero-based interval on each call. Indices at or beyond courses.length-1 return empty arrays for terminal lookahead; invalid earlier indices and local arithmetic become a reason. Budget exhaustion discards all leaves for that interval.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States interval ordinals, terminal lookahead, owned recomputed plans and reason/empty-leaf behavior for arithmetic or budget failures.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no body; planAutoMovieLocalHermite64's interval planning closure own the numerical method under the documented units and input premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature exposes the callback boundary; planAutoMovieLocalHermite64's interval planning closure own executable decomposition.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts This declaration supplies no algorithm, compensation or fallback; the actual behavior is implemented by planAutoMovieLocalHermite64's interval planning closure.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This signature chooses no traversal or allocation strategy; planAutoMovieLocalHermite64's interval planning closure own its evaluation cost.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration schedules no work; planAutoMovieLocalHermite64's interval planning closure decide whether calls share coefficients, identities or mutable state.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This signature acquires no storage or handles; planAutoMovieLocalHermite64's interval planning closure own references retained by the supplied callable.
     */
    plan: (interval: number) => IAutoMoviePlanLocalHermite64Plan;
  };
}
