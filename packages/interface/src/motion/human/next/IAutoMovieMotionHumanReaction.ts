import type { IAutoMovieMotionHumanFlinch } from "../reaction/IAutoMovieMotionHumanFlinch";
import type { IAutoMovieMotionHumanGive } from "../reaction/IAutoMovieMotionHumanGive";

/**
 * The small involuntary reactions that share one size-and-time model: an intensity share of a small displacement that peaks within a fraction of a second and returns. The flinch peaks at 0.2 s and is back by 0.6 s; the give peaks at 0.12 s, holds 0.15 s and is back 0.45 s later; intensity scales the size and not the time.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the Reaction family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The Reaction laws and nothing the other families own.
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
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanReaction.flinch is provided by the chain that implements IAutoMovieMotionHumanReaction.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanReaction.flinch is provided by the chain that implements IAutoMovieMotionHumanReaction.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanReaction.flinch is provided by the chain that implements IAutoMovieMotionHumanReaction.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanReaction.flinch is provided by the chain that implements IAutoMovieMotionHumanReaction.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanReaction.flinch is provided by the chain that implements IAutoMovieMotionHumanReaction.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanReaction.flinch is provided by the chain that implements IAutoMovieMotionHumanReaction.
   */
  flinch(params: IAutoMovieMotionHumanReaction.IFlinch, anchor?: string): Chain;

  /**
   * Giving way to a contact: the head turned aside by a slap, or the trunk carried by a hand that pushes or pulls, then a return to what the body held.
   *
   * @param params The `from`, `part`, `way` and `intensity` of `IAutoMovieMotionHumanGive.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanReaction.give is provided by the chain that implements IAutoMovieMotionHumanReaction.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanReaction.give is provided by the chain that implements IAutoMovieMotionHumanReaction.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanReaction.give is provided by the chain that implements IAutoMovieMotionHumanReaction.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanReaction.give is provided by the chain that implements IAutoMovieMotionHumanReaction.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanReaction.give is provided by the chain that implements IAutoMovieMotionHumanReaction.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanReaction.give is provided by the chain that implements IAutoMovieMotionHumanReaction.
   */
  give(params: IAutoMovieMotionHumanReaction.IGive, anchor?: string): Chain;
}

/**
 * The parameter types of the Reaction methods.
 */
export namespace IAutoMovieMotionHumanReaction {
  /**
   * The parameters of `flinch`: `IAutoMovieMotionHumanFlinch.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanFlinch.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanFlinch.IParams` owns the shape; the alias serves `flinch` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IFlinch = IAutoMovieMotionHumanFlinch.IParams;

  /**
   * The parameters of `give`: `IAutoMovieMotionHumanGive.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanGive.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanGive.IParams` owns the shape; the alias serves `give` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IGive = IAutoMovieMotionHumanGive.IParams;
}
