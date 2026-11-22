import type { IAutoMovieMotionHumanPolo as ILegacyPolo } from "../lexicon/IAutoMovieMotionHumanPolo";

/**
 * Mechanism: Behaviour: a polo stroke from the saddle. The ball leaves the mallet at 20 m/s unless `speed` says otherwise, and the trunk leans out over the side by at most 45 degrees by default.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the Polo family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The Polo laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanPolo<Chain> {
  /**
   * The ball's speed off the mallet, metres per second; 20 when absent.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanPolo.polo: The ball's speed off the mallet, metres per second; 20 when absent.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanPolo.polo is provided by the chain that implements IAutoMovieMotionHumanPolo.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanPolo.polo is provided by the chain that implements IAutoMovieMotionHumanPolo.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanPolo.polo is provided by the chain that implements IAutoMovieMotionHumanPolo.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanPolo.polo is provided by the chain that implements IAutoMovieMotionHumanPolo.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanPolo.polo is provided by the chain that implements IAutoMovieMotionHumanPolo.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanPolo.polo is provided by the chain that implements IAutoMovieMotionHumanPolo.
   */
  polo(params: IAutoMovieMotionHumanPolo.IPolo, anchor?: string): Chain;
}

/**
 * The parameter types of the Polo methods.
 */
export namespace IAutoMovieMotionHumanPolo {
  /**
   * The parameters of `polo`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the parameter type of `polo`: the existing type of its law.
   */
  export type IPolo = ILegacyPolo;
}
