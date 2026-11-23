import type { IAutoMovieMotionHumanGait } from "./IAutoMovieMotionHumanGait";

/**
 * The gaits of a horror creature, stage readings of a walk with its own Froude number, step and unevenness (provisional; no study was read).
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 */
export interface IAutoMovieMotionHumanHorrorCreature<Chain> {
  /**
   * Shamble to `to`: a stiff leg dragged with its foot barely clearing the floor and stood on briefly, the trunk leaning and the arms hanging still (`HumanHorrorGait.SHAMBLE`, provisional); a crowd of shamblers falls out of step by its seeded tempo. It stops at `to` as a walk does.
   *
   * @param params The walk's parameters but the pace, stride and arm swing, which the gait fixes, and the stiff side.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  shamble(params: IAutoMovieMotionHumanGait.ILimp, anchor?: string): Chain;

  /**
   * Lurch to `to`: one knee held stiff at a slow cadence and that leg swung out, the trunk upright and the arms still (`HumanHorrorGait.LURCH`, provisional). It stops at `to` as a walk does.
   *
   * @param params The walk's parameters but the pace, stride and arm swing, which the gait fixes, and the stiff side.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  lurch(params: IAutoMovieMotionHumanGait.ILimp, anchor?: string): Chain;

  /**
   * Stalk to `to`: a creep on deeply bent knees with the trunk hunched (`HumanHorrorGait.STALK`, provisional). It stops at `to` as a walk does.
   *
   * @param params The walk's parameters but the pace, stride and arm swing, which the gait fixes.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  stalk(params: IAutoMovieMotionHumanGait.IParams, anchor?: string): Chain;
}
