import type { IAutoMovieMotionHumanDefend } from "../striking/IAutoMovieMotionHumanDefend";
import type { IAutoMovieMotionHumanGuard } from "../striking/IAutoMovieMotionHumanGuard";

/**
 * Mechanism: Defending against a strike: blocking, parrying and the guard.
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
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanDefence.defend: A defence against one placed strike: a glove, forearm or shin brought to where the incoming weapon will be, or the head moved off its line.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanDefence.defend is provided by the chain that implements IAutoMovieMotionHumanDefence.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanDefence.defend is provided by the chain that implements IAutoMovieMotionHumanDefence.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanDefence.defend is provided by the chain that implements IAutoMovieMotionHumanDefence.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanDefence.defend is provided by the chain that implements IAutoMovieMotionHumanDefence.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanDefence.defend is provided by the chain that implements IAutoMovieMotionHumanDefence.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanDefence.defend is provided by the chain that implements IAutoMovieMotionHumanDefence.
   */
  defend(params: IAutoMovieMotionHumanDefence.IDefend, anchor?: string): Chain;

  /**
   * The fighting stance taken and held: from whatever the performer stands in, each foot steps to its stance place in turn (the rear foot first, so the lead foot stays a support), the root sinks until both knees soften and turns to the stance heading, and the gloves come up to the guard, then the stance holds with a light bounce through the knees.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanDefence.guard: The fighting stance taken and held: from whatever the performer stands in, each foot steps to its stance place in turn (the rear foot first, so the lead foot stays a support), the root sinks until both knees soften and turns to the stance heading, and the gloves come up to the guard, then the stance holds with a light bounce through the knees.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanDefence.guard is provided by the chain that implements IAutoMovieMotionHumanDefence.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanDefence.guard is provided by the chain that implements IAutoMovieMotionHumanDefence.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanDefence.guard is provided by the chain that implements IAutoMovieMotionHumanDefence.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanDefence.guard is provided by the chain that implements IAutoMovieMotionHumanDefence.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanDefence.guard is provided by the chain that implements IAutoMovieMotionHumanDefence.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanDefence.guard is provided by the chain that implements IAutoMovieMotionHumanDefence.
   */
  guard(params: IAutoMovieMotionHumanDefence.IGuard, anchor?: string): Chain;
}

/**
 * The parameter types of the Defence methods.
 */
export namespace IAutoMovieMotionHumanDefence {
  /**
   * The parameters of `defend`: the law's own `IAutoMovieMotionHumanDefend.IParams`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanDefend` owns the type; the alias serves this family's `defend` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `defend` takes the type its law reads.
   */
  export type IDefend = IAutoMovieMotionHumanDefend.IParams;

  /**
   * The parameters of `guard`: the law's own `IAutoMovieMotionHumanGuard.IParams`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanGuard` owns the type; the alias serves this family's `guard` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `guard` takes the type its law reads.
   */
  export type IGuard = IAutoMovieMotionHumanGuard.IParams;
}
