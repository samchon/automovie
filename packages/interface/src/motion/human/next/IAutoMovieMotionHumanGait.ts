import type { IAutoMovieMotionHumanGaitStyled } from "./IAutoMovieMotionHumanGaitStyled";
import type { IAutoMovieMotionHumanGaitAided } from "./IAutoMovieMotionHumanGaitAided";
import type { IAutoMovieMotionHumanApproach } from "../everyday/IAutoMovieMotionHumanApproach";
import type { IAutoMovieMotionHumanCarry } from "../carrying/IAutoMovieMotionHumanCarry";
import type { IAutoMovieMotionHumanPursuit } from "../lexicon/IAutoMovieMotionHumanPursuit";
import type { IAutoMovieMotionHumanRun } from "../actions/IAutoMovieMotionHumanRun";
import type { IAutoMovieMotionHumanTravelDoor } from "../lexicon/IAutoMovieMotionHumanTravelDoor";
import type { IAutoMovieMotionHumanWalkParams } from "../actions/IAutoMovieMotionHumanWalkParams";
import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";

/**
 * Mechanism: the gaits. Walking and running to a floor point, the styled gaits that run the walk's stepping plan, travel relative to a person, and aided walks.
 *
 * The speed model of every gait. A pace is a Froude number `Fr` and the speed is `v = sqrt(Fr g l)` for the hip height `l` (`walk.FROUDE`, `run.GAITS`): a body with a longer leg is faster by the square root of `l`, its step is longer by `l` and its steps a minute fall by the square root of `l`. Every speed and steps a minute stated on these types is at the reference hip, 0.93 m (`walkRoot.REFERENCE_HIP`). `stride` changes the step and the steps a minute inversely and leaves the speed; `manner.pace` multiplies the speed (`IAutoMovieMotionManner.pace`).
 *
 * `WalkPace` and `RunPace` name the closed paces. The rows `stroll`, `hurry`, `trudge`, `swagger`, `jog` and `sprint` are presets on `walk` and `run`, held as data on `AutoMovieMotionHumanGait`; a preset adds no method.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family, the speed model it shares, the scale of every gait value and that rows are presets.
 * @evidence contracts/development/design.md#principled-representation One method per gait law, each taking the law's own parameter type, over the one speed model of the walk's stepping plan.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The gait laws of the walk family: walk, run, approach, carryLoad, the pursuit laws, the door, the aided walks and the styled gaits.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; no gait has a method of its own that only respells a pace.
 */
export interface IAutoMovieMotionHumanGait<Chain> extends IAutoMovieMotionHumanGaitStyled<Chain>, IAutoMovieMotionHumanGaitAided<Chain> {
  /**
   * Walk to a floor point at a slow, normal or fast pace.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanGait.walk: Walk to a floor point at a slow, normal or fast pace.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGait.walk is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGait.walk is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGait.walk is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGait.walk is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGait.walk is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGait.walk is provided by the chain that implements IAutoMovieMotionHumanGait.
   */
  walk(params: IAutoMovieMotionHumanGait.IWalk, anchor?: string): Chain;

  /**
   * Run to a floor point at a jog, a run or a sprint.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanGait.run: Run to a floor point at a jog, a run or a sprint.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGait.run is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGait.run is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGait.run is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGait.run is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGait.run is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGait.run is provided by the chain that implements IAutoMovieMotionHumanGait.
   */
  run(params: IAutoMovieMotionHumanGait.IRun, anchor?: string): Chain;

  /**
   * Walk up to a person, prop or point and stop at an interpersonal gap.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanGait.approach: Walk up to a person, prop or point and stop at an interpersonal gap.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGait.approach is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGait.approach is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGait.approach is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGait.approach is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGait.approach is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGait.approach is provided by the chain that implements IAutoMovieMotionHumanGait.
   */
  approach(params: IAutoMovieMotionHumanGait.IApproach, anchor?: string): Chain;

  /**
   * Walk to a floor point carrying a load or pushing a wheeled one.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanGait.carryLoad: Walk to a floor point carrying a load or pushing a wheeled one.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGait.carryLoad is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGait.carryLoad is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGait.carryLoad is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGait.carryLoad is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGait.carryLoad is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGait.carryLoad is provided by the chain that implements IAutoMovieMotionHumanGait.
   */
  carryLoad(params: IAutoMovieMotionHumanGait.ICarryLoad, anchor?: string): Chain;

  /**
   * Run to where a moving person will be and stop at arm's length.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanGait.intercept: Run to where a moving person will be and stop at arm's length.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGait.intercept is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGait.intercept is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGait.intercept is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGait.intercept is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGait.intercept is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGait.intercept is provided by the chain that implements IAutoMovieMotionHumanGait.
   */
  intercept(params: IAutoMovieMotionHumanGait.IIntercept, anchor?: string): Chain;

  /**
   * Run straight away from a person.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanGait.flee: Run straight away from a person.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGait.flee is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGait.flee is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGait.flee is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGait.flee is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGait.flee is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGait.flee is provided by the chain that implements IAutoMovieMotionHumanGait.
   */
  flee(params: IAutoMovieMotionHumanGait.IFlee, anchor?: string): Chain;

  /**
   * Pass through an opening upright, ducking, squeezing or crawling.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanGait.travelDoor: Pass through an opening upright, ducking, squeezing or crawling.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGait.travelDoor is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGait.travelDoor is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGait.travelDoor is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGait.travelDoor is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGait.travelDoor is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGait.travelDoor is provided by the chain that implements IAutoMovieMotionHumanGait.
   */
  travelDoor(params: IAutoMovieMotionHumanGait.ITravelDoor, anchor?: string): Chain;
}

/**
 * The parameter types of the Gait methods.
 */
export namespace IAutoMovieMotionHumanGait {
  /**
   * The parameters of `walk`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the parameter type of `walk`: the existing type of its law.
   */
  export type IWalk = IAutoMovieMotionHumanWalkParams;

  /**
   * The parameters of `run`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the parameter type of `run`: the existing type of its law.
   */
  export type IRun = IAutoMovieMotionHumanRun.IParams;

  /**
   * The parameters of `approach`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the parameter type of `approach`: the existing type of its law.
   */
  export type IApproach = IAutoMovieMotionHumanApproach.IParams;

  /**
   * The parameters of `carryLoad`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the parameter type of `carryLoad`: the existing type of its law.
   */
  export type ICarryLoad = IAutoMovieMotionHumanCarry.IParams;

  /**
   * The parameters of `intercept`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the parameter type of `intercept`: the existing type of its law.
   */
  export type IIntercept = IAutoMovieMotionHumanPursuit.IIntercept;

  /**
   * The parameters of `flee`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the parameter type of `flee`: the existing type of its law.
   */
  export type IFlee = IAutoMovieMotionHumanPursuit.IFlee;

  /**
   * The parameters of `travelDoor`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the parameter type of `travelDoor`: the existing type of its law.
   */
  export type ITravelDoor = IAutoMovieMotionHumanTravelDoor.IParams;

  /**
   * The closed paces of the walk: `slow`, `normal` and `fast`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The closed paces of the walk: `slow`, `normal` and `fast`.
   */
  export type WalkPace = NonNullable<IAutoMovieMotionHumanWalkParams["pace"]>;

  /**
   * The closed paces of the run: `jog`, `run` and `sprint`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The closed paces of the run: `jog`, `run` and `sprint`.
   */
  export type RunPace = NonNullable<IAutoMovieMotionHumanRun.IParams["pace"]>;

  /**
   * How a gait is performed: its `pace` multiplies the speed.
   *
   * @evidence contracts/development/common.md#meaningful-documentation How a gait is performed: its `pace` multiplies the speed.
   */
  export type IManner = IAutoMovieMotionManner;
}
