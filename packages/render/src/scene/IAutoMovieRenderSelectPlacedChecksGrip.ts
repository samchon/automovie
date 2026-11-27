import type { IAutoMovieRenderSelectPlacedChecksRule } from "./IAutoMovieRenderSelectPlacedChecksRule";
import type { IAutoMovieRenderSelectPlacedChecksGripWindow } from "./IAutoMovieRenderSelectPlacedChecksGripWindow";

/** A grip held through consecutive windows. */
export interface IAutoMovieRenderSelectPlacedChecksGrip extends IAutoMovieRenderSelectPlacedChecksRule {
  /** Maximum position separation in the hand's frame, metres. */
  readonly maxDistance: number;
  /** Maximum orientation separation, radians in [0, π]. */
  readonly maxAngle: number;
  /**
   * Non-overlapping windows. The earliest listed window containing the
   * instant applies.
  */
  readonly windows: readonly IAutoMovieRenderSelectPlacedChecksGripWindow[];
}
