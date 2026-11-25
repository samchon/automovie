import type { IAutoMovieMotionHumanDefend } from "../striking/IAutoMovieMotionHumanDefend";
import type { IAutoMovieMotionHumanGuard } from "../striking/IAutoMovieMotionHumanGuard";

/**
 * Defending against a strike: blocking, parrying and the guard.
 *
 * @template Chain The chain every method returns; the chain implements this
 *   interface.
 */
export interface IAutoMovieMotionHumanDefence<Chain> {
  /**
   * A defence against one placed strike: a glove, forearm or shin brought to
   * where the incoming weapon will be, or the head moved off its line.
   *
   * @param params The `kind`, `against` and `outcome` of
   *   `IAutoMovieMotionHumanDefend.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  defend(params: IAutoMovieMotionHumanDefend.IParams, anchor?: string): Chain;

  /**
   * The fighting stance taken and held: from whatever the performer stands in,
   * each foot steps to its stance place in turn (the rear foot first, so the
   * lead foot stays a support), the root sinks until both knees soften and
   * turns to the stance heading, and the gloves come up to the guard, then the
   * stance holds with a light bounce through the knees.
   *
   * @param params The `duration`, `stance`, `style` and `facing` of
   *   `IAutoMovieMotionHumanGuard.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  guard(params: IAutoMovieMotionHumanGuard.IParams, anchor?: string): Chain;
}

/** The parameter types of the Defence methods. */
export namespace IAutoMovieMotionHumanDefence {
  /**
   * A defence preset: the kind a named defence fixes, such as the slip or the
   * high block. Spread into `defend`'s parameters with the strike it answers
   * (`against`) and, where the scene decides it, the outcome.
   */
  export interface IDefendPreset {
    /** The defence's kind, as `IAutoMovieMotionHumanDefend.IParams.kind`. */
    kind: IAutoMovieMotionHumanDefend.Kind;
  }

  /**
   * The parameters a defence row leaves to the composition: the defend law's
   * parameters without the kind its preset fixes.
   */
  export type IDefendRow = Omit<
    IAutoMovieMotionHumanDefend.IParams,
    keyof IDefendPreset
  >;
}
