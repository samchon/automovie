import type { IAutoMovieRenderSelectPlacedChecksRule } from "./IAutoMovieRenderSelectPlacedChecksRule";
import type { IAutoMovieRenderSelectPlacedChecksSupportPhase } from "./IAutoMovieRenderSelectPlacedChecksSupportPhase";

/** A support held through consecutive phases. */
export interface IAutoMovieRenderSelectPlacedChecksSupport extends IAutoMovieRenderSelectPlacedChecksRule {
  /** Maximum absolute gap along the support normal, metres. */
  readonly maxGap: number;
  /** Maximum distance from the anchor along the support plane, metres. */
  readonly maxSlip: number;
  /**
   * Non-overlapping phases. The earliest listed phase containing the instant
   * applies.
  */
  readonly phases: readonly IAutoMovieRenderSelectPlacedChecksSupportPhase[];
}
