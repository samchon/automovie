import type { IAutoMovieMotionHumanSittingVolley as ILegacySittingVolley } from "../lexicon/IAutoMovieMotionHumanSittingVolley";

/**
 * Sitting volleyball, a rally played from the floor.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the SittingVolley family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The SittingVolley laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanSittingVolley<Chain> {
  /**
   * One seated floor shift and forearm receive for sitting volleyball, entered from an established floor seat with the athlete facing the incoming play.
   *
   * @param params The `seconds`, `lateral`, `hand` and `target` of `ILegacySittingVolley`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanSittingVolley.sittingVolley is provided by the chain that implements IAutoMovieMotionHumanSittingVolley.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanSittingVolley.sittingVolley is provided by the chain that implements IAutoMovieMotionHumanSittingVolley.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanSittingVolley.sittingVolley is provided by the chain that implements IAutoMovieMotionHumanSittingVolley.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanSittingVolley.sittingVolley is provided by the chain that implements IAutoMovieMotionHumanSittingVolley.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanSittingVolley.sittingVolley is provided by the chain that implements IAutoMovieMotionHumanSittingVolley.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanSittingVolley.sittingVolley is provided by the chain that implements IAutoMovieMotionHumanSittingVolley.
   */
  sittingVolley(
    params: IAutoMovieMotionHumanSittingVolley.ISittingVolley,
    anchor?: string,
  ): Chain;
}

/**
 * The parameter types of the SittingVolley methods.
 */
export namespace IAutoMovieMotionHumanSittingVolley {
  /**
   * The parameters of `sittingVolley`: `IAutoMovieMotionHumanSittingVolley` (`lexicon/IAutoMovieMotionHumanSittingVolley`), the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanSittingVolley` (`lexicon/IAutoMovieMotionHumanSittingVolley`): the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanSittingVolley` (`lexicon/IAutoMovieMotionHumanSittingVolley`) owns the shape; the alias serves `sittingVolley` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type ISittingVolley = ILegacySittingVolley;
}
