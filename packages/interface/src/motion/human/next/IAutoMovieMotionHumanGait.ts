import type { IAutoMovieMotionHumanAidWalk } from "../lexicon/IAutoMovieMotionHumanAidWalk";
import type { IAutoMovieMotionHumanApproach } from "../everyday/IAutoMovieMotionHumanApproach";
import type { IAutoMovieMotionHumanCaneSweep } from "../lexicon/IAutoMovieMotionHumanCaneSweep";
import type { IAutoMovieMotionHumanCarry } from "../carrying/IAutoMovieMotionHumanCarry";
import type { IAutoMovieMotionHumanCrutchWalk } from "../lexicon/IAutoMovieMotionHumanCrutchWalk";
import type { IAutoMovieMotionHumanFrailWalk } from "../lexicon/IAutoMovieMotionHumanFrailWalk";
import type { IAutoMovieMotionHumanGait as ILegacyGait } from "../lexicon/IAutoMovieMotionHumanGait";
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
export interface IAutoMovieMotionHumanGait<Chain> {
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

  /**
   * Walk with a cane or a crutch held, or beside a person who walks it.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanGait.aidWalk: Walk with a cane or a crutch held, or beside a person who walks it.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGait.aidWalk is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGait.aidWalk is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGait.aidWalk is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGait.aidWalk is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGait.aidWalk is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGait.aidWalk is provided by the chain that implements IAutoMovieMotionHumanGait.
   */
  aidWalk(params: IAutoMovieMotionHumanGait.IAidWalk, anchor?: string): Chain;

  /**
   * Walk as an older or frail person does, from the ordinary walk to a shuffle.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanGait.frailWalk: Walk as an older or frail person does, from the ordinary walk to a shuffle.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGait.frailWalk is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGait.frailWalk is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGait.frailWalk is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGait.frailWalk is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGait.frailWalk is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGait.frailWalk is provided by the chain that implements IAutoMovieMotionHumanGait.
   */
  frailWalk(params: IAutoMovieMotionHumanGait.IFrailWalk, anchor?: string): Chain;

  /**
   * Walk on crutches in a three-point, swing-to or swing-through pattern.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanGait.crutchWalk: Walk on crutches in a three-point, swing-to or swing-through pattern.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGait.crutchWalk is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGait.crutchWalk is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGait.crutchWalk is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGait.crutchWalk is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGait.crutchWalk is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGait.crutchWalk is provided by the chain that implements IAutoMovieMotionHumanGait.
   */
  crutchWalk(params: IAutoMovieMotionHumanGait.ICrutchWalk, anchor?: string): Chain;

  /**
   * Walk sweeping a long cane in front of the body.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanGait.caneSweep: Walk sweeping a long cane in front of the body.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGait.caneSweep is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGait.caneSweep is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGait.caneSweep is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGait.caneSweep is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGait.caneSweep is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGait.caneSweep is provided by the chain that implements IAutoMovieMotionHumanGait.
   */
  caneSweep(params: IAutoMovieMotionHumanGait.ICaneSweep, anchor?: string): Chain;

  /**
   * March at a drill regulation's cadence and step.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanGait.march: March at a drill regulation's cadence and step.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGait.march is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGait.march is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGait.march is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGait.march is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGait.march is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGait.march is provided by the chain that implements IAutoMovieMotionHumanGait.
   */
  march(params: IAutoMovieMotionHumanGait.IMarch, anchor?: string): Chain;

  /**
   * Run the drill step at the double-time cadence.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanGait.doubleTime: Run the drill step at the double-time cadence.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGait.doubleTime is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGait.doubleTime is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGait.doubleTime is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGait.doubleTime is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGait.doubleTime is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGait.doubleTime is provided by the chain that implements IAutoMovieMotionHumanGait.
   */
  doubleTime(params: IAutoMovieMotionHumanGait.IDoubleTime, anchor?: string): Chain;

  /**
   * Walk slower than the slow walk on short steps with the pelvis lowered.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanGait.sneak: Walk slower than the slow walk on short steps with the pelvis lowered.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGait.sneak is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGait.sneak is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGait.sneak is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGait.sneak is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGait.sneak is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGait.sneak is provided by the chain that implements IAutoMovieMotionHumanGait.
   */
  sneak(params: IAutoMovieMotionHumanGait.ISneak, anchor?: string): Chain;

  /**
   * Sneak on deeply bent knees.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanGait.prowl: Sneak on deeply bent knees.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGait.prowl is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGait.prowl is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGait.prowl is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGait.prowl is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGait.prowl is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGait.prowl is provided by the chain that implements IAutoMovieMotionHumanGait.
   */
  prowl(params: IAutoMovieMotionHumanGait.IProwl, anchor?: string): Chain;

  /**
   * Sneak on the balls of the feet with the heels never set down.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanGait.tiptoe: Sneak on the balls of the feet with the heels never set down.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGait.tiptoe is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGait.tiptoe is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGait.tiptoe is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGait.tiptoe is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGait.tiptoe is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGait.tiptoe is provided by the chain that implements IAutoMovieMotionHumanGait.
   */
  tiptoe(params: IAutoMovieMotionHumanGait.ITiptoe, anchor?: string): Chain;

  /**
   * Walk slowly with the arms barely swinging and the trunk slumped.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanGait.sad: Walk slowly with the arms barely swinging and the trunk slumped.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGait.sad is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGait.sad is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGait.sad is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGait.sad is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGait.sad is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGait.sad is provided by the chain that implements IAutoMovieMotionHumanGait.
   */
  sad(params: IAutoMovieMotionHumanGait.ISad, anchor?: string): Chain;

  /**
   * Walk upright with the arms swung freely.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanGait.proud: Walk upright with the arms swung freely.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGait.proud is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGait.proud is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGait.proud is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGait.proud is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGait.proud is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGait.proud is provided by the chain that implements IAutoMovieMotionHumanGait.
   */
  proud(params: IAutoMovieMotionHumanGait.IProud, anchor?: string): Chain;

  /**
   * Walk sparing one leg, standing on it briefly.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanGait.limp: Walk sparing one leg, standing on it briefly.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGait.limp is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGait.limp is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGait.limp is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGait.limp is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGait.limp is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGait.limp is provided by the chain that implements IAutoMovieMotionHumanGait.
   */
  limp(params: IAutoMovieMotionHumanGait.ILimp, anchor?: string): Chain;

  /**
   * Limp with the spared leg also swinging straight.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanGait.stiffLimp: Limp with the spared leg also swinging straight.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGait.stiffLimp is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGait.stiffLimp is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGait.stiffLimp is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGait.stiffLimp is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGait.stiffLimp is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGait.stiffLimp is provided by the chain that implements IAutoMovieMotionHumanGait.
   */
  stiffLimp(params: IAutoMovieMotionHumanGait.IStiffLimp, anchor?: string): Chain;

  /**
   * Walk slowly, unsteady in time and wandering off the line.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanGait.drunk: Walk slowly, unsteady in time and wandering off the line.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGait.drunk is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGait.drunk is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGait.drunk is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGait.drunk is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGait.drunk is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGait.drunk is provided by the chain that implements IAutoMovieMotionHumanGait.
   */
  drunk(params: IAutoMovieMotionHumanGait.IDrunk, anchor?: string): Chain;
}

/**
 * The parameter types of the gait methods and the members they share.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the parameter type of each gait method and the closed paces and manner they share.
 * @evidence contracts/development/design.md#principled-representation Each parameter type is the law's existing type; the shared members are named once instead of read by indexed access at each user.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One parameter type per method and three shared members.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Nothing is redefined: every name aliases the type its law already reads.
 */
export namespace IAutoMovieMotionHumanGait {
  /** The parameters of `walk`. */
  export type IWalk = IAutoMovieMotionHumanWalkParams;

  /** The parameters of `run`. */
  export type IRun = IAutoMovieMotionHumanRun.IParams;

  /** The parameters of `approach`. */
  export type IApproach = IAutoMovieMotionHumanApproach.IParams;

  /** The parameters of `carryLoad`. */
  export type ICarryLoad = IAutoMovieMotionHumanCarry.IParams;

  /** The parameters of `intercept`. */
  export type IIntercept = IAutoMovieMotionHumanPursuit.IIntercept;

  /** The parameters of `flee`. */
  export type IFlee = IAutoMovieMotionHumanPursuit.IFlee;

  /** The parameters of `travelDoor`. */
  export type ITravelDoor = IAutoMovieMotionHumanTravelDoor.IParams;

  /** The parameters of `aidWalk`. */
  export type IAidWalk = IAutoMovieMotionHumanAidWalk;

  /** The parameters of `frailWalk`. */
  export type IFrailWalk = IAutoMovieMotionHumanFrailWalk;

  /** The parameters of `crutchWalk`. */
  export type ICrutchWalk = IAutoMovieMotionHumanCrutchWalk;

  /** The parameters of `caneSweep`. */
  export type ICaneSweep = IAutoMovieMotionHumanCaneSweep;

  /** The parameters of `march`. */
  export type IMarch = ILegacyGait.IMarch;

  /** The parameters of `doubleTime`. */
  export type IDoubleTime = ILegacyGait.IParams;

  /** The parameters of `sneak`. */
  export type ISneak = ILegacyGait.IParams;

  /** The parameters of `prowl`. */
  export type IProwl = ILegacyGait.IParams;

  /** The parameters of `tiptoe`. */
  export type ITiptoe = ILegacyGait.IParams;

  /** The parameters of `sad`. */
  export type ISad = ILegacyGait.IParams;

  /** The parameters of `proud`. */
  export type IProud = ILegacyGait.IParams;

  /** The parameters of `limp`. */
  export type ILimp = ILegacyGait.ILimp;

  /** The parameters of `stiffLimp`. */
  export type IStiffLimp = ILegacyGait.ILimp;

  /** The parameters of `drunk`. */
  export type IDrunk = ILegacyGait.IParams;

  /** The closed paces of the walk: `slow`, `normal` and `fast`. */
  export type WalkPace = NonNullable<IAutoMovieMotionHumanWalkParams["pace"]>;

  /** The closed paces of the run: `jog`, `run` and `sprint`. */
  export type RunPace = NonNullable<IAutoMovieMotionHumanRun.IParams["pace"]>;

  /** How a gait is performed: its `pace` multiplies the speed. */
  export type IManner = IAutoMovieMotionManner;
}
