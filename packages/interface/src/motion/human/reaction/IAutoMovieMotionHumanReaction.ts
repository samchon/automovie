import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * Contracts used by HumanReaction.report, and the home of the reaction
 * family: the actions that answer a blow, by the size of the answer.
 *
 * - `flinch` ({@link IAutoMovieMotionHumanFlinch}): a startle, the trunk
 *   leans and the head ducks in place; peak at 0.2 s, back by 0.6 s.
 * - `give` ({@link IAutoMovieMotionHumanGive}): the head turned or the
 *   trunk carried by a slap or a light push, the feet kept; peak at 0.12 s,
 *   back by 0.72 s.
 * - `stagger` ({@link IAutoMovieMotionHumanStagger}): a push that moves the
 *   centre of mass, caught by up to four recovery steps; a push they do not
 *   catch is refused as a fall.
 * - `knockdown` and `collapse` ({@link IAutoMovieMotionHumanKnockdown},
 *   {@link IAutoMovieMotionHumanCollapse}): a fall to the floor.
 * - `thrown` ({@link IAutoMovieMotionHumanThrown}): a body flung clear of
 *   the floor.
 * - `perturb` ({@link IAutoMovieMotionHumanPerturb}): the outcome (absorb,
 *   step, fall) follows from the impulse.
 *
 * Choose the action by how far the body moves: nothing under the feet
 * (`flinch`, `give`), the feet (`stagger`), the whole body to the floor
 * (`knockdown`, `collapse`), off the floor (`thrown`). `intensity` of
 * `flinch` and `give` scales the size of the answer and never its time; the
 * time of the others follows their dynamics. After a fall the body lies
 * `seconds` long, 1 s by default on every one of them. Every size and time
 * of `flinch` and `give` is provisional except the startle's 0.2 s peak
 * (Landis and Hunt 1939).
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
