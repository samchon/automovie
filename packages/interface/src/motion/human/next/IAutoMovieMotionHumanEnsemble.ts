import type { IAutoMovieMotionHumanInstance } from "../ensemble/IAutoMovieMotionHumanInstance";

/**
 * Mechanism: Groups of people: a formation, a crowd and a manoeuvre.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the Ensemble family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The Ensemble laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanEnsemble<Chain> {
  /**
   * An instanced member: a performer that displays a template member's placed posture, read whole film frames earlier and moved rigidly by the offset it stands at from the template, so a rear rank marching with its front rank costs no plans and no fits of its own.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanEnsemble.instance: An instanced member: a performer that displays a template member's placed posture, read whole film frames earlier and moved rigidly by the offset it stands at from the template, so a rear rank marching with its front rank costs no plans and no fits of its own.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanEnsemble.instance is provided by the chain that implements IAutoMovieMotionHumanEnsemble.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanEnsemble.instance is provided by the chain that implements IAutoMovieMotionHumanEnsemble.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanEnsemble.instance is provided by the chain that implements IAutoMovieMotionHumanEnsemble.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanEnsemble.instance is provided by the chain that implements IAutoMovieMotionHumanEnsemble.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanEnsemble.instance is provided by the chain that implements IAutoMovieMotionHumanEnsemble.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanEnsemble.instance is provided by the chain that implements IAutoMovieMotionHumanEnsemble.
   */
  instance(params: IAutoMovieMotionHumanEnsemble.IInstance, anchor?: string): Chain;
}

/**
 * The parameter types of the Ensemble methods.
 */
export namespace IAutoMovieMotionHumanEnsemble {
  /**
   * The parameters of `instance`: the law's own `IAutoMovieMotionHumanInstance.IParams`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanInstance` owns the type; the alias serves this family's `instance` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `instance` takes the type its law reads.
   */
  export type IInstance = IAutoMovieMotionHumanInstance.IParams;
}
