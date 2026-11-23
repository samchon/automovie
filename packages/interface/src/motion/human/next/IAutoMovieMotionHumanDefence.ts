import type { IAutoMovieMotionHumanDefend } from "../striking/IAutoMovieMotionHumanDefend";
import type { IAutoMovieMotionHumanGuard } from "../striking/IAutoMovieMotionHumanGuard";

/**
 * Defending against a strike: blocking, parrying and the guard.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the Defence family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The Defence laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanDefence<Chain> {
  /**
   * A defence against one placed strike: a glove, forearm or shin brought to where the incoming weapon will be, or the head moved off its line.
   *
   * @param params The `kind`, `against` and `outcome` of `IAutoMovieMotionHumanDefend.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   */
  defend(params: IAutoMovieMotionHumanDefend.IParams, anchor?: string): Chain;

  /**
   * The fighting stance taken and held: from whatever the performer stands in, each foot steps to its stance place in turn (the rear foot first, so the lead foot stays a support), the root sinks until both knees soften and turns to the stance heading, and the gloves come up to the guard, then the stance holds with a light bounce through the knees.
   *
   * @param params The `seconds`, `stance`, `style` and `facing` of `IAutoMovieMotionHumanGuard.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   */
  guard(params: IAutoMovieMotionHumanGuard.IParams, anchor?: string): Chain;
}

/**
 * The parameter types of the Defence methods.
 */
export namespace IAutoMovieMotionHumanDefence {
  /**
   * A defence preset: the kind a named defence fixes, such as the slip or the high block. Spread into `defend`'s parameters with the strike it answers (`against`) and, where the scene decides it, the outcome.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the preset fixes, how it is applied and where its member's meaning is.
   * @evidence contracts/development/design.md#principled-representation One required member typed by the defend law's own named union, so a preset always fixes exactly the kind.
   * @evidence contracts/development/design.md#minimal-and-owned-surface This family owns the preset shape; `AutoMovieMotionHumanDefence.COVER`, `HAND_PARRY`, `ELBOW_BLOCK`, `HIGH_BLOCK`, `CHECK_KICK`, `SLIP`, `ROLL_UNDER` and `SWAY_BACK` are its data and the lexicon rows of the same names read them.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the member is named once here instead of an inline pick of the defence's parameters.
   */
  export interface IDefendPreset {
    /** The defence's kind, as `IAutoMovieMotionHumanDefend.IParams.kind`. */
    kind: IAutoMovieMotionHumanDefend.Kind;
  }

  /**
   * The parameters a defence row leaves to the composition: the defend law's parameters without the kind its preset fixes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the parameters a defence row takes and the one it fixes.
   * @evidence contracts/development/design.md#principled-representation The defend law's own parameters less exactly the member of `IDefendPreset`, so a row cannot be given what its preset fixes.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanDefend.IParams` owns the shape; the lexicon's defence map names the rows' parameters by this alias.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: one named projection instead of an inline `Omit` in every row.
   */
  export type IDefendRow = Omit<
    IAutoMovieMotionHumanDefend.IParams,
    keyof IDefendPreset
  >;
}
