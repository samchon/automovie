import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionHumanFlinch } from "../reaction/IAutoMovieMotionHumanFlinch";
import type { IAutoMovieMotionHumanGive } from "../reaction/IAutoMovieMotionHumanGive";

/**
 * The small involuntary reactions that share one size-and-time model: an intensity share of a small displacement that peaks within a fraction of a second and returns. The flinch peaks at 0.2 s and is back by 0.6 s; the give peaks at 0.12 s, holds 0.15 s and is back 0.45 s later; intensity scales the size and not the time.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the Reaction family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanReaction<Chain> {
  /**
   * A flinch: the protective startle away from a sudden threat or a blow, the head and trunk pulled away from it, the shoulders raised and the hands brought up before the face, then a return to what the body held.
   *
   * @param params The `from`, `intensity` and `manner` of `IAutoMovieMotionHumanFlinch.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   */
  flinch(params: IAutoMovieMotionHumanFlinch.IParams, anchor?: string): Chain;

  /**
   * Giving way to a contact: the head turned aside by a slap, or the trunk carried by a hand that pushes or pulls, then a return to what the body held.
   *
   * @param params The `from`, `part`, `way` and `intensity` of `IAutoMovieMotionHumanGive.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   */
  give(params: IAutoMovieMotionHumanGive.IParams, anchor?: string): Chain;
}

/**
 * Contracts used by `AutoMovieMotionHumanReaction.report`, and the home of the
 * reactions that leave the feet where they are, by the size of the answer.
 *
 * - `flinch` ({@link IAutoMovieMotionHumanFlinch}): a startle, the trunk
 *   leans and the head ducks in place; peak at 0.2 s, back by 0.6 s.
 * - `give` ({@link IAutoMovieMotionHumanGive}): the head turned or the
 *   trunk carried by a slap or a light push, the feet kept; peak at 0.12 s,
 *   back by 0.72 s.
 *
 * A reaction that moves the feet or the whole body (a stagger, a knockdown,
 * a collapse, a body thrown, a perturbation) is a fall, and
 * `IAutoMovieMotionHumanFall` owns it. `intensity` of `flinch` and `give`
 * scales the size of the answer and never its time. Every size and time of
 * `flinch` and `give` is provisional except the startle's 0.2 s peak
 * (Landis and Hunt 1939).
 *
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: reaction/HumanReaction.ts (HumanReaction.report, shot).
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
  export interface IReportShot {
    /** World-space location where the shot is fired, metres; sound travels from this source to the listener. */
    point: IAutoMovieVector3;
    /** Shot instant in performance seconds. */
    seconds: number;
  }
}
