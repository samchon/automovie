import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * Contracts used by HumanReaction.report.
 *
 * @evidence contracts/development/common.md#meaningful-documentation point: World-space location where the shot is fired, metres; sound travels from this source to the listener. seconds: Shot instant in performance seconds.
 * @evidence contracts/development/design.md#principled-representation point: World-space location where the shot is fired, metres; sound travels from this source to the listener. seconds: Shot instant in performance seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: reaction/HumanReaction.ts (HumanReaction.report, shot).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanReaction {
  /**
   * The film second a shot's report reaches a listener. Input shot of HumanReaction.report. Where and when the shot is fired, world metres and film seconds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation point: World-space location where the shot is fired, metres; sound travels from this source to the listener. seconds: Shot instant in performance seconds.
   * @evidence contracts/development/design.md#principled-representation point: World-space location where the shot is fired, metres; sound travels from this source to the listener. seconds: Shot instant in performance seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: reaction/HumanReaction.ts (HumanReaction.report, shot).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type IReportShot = {
    /** World-space location where the shot is fired, metres; sound travels from this source to the listener. */
    point: IAutoMovieVector3;
    /** Shot instant in performance seconds. */
    seconds: number;
  };
}
