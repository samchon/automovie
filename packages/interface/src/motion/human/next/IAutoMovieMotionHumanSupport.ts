import type { IAutoMovieMotionHumanSupport as ILegacySupport } from "../actions/IAutoMovieMotionHumanSupport";

/**
 * Mechanism: A body support: a hand or foot taking the body's weight on a place.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the Support family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The Support laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanSupport<Chain> {
  /**
   * Moving the body's weight across a sequence of supports: each stance's contacts (`IAutoMovieMotionHumanSupport.IStance`) solved into one static key posture, and the body carried from key to key with every new contact placed and bearing before any contact the next stance lacks lets go.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanSupport.support: Moving the body's weight across a sequence of supports: each stance's contacts (`IAutoMovieMotionHumanSupport.IStance`) solved into one static key posture, and the body carried from key to key with every new contact placed and bearing before any contact the next stance lacks lets go.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanSupport.support is provided by the chain that implements IAutoMovieMotionHumanSupport.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanSupport.support is provided by the chain that implements IAutoMovieMotionHumanSupport.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanSupport.support is provided by the chain that implements IAutoMovieMotionHumanSupport.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanSupport.support is provided by the chain that implements IAutoMovieMotionHumanSupport.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanSupport.support is provided by the chain that implements IAutoMovieMotionHumanSupport.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanSupport.support is provided by the chain that implements IAutoMovieMotionHumanSupport.
   */
  support(params: IAutoMovieMotionHumanSupport.ISupport, anchor?: string): Chain;
}

/**
 * The parameter types of the Support methods.
 */
export namespace IAutoMovieMotionHumanSupport {
  /**
   * The parameters of `support`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the parameter type of `support`: the existing type of its law.
   */
  export type ISupport = ILegacySupport.IParams;
}
