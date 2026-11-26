import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * The small involuntary reactions that share one size-and-time model: an
 * intensity share of a small displacement that peaks within a fraction of a
 * second and returns. The flinch peaks at 0.2 s and is back by 0.6 s; the give
 * peaks at 0.12 s, holds 0.15 s and is back 0.45 s later; intensity scales the
 * size and not the time.
 *
 * A method here is a method of `HumanChain` when its name is in
 * `AutoMovieMotionHumanActionName`. Any other member is a registered law or
 * row: pass it in `laws: [...]` to the performance, taking it from
 * `AutoMovieMotionHumanReaction` or from the row namespace of the family, and
 * append it with `chain.registered("<name>", params)`. A member that is a
 * function, a reader or a layer says so in its own comment.
 *
 * @template Chain The chain every method returns; the chain implements this
 *   interface.
 */


/**
 * Contracts used by `AutoMovieMotionHumanReaction.report`, and the home of the
 * reactions that leave the feet where they are, by the size of the answer.
 *
 * - `flinch` ({@link IAutoMovieMotionHumanFlinch}): a startle, the trunk leans and
 *   the head ducks in place; peak at 0.2 s, back by 0.6 s.
 * - `give` ({@link IAutoMovieMotionHumanGive}): the head turned or the trunk
 *   carried by a slap or a light push, the feet kept; peak at 0.12 s, back by
 *   0.72 s.
 *
 * A reaction that moves the feet or the whole body (a stagger, a knockdown, a
 * collapse, a body thrown, a perturbation) is a fall, and
 * `IAutoMovieMotionHumanFall` owns it. `intensity` of `flinch` and `give`
 * scales the size of the answer and never its time. Every size and time of
 * `flinch` and `give` is provisional except the startle's 0.2 s peak (Landis
 * and Hunt 1939).
 */
export namespace IAutoMovieMotionHumanReaction {
  /**
   * The film second a shot's report reaches a listener. Input shot of
   * HumanReaction.report. Where and when the shot is fired, world metres and
   * film seconds.
   */
  export interface IReportShot {
    /**
     * World-space location where the shot is fired, metres; sound travels from
     * this source to the listener.
     */
    point: IAutoMovieVector3;
    /** Shot instant in performance seconds. */
    seconds: number;
  }
}
