import { AutoMovieBuiltPlacementBodyLocator } from "./AutoMovieBuiltPlacementBodyLocator";
import { IAutoMovieBuiltFloatingBody } from "./IAutoMovieBuiltFloatingBody";

/**
 * What one whole-building support sweep measured, not only what it found.
 *
 * The census is part of the answer. An empty finding list from a sweep that
 * resolved nothing reads exactly like a clean building, so the counts travel
 * beside the findings and a caller compares them.
 *
 * Every measured body lands in exactly one of {@link grounded}, {@link borne}
 * and {@link floating}, judged by the underside of its world box. The ground
 * height is the sweep's own `groundY` argument, `0` by default, not anything
 * read from the environment.
 *
 * @evidence contracts/common.md#principled-implementation One batch part table shares current-state staging across body resolution. Candidate tops sort descending and a binary-searched ceiling of underside plus tolerance skips higher parts; the first positive-area footprint hit is nearest within that ceiling. `compared` counts non-self candidates inspected after the search, not resolution, sort, search or elapsed cost. Finite ordered proxy bounds remain the numeric premise.
 * @evidence contracts/common.md#clear-and-simple-design Grounded count, borne count and floating-list length partition measured bodies, with unresolved locators beside them. Empty findings identify only this proxy classification's outcome; they do not prove structural support or absence of real mesh contact defects.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Ground height comes from the caller's argument rather than an assumed environment field, bodies sunk below ground count as grounded as documented, and unresolved bodies are reported rather than skipped.
 * @evidence contracts/common.md#meaningful-documentation States that the three counts partition `measured`, where the ground height comes from and its default, what `compared` excludes, the grounded and borne thresholds, and the order of the floating list.
 */
export interface IAutoMovieBuiltSupportSweepReport {
  /** Bodies whose extent resolved and were therefore judged. */
  measured: number;

  /**
   * Non-self candidate part inspections after pruning. Excludes batch staging/tessellation, body resolution, sorting and binary searches; it is one work counter, not the sweep's total cost. Current implementation stages once for its shared element part table, while population lookup and explicit-transform folds add their own costs.
   */
  compared: number;

  /**
   * Bodies whose underside is at or below the ground height plus the
   * tolerance, including bodies sunk below it.
   */
  grounded: number;

  /**
   * Bodies whose nearest part beneath, among other bodies' parts, has its top
   * within the tolerance of their underside.
   */
  borne: number;

  /**
   * Every body with clear air under it, in record order: elements first, then
   * populations.
   */
  floating: IAutoMovieBuiltFloatingBody[];

  /** Bodies whose extent the record does not resolve, so nothing was judged. */
  unresolved: AutoMovieBuiltPlacementBodyLocator[];
}
