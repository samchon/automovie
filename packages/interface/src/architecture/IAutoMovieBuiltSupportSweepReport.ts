import type { IAutoMovieBuiltFloatingBody } from "./IAutoMovieBuiltFloatingBody";
import type { IAutoMovieBuiltPlacementBodyLocator } from "./IAutoMovieBuiltPlacementBodyLocator";

/**
 * What one whole-building support sweep measured, not only what it found.
 *
 * The census is part of the answer. An empty finding list from a sweep that
 * resolved nothing reads exactly like a clean building, so the counts travel
 * beside the findings and a caller compares them.
 *
 * Every measured body lands in exactly one of {@link grounded}, {@link borne} and
 * {@link floating}, judged by the underside of its world box. The ground height
 * is the sweep's own `groundY` argument, `0` by default, not anything read from
 * the environment.
 */
export interface IAutoMovieBuiltSupportSweepReport {
  /** Bodies whose extent resolved and were therefore judged. */
  measured: number;

  /**
   * Non-self candidate part inspections after pruning. Excludes batch
   * staging/tessellation, body resolution, sorting and binary searches; it is
   * one work counter, not the sweep's total cost. Current implementation stages
   * once for its shared element part table, while population lookup and
   * explicit-transform folds add their own costs.
   */
  compared: number;

  /**
   * Bodies whose underside is at or below the ground height plus the tolerance,
   * including bodies sunk below it.
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
  unresolved: IAutoMovieBuiltPlacementBodyLocator[];
}
