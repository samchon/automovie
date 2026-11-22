import type { IAutoMovieMotionHumanCarryHang } from "../handling/IAutoMovieMotionHumanCarryHang";
import type { IAutoMovieMotionHumanPickUp } from "../handling/IAutoMovieMotionHumanPickUp";
import type { IAutoMovieMotionHumanPutDown } from "../handling/IAutoMovieMotionHumanPutDown";
import type { IAutoMovieMotionHumanRegrasp } from "../handling/IAutoMovieMotionHumanRegrasp";

/**
 * Taking, holding and releasing an object by hand: the grasp, the carry pose and the regrasp. pickUp and putDown share one reach model (`HumanPrehension`).
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
   * @param params The `prop`, `handle`, `hand`, `lift` and `use` of `IAutoMovieMotionHumanPickUp.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanPrehension.pickUp is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanPrehension.pickUp is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanPrehension.pickUp is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanPrehension.pickUp is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanPrehension.pickUp is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanPrehension.pickUp is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   */
  pickUp(
    params: IAutoMovieMotionHumanPrehension.IPickUp,
    anchor?: string,
  ): Chain;

  /**
   * Setting a held prop down at a place and letting go.
   *
   * @param params The `prop`, `at`, `on`, `onto`, `yaw`, `rotation` and `hand` of `IAutoMovieMotionHumanPutDown.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanPrehension.putDown is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanPrehension.putDown is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanPrehension.putDown is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanPrehension.putDown is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanPrehension.putDown is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanPrehension.putDown is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   */
  putDown(
    params: IAutoMovieMotionHumanPrehension.IPutDown,
    anchor?: string,
  ): Chain;

  /**
   * A held object moved within or with the hand that holds it, without being put down: turned about one of its own axes (a key in a lock, a cap), shifted to another of its grips (a pen turned into a writing grip, a phone from a carry grip to a texting grip), or rolled across the fingers (a coin).
   *
   * @param params The `kind`, `prop`, `side`, `axis`, `angle` and `to` of `IAutoMovieMotionHumanRegrasp.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanPrehension.regrasp is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanPrehension.regrasp is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanPrehension.regrasp is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanPrehension.regrasp is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanPrehension.regrasp is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanPrehension.regrasp is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   */
  regrasp(
    params: IAutoMovieMotionHumanPrehension.IRegrasp,
    anchor?: string,
  ): Chain;

  /**
   * Loads carried at the sides with the arms hanging, performed over a walk (`HumanChain.over`): a farmer's walk.
   *
   * @param params The `left`, `right` and `seconds` of `IAutoMovieMotionHumanCarryHang.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanPrehension.carryHang is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanPrehension.carryHang is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanPrehension.carryHang is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanPrehension.carryHang is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanPrehension.carryHang is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanPrehension.carryHang is provided by the chain that implements IAutoMovieMotionHumanPrehension.
   */
  carryHang(
    params: IAutoMovieMotionHumanPrehension.ICarryHang,
    anchor?: string,
  ): Chain;
}

/**
 * The parameter types of the Prehension methods.
 */
export namespace IAutoMovieMotionHumanPrehension {
  /**
   * The parameters of `pickUp`: `IAutoMovieMotionHumanPickUp.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanPickUp.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanPickUp.IParams` owns the shape; the alias serves `pickUp` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IPickUp = IAutoMovieMotionHumanPickUp.IParams;

  /**
   * The parameters of `putDown`: `IAutoMovieMotionHumanPutDown.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanPutDown.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanPutDown.IParams` owns the shape; the alias serves `putDown` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IPutDown = IAutoMovieMotionHumanPutDown.IParams;

  /**
   * The parameters of `regrasp`: `IAutoMovieMotionHumanRegrasp.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanRegrasp.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanRegrasp.IParams` owns the shape; the alias serves `regrasp` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IRegrasp = IAutoMovieMotionHumanRegrasp.IParams;

  /**
   * The parameters of `carryHang`: `IAutoMovieMotionHumanCarryHang.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanCarryHang.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanCarryHang.IParams` owns the shape; the alias serves `carryHang` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type ICarryHang = IAutoMovieMotionHumanCarryHang.IParams;
}
