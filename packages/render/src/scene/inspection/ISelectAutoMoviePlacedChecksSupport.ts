import type { ISelectAutoMoviePlacedChecksRule } from "./ISelectAutoMoviePlacedChecksRule.js";
import type { ISelectAutoMoviePlacedChecksSupportPhase } from "./ISelectAutoMoviePlacedChecksSupportPhase.js";

/** A support held through consecutive phases. */
export interface ISelectAutoMoviePlacedChecksSupport extends ISelectAutoMoviePlacedChecksRule {
  /** Maximum absolute gap along the support normal, metres. */
  readonly maxGap: number;
  /** Maximum distance from the anchor along the support plane, metres. */
  readonly maxSlip: number;
  /**
   * Non-overlapping phases. The earliest listed phase containing the instant
   * applies.
  */
  readonly phases: readonly ISelectAutoMoviePlacedChecksSupportPhase[];
}
