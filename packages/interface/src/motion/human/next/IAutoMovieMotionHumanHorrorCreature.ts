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
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanHorrorCreature.shamble is provided by the chain that implements IAutoMovieMotionHumanHorrorCreature.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanHorrorCreature.shamble is provided by the chain that implements IAutoMovieMotionHumanHorrorCreature.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanHorrorCreature.shamble is provided by the chain that implements IAutoMovieMotionHumanHorrorCreature.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanHorrorCreature.shamble is provided by the chain that implements IAutoMovieMotionHumanHorrorCreature.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanHorrorCreature.shamble is provided by the chain that implements IAutoMovieMotionHumanHorrorCreature.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanHorrorCreature.shamble is provided by the chain that implements IAutoMovieMotionHumanHorrorCreature.
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
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanHorrorCreature.lurch is provided by the chain that implements IAutoMovieMotionHumanHorrorCreature.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanHorrorCreature.lurch is provided by the chain that implements IAutoMovieMotionHumanHorrorCreature.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanHorrorCreature.lurch is provided by the chain that implements IAutoMovieMotionHumanHorrorCreature.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanHorrorCreature.lurch is provided by the chain that implements IAutoMovieMotionHumanHorrorCreature.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanHorrorCreature.lurch is provided by the chain that implements IAutoMovieMotionHumanHorrorCreature.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanHorrorCreature.lurch is provided by the chain that implements IAutoMovieMotionHumanHorrorCreature.
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
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanHorrorCreature.stalk is provided by the chain that implements IAutoMovieMotionHumanHorrorCreature.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanHorrorCreature.stalk is provided by the chain that implements IAutoMovieMotionHumanHorrorCreature.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanHorrorCreature.stalk is provided by the chain that implements IAutoMovieMotionHumanHorrorCreature.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanHorrorCreature.stalk is provided by the chain that implements IAutoMovieMotionHumanHorrorCreature.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanHorrorCreature.stalk is provided by the chain that implements IAutoMovieMotionHumanHorrorCreature.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanHorrorCreature.stalk is provided by the chain that implements IAutoMovieMotionHumanHorrorCreature.
   */
  stalk(params: IAutoMovieMotionHumanGait.IParams, anchor?: string): Chain;
}
