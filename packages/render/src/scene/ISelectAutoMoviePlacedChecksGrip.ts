import type { ISelectAutoMoviePlacedChecksRule } from "./ISelectAutoMoviePlacedChecksRule.js";
import type { ISelectAutoMoviePlacedChecksGripWindow } from "./ISelectAutoMoviePlacedChecksGripWindow.js";

/** A grip held through consecutive windows. */
export interface ISelectAutoMoviePlacedChecksGrip extends ISelectAutoMoviePlacedChecksRule {
  /** Maximum position separation in the hand's frame, metres. */
  readonly maxDistance: number;
  /** Maximum orientation separation, radians in [0, π]. */
  readonly maxAngle: number;
  /**
   * Non-overlapping windows. The earliest listed window containing the
   * instant applies.
  */
  readonly windows: readonly ISelectAutoMoviePlacedChecksGripWindow[];
}
