import type { IAutoMovieMotionHumanArmPhrase } from "../compose/IAutoMovieMotionHumanArmPhrase";
import type { IAutoMovieMotionHumanGesture as ILegacyGesture } from "../everyday/IAutoMovieMotionHumanGesture";

/**
 * Gestures of the hands and arms: emblems, beats and pointing, as arm phrases.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the Gesture family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The Gesture laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanGesture<Chain> {
  /**
   * A communicative gesture while standing: the hand, head or trunk moves through Kendon's phases (Kendon 1980; McNeill 1992, Hand and Mind): preparation from rest to the stroke's start, the stroke that carries the meaning, an optional post-stroke hold, and retraction to rest.
   *
   * @param params The `balance`, `kind`, `side`, `target`, `region`, `count`, `hold`, `depth`, `effort`, `turn`, `shape`, `aim` and `manner` of `ILegacyGesture.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGesture.gesture is provided by the chain that implements IAutoMovieMotionHumanGesture.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGesture.gesture is provided by the chain that implements IAutoMovieMotionHumanGesture.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGesture.gesture is provided by the chain that implements IAutoMovieMotionHumanGesture.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGesture.gesture is provided by the chain that implements IAutoMovieMotionHumanGesture.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGesture.gesture is provided by the chain that implements IAutoMovieMotionHumanGesture.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGesture.gesture is provided by the chain that implements IAutoMovieMotionHumanGesture.
   */
  gesture(
    params: IAutoMovieMotionHumanGesture.IGesture,
    anchor?: string,
  ): Chain;

  /**
   * Arm primitives: a hand surface carried to a target, kept on it and taken back.
   *
   * @param params The `phrase`, `target`, `offset`, `from`, `swing`, `cycles`, `mirror`, `side`, `surface`, `shape`, `facing`, `hold`, `manner`, `held` and `point` of `IAutoMovieMotionHumanArmPhrase.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGesture.armPhrase is provided by the chain that implements IAutoMovieMotionHumanGesture.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGesture.armPhrase is provided by the chain that implements IAutoMovieMotionHumanGesture.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGesture.armPhrase is provided by the chain that implements IAutoMovieMotionHumanGesture.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGesture.armPhrase is provided by the chain that implements IAutoMovieMotionHumanGesture.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGesture.armPhrase is provided by the chain that implements IAutoMovieMotionHumanGesture.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGesture.armPhrase is provided by the chain that implements IAutoMovieMotionHumanGesture.
   */
  armPhrase(
    params: IAutoMovieMotionHumanGesture.IArmPhrase,
    anchor?: string,
  ): Chain;
}

/**
 * The parameter types of the Gesture methods.
 */
export namespace IAutoMovieMotionHumanGesture {
  /**
   * The parameters of `gesture`: the everyday law's own `IAutoMovieMotionHumanGesture.IParams` (imported as `ILegacyGesture`), unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged, with its import name.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The everyday folder's `IAutoMovieMotionHumanGesture` owns the type; the alias serves this family's `gesture` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `gesture` takes the type its law reads.
   */
  export type IGesture = ILegacyGesture.IParams;

  /**
   * The parameters of `armPhrase`: the law's own `IAutoMovieMotionHumanArmPhrase.IParams`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanArmPhrase` owns the type; the alias serves this family's `armPhrase` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `armPhrase` takes the type its law reads.
   */
  export type IArmPhrase = IAutoMovieMotionHumanArmPhrase.IParams;
}
