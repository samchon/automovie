import type { IAutoMovieMotionHumanHandToFace } from "../daily/IAutoMovieMotionHumanHandToFace";
import type { IAutoMovieMotionHumanSelfAction } from "../touch/IAutoMovieMotionHumanSelfAction";

/**
 * Mechanism: The hand's own-body actions: touching the face, and self-directed touch such as scratching or smoothing.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the HandToBody family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The HandToBody laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanHandToBody<Chain> {
  /**
   * A hand-to-face task of daily living while standing: drinking, sipping, eating with a spoon, biting held food, a phone at the ear, reading a held sheet, brushing the teeth, combing the hair, washing the face and wiping the mouth (M14, #3234).
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanHandToBody.handToFace: A hand-to-face task of daily living while standing: drinking, sipping, eating with a spoon, biting held food, a phone at the ear, reading a held sheet, brushing the teeth, combing the hair, washing the face and wiping the mouth (M14, #3234).
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanHandToBody.handToFace is provided by the chain that implements IAutoMovieMotionHumanHandToBody.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanHandToBody.handToFace is provided by the chain that implements IAutoMovieMotionHumanHandToBody.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanHandToBody.handToFace is provided by the chain that implements IAutoMovieMotionHumanHandToBody.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanHandToBody.handToFace is provided by the chain that implements IAutoMovieMotionHumanHandToBody.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanHandToBody.handToFace is provided by the chain that implements IAutoMovieMotionHumanHandToBody.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanHandToBody.handToFace is provided by the chain that implements IAutoMovieMotionHumanHandToBody.
   */
  handToFace(params: IAutoMovieMotionHumanHandToBody.IHandToFace, anchor?: string): Chain;

  /**
   * A whole-body self action while standing (#3285): the yawn-and-stretch with both arms overhead, both arms raised in victory, a fist pump, a neck roll and a shoulder roll.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanHandToBody.selfAction: A whole-body self action while standing (#3285): the yawn-and-stretch with both arms overhead, both arms raised in victory, a fist pump, a neck roll and a shoulder roll.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanHandToBody.selfAction is provided by the chain that implements IAutoMovieMotionHumanHandToBody.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanHandToBody.selfAction is provided by the chain that implements IAutoMovieMotionHumanHandToBody.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanHandToBody.selfAction is provided by the chain that implements IAutoMovieMotionHumanHandToBody.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanHandToBody.selfAction is provided by the chain that implements IAutoMovieMotionHumanHandToBody.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanHandToBody.selfAction is provided by the chain that implements IAutoMovieMotionHumanHandToBody.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanHandToBody.selfAction is provided by the chain that implements IAutoMovieMotionHumanHandToBody.
   */
  selfAction(params: IAutoMovieMotionHumanHandToBody.ISelfAction, anchor?: string): Chain;
}

/**
 * The parameter types of the HandToBody methods.
 */
export namespace IAutoMovieMotionHumanHandToBody {
  /**
   * The parameters of `handToFace`: the law's own `IAutoMovieMotionHumanHandToFace.IParams`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanHandToFace` owns the type; the alias serves this family's `handToFace` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `handToFace` takes the type its law reads.
   */
  export type IHandToFace = IAutoMovieMotionHumanHandToFace.IParams;

  /**
   * The parameters of `selfAction`: the law's own `IAutoMovieMotionHumanSelfAction.IParams`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanSelfAction` owns the type; the alias serves this family's `selfAction` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `selfAction` takes the type its law reads.
   */
  export type ISelfAction = IAutoMovieMotionHumanSelfAction.IParams;
}
