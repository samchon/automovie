import type { IAutoMovieMotionHumanCarryHang } from "../handling/IAutoMovieMotionHumanCarryHang";
import type { IAutoMovieMotionHumanPickUp } from "../handling/IAutoMovieMotionHumanPickUp";
import type { IAutoMovieMotionHumanPutDown } from "../handling/IAutoMovieMotionHumanPutDown";
import type { IAutoMovieMotionHumanRegrasp } from "../handling/IAutoMovieMotionHumanRegrasp";

/**
 * Mechanism: Taking, holding and releasing an object by hand: the grasp, the carry pose and the regrasp. pickUp and putDown share one reach model (`HumanPrehension`).
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the Prehension family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The Prehension laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanPrehension<Chain> {
  /**
   * Reaching for a prop's grip, grasping it and lifting it clear.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanPrehension.pickUp: Reaching for a prop's grip, grasping it and lifting it clear.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanPrehension.pickUp is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanPrehension.pickUp is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanPrehension.pickUp is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanPrehension.pickUp is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanPrehension.pickUp is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanPrehension.pickUp is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   */
  pickUp(params: IAutoMovieMotionHumanPrehension.IPickUp, anchor?: string): Chain;

  /**
   * Setting a held prop down at a place and letting go.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanPrehension.putDown: Setting a held prop down at a place and letting go.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanPrehension.putDown is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanPrehension.putDown is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanPrehension.putDown is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanPrehension.putDown is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanPrehension.putDown is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanPrehension.putDown is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   */
  putDown(params: IAutoMovieMotionHumanPrehension.IPutDown, anchor?: string): Chain;

  /**
   * A held object moved within or with the hand that holds it, without being put down: turned about one of its own axes (a key in a lock, a cap), shifted to another of its grips (a pen turned into a writing grip, a phone from a carry grip to a texting grip), or rolled across the fingers (a coin).
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanPrehension.regrasp: A held object moved within or with the hand that holds it, without being put down: turned about one of its own axes (a key in a lock, a cap), shifted to another of its grips (a pen turned into a writing grip, a phone from a carry grip to a texting grip), or rolled across the fingers (a coin).
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanPrehension.regrasp is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanPrehension.regrasp is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanPrehension.regrasp is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanPrehension.regrasp is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanPrehension.regrasp is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanPrehension.regrasp is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   */
  regrasp(params: IAutoMovieMotionHumanPrehension.IRegrasp, anchor?: string): Chain;

  /**
   * Loads carried at the sides with the arms hanging, performed over a walk (`HumanChain.over`): a farmer's walk.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanPrehension.carryHang: Loads carried at the sides with the arms hanging, performed over a walk (`HumanChain.over`): a farmer's walk.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanPrehension.carryHang is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanPrehension.carryHang is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanPrehension.carryHang is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanPrehension.carryHang is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanPrehension.carryHang is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanPrehension.carryHang is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   */
  carryHang(params: IAutoMovieMotionHumanPrehension.ICarryHang, anchor?: string): Chain;
}

/**
 * The parameter types of the Prehension methods.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the parameter type of each Prehension method.
 * @evidence contracts/development/design.md#principled-representation Each parameter type is the law's existing type, named once here.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One parameter type per method.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Nothing is redefined: every name aliases the type its law already reads.
 */
export namespace IAutoMovieMotionHumanPrehension {
  /** The parameters of `pickUp`. */
  export type IPickUp = IAutoMovieMotionHumanPickUp.IParams;

  /** The parameters of `putDown`. */
  export type IPutDown = IAutoMovieMotionHumanPutDown.IParams;

  /** The parameters of `regrasp`. */
  export type IRegrasp = IAutoMovieMotionHumanRegrasp.IParams;

  /** The parameters of `carryHang`. */
  export type ICarryHang = IAutoMovieMotionHumanCarryHang.IParams;
}
