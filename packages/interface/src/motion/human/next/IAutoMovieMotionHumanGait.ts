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
   * The parameters of `walk`: the walk law's own `IAutoMovieMotionHumanWalkParams`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanWalkParams` owns the type; the alias serves this family's `walk` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `walk` takes the type its law reads.
   */
  export type IWalk = IAutoMovieMotionHumanWalkParams;

  /**
   * The parameters of `run`: the run law's own `IAutoMovieMotionHumanRun.IParams`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanRun` owns the type; the alias serves this family's `run` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `run` takes the type its law reads.
   */
  export type IRun = IAutoMovieMotionHumanRun.IParams;

  /**
   * The parameters of `approach`: the law's own `IAutoMovieMotionHumanApproach.IParams`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanApproach` owns the type; the alias serves this family's `approach` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `approach` takes the type its law reads.
   */
  export type IApproach = IAutoMovieMotionHumanApproach.IParams;

  /**
   * The parameters of `carryLoad`: the carry law's own `IAutoMovieMotionHumanCarry.IParams`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanCarry` owns the type; the alias serves this family's `carryLoad` signature, the carry law exported under that name.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `carryLoad` takes the type its law reads.
   */
  export type ICarryLoad = IAutoMovieMotionHumanCarry.IParams;

  /**
   * The parameters of `intercept`: the pursuit law's own `IAutoMovieMotionHumanPursuit.IIntercept`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanPursuit` owns the type; the alias serves this family's `intercept` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `intercept` takes the type its law reads.
   */
  export type IIntercept = IAutoMovieMotionHumanPursuit.IIntercept;

  /**
   * The parameters of `flee`: the pursuit law's own `IAutoMovieMotionHumanPursuit.IFlee`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanPursuit` owns the type; the alias serves this family's `flee` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `flee` takes the type its law reads.
   */
  export type IFlee = IAutoMovieMotionHumanPursuit.IFlee;

  /**
   * The parameters of `travelDoor`: the law's own `IAutoMovieMotionHumanTravelDoor.IParams`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanTravelDoor` owns the type; the alias serves this family's `travelDoor` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `travelDoor` takes the type its law reads.
   */
  export type ITravelDoor = IAutoMovieMotionHumanTravelDoor.IParams;

  /**
   * The closed paces of the walk, `slow`, `normal` and `fast`: the walk's own `pace` member without its absence.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the three values and that they are the walk's `pace` member with absence removed.
   * @evidence contracts/development/design.md#principled-representation A closed string union derived from `IAutoMovieMotionHumanWalkParams.pace`, so it admits exactly the walk's paces; each pace's Froude number and speed are the walk law's (`walk.FROUDE`).
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanWalkParams` owns the values; the family doc names the type for an author choosing a pace, and no code in the repository reads it yet.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the type is derived, not restated, so it cannot drift from the walk's own values.
   */
  export type WalkPace = NonNullable<IAutoMovieMotionHumanWalkParams["pace"]>;

  /**
   * The closed paces of the run, `jog`, `run` and `sprint`: the run's own `pace` member without its absence.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the three values and that they are the run's `pace` member with absence removed.
   * @evidence contracts/development/design.md#principled-representation A closed string union derived from `IAutoMovieMotionHumanRun.IParams.pace`, so it admits exactly the run's paces; each pace's duty factor and Froude number are the run law's (`run.GAITS`).
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanRun` owns the values; the family doc names the type for an author choosing a pace, and no code in the repository reads it yet.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the type is derived, not restated, so it cannot drift from the run's own values.
   */
  export type RunPace = NonNullable<IAutoMovieMotionHumanRun.IParams["pace"]>;

  /**
   * How a gait is performed: `IAutoMovieMotionManner`, unchanged, whose `pace` multiplies the speed.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the aliased manner type and the effect of its `pace` on a gait's speed.
   * @evidence contracts/development/design.md#principled-representation An alias: the manner's members, scales and defaults are those `IAutoMovieMotionManner` states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The compose folder's `IAutoMovieMotionManner` owns the type; the family names it beside the speed model, and no code in the repository reads this name yet.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast.
   */
  export type IManner = IAutoMovieMotionManner;
}
