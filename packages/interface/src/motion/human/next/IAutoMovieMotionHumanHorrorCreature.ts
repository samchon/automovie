import type { IAutoMovieMotionHumanGait } from "./IAutoMovieMotionHumanGait";

/**
 * The gaits of a horror creature, stage readings of a walk with its own Froude number, step and unevenness (provisional; no study was read).
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the HorrorCreature family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The HorrorCreature laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanHorrorCreature<Chain> {
  /**
   * Shamble to `to`: a stiff leg dragged with its foot barely clearing the floor and stood on briefly, the trunk leaning and the arms hanging still (`HumanHorrorGait.SHAMBLE`, provisional); a crowd of shamblers falls out of step by its seeded tempo. It stops at `to` as a walk does.
   *
   * @param params The walk's parameters but the pace, stride and arm swing, which the gait fixes, and the stiff side.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the gait does with its provisional constant, where it ends, its parameters, its anchor and its return.
   */
  shamble(params: IAutoMovieMotionHumanGait.ILimp, anchor?: string): Chain;

  /**
   * Lurch to `to`: one knee held stiff at a slow cadence and that leg swung out, the trunk upright and the arms still (`HumanHorrorGait.LURCH`, provisional). It stops at `to` as a walk does.
   *
   * @param params The walk's parameters but the pace, stride and arm swing, which the gait fixes, and the stiff side.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the gait does with its provisional constant, where it ends, its parameters, its anchor and its return.
   */
  lurch(params: IAutoMovieMotionHumanGait.ILimp, anchor?: string): Chain;

  /**
   * Stalk to `to`: a creep on deeply bent knees with the trunk hunched (`HumanHorrorGait.STALK`, provisional). It stops at `to` as a walk does.
   *
   * @param params The walk's parameters but the pace, stride and arm swing, which the gait fixes.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the gait does with its provisional constant, where it ends, its parameters, its anchor and its return.
   */
  stalk(params: IAutoMovieMotionHumanGait.IParams, anchor?: string): Chain;
}
