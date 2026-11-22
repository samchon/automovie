import type { IAutoMovieMotionHumanLook } from "../everyday/IAutoMovieMotionHumanLook";

/**
 * Mechanism: Overlay: where the eyes and head look. It layers on any whole-body action.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the Gaze family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The Gaze laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanGaze<Chain> {
  /**
   * Standing and turning the eyes, head and trunk to a target, either at once or, when cued by something seen or heard, after a seeded reaction time: the orienting response of a bystander.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanGaze.look: Standing and turning the eyes, head and trunk to a target, either at once or, when cued by something seen or heard, after a seeded reaction time: the orienting response of a bystander.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGaze.look is provided by the chain that implements IAutoMovieMotionHumanGaze.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGaze.look is provided by the chain that implements IAutoMovieMotionHumanGaze.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGaze.look is provided by the chain that implements IAutoMovieMotionHumanGaze.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGaze.look is provided by the chain that implements IAutoMovieMotionHumanGaze.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGaze.look is provided by the chain that implements IAutoMovieMotionHumanGaze.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGaze.look is provided by the chain that implements IAutoMovieMotionHumanGaze.
   */
  look(params: IAutoMovieMotionHumanGaze.ILook, anchor?: string): Chain;
}

/**
 * The parameter types of the Gaze methods.
 */
export namespace IAutoMovieMotionHumanGaze {
  /**
   * The parameters of `look`: the law's own `IAutoMovieMotionHumanLook.IParams`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanLook` owns the type; the alias serves this family's `look` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `look` takes the type its law reads.
   */
  export type ILook = IAutoMovieMotionHumanLook.IParams;
}
