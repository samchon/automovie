import type { IAutoMovieMotionHumanAidWalk } from "../lexicon/IAutoMovieMotionHumanAidWalk";
import type { IAutoMovieMotionHumanCaneSweep } from "../lexicon/IAutoMovieMotionHumanCaneSweep";
import type { IAutoMovieMotionHumanCrutchWalk } from "../lexicon/IAutoMovieMotionHumanCrutchWalk";
import type { IAutoMovieMotionHumanFrailWalk } from "../lexicon/IAutoMovieMotionHumanFrailWalk";

/**
 * Mechanism: aided walks: a cane or crutches held, a frail or older walk, and a long cane swept in front of the body. The speed model is on `IAutoMovieMotionHumanGait`.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family, the speed model it shares, the scale of every gait value and that rows are presets.
 * @evidence contracts/development/design.md#principled-representation One method per gait law, each taking the law's own parameter type, over the one speed model of the walk's stepping plan.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The gait laws of the walk family: walk, run, approach, carryLoad, the pursuit laws, the door, the aided walks and the styled gaits.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; no gait has a method of its own that only respells a pace.
 */
export interface IAutoMovieMotionHumanGaitAided<Chain> {
  /**
   * Walk with a cane or a crutch held, or beside a person who walks it.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanGaitAided.aidWalk: Walk with a cane or a crutch held, or beside a person who walks it.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGaitAided.aidWalk is provided by the chain that implements IAutoMovieMotionHumanGaitAided.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGaitAided.aidWalk is provided by the chain that implements IAutoMovieMotionHumanGaitAided.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGaitAided.aidWalk is provided by the chain that implements IAutoMovieMotionHumanGaitAided.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGaitAided.aidWalk is provided by the chain that implements IAutoMovieMotionHumanGaitAided.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGaitAided.aidWalk is provided by the chain that implements IAutoMovieMotionHumanGaitAided.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGaitAided.aidWalk is provided by the chain that implements IAutoMovieMotionHumanGaitAided.
   */
  aidWalk(params: IAutoMovieMotionHumanGaitAided.IAidWalk, anchor?: string): Chain;

  /**
   * Walk as an older or frail person does, from the ordinary walk to a shuffle.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanGaitAided.frailWalk: Walk as an older or frail person does, from the ordinary walk to a shuffle.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGaitAided.frailWalk is provided by the chain that implements IAutoMovieMotionHumanGaitAided.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGaitAided.frailWalk is provided by the chain that implements IAutoMovieMotionHumanGaitAided.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGaitAided.frailWalk is provided by the chain that implements IAutoMovieMotionHumanGaitAided.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGaitAided.frailWalk is provided by the chain that implements IAutoMovieMotionHumanGaitAided.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGaitAided.frailWalk is provided by the chain that implements IAutoMovieMotionHumanGaitAided.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGaitAided.frailWalk is provided by the chain that implements IAutoMovieMotionHumanGaitAided.
   */
  frailWalk(params: IAutoMovieMotionHumanGaitAided.IFrailWalk, anchor?: string): Chain;

  /**
   * Walk on crutches in a three-point, swing-to or swing-through pattern.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanGaitAided.crutchWalk: Walk on crutches in a three-point, swing-to or swing-through pattern.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGaitAided.crutchWalk is provided by the chain that implements IAutoMovieMotionHumanGaitAided.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGaitAided.crutchWalk is provided by the chain that implements IAutoMovieMotionHumanGaitAided.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGaitAided.crutchWalk is provided by the chain that implements IAutoMovieMotionHumanGaitAided.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGaitAided.crutchWalk is provided by the chain that implements IAutoMovieMotionHumanGaitAided.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGaitAided.crutchWalk is provided by the chain that implements IAutoMovieMotionHumanGaitAided.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGaitAided.crutchWalk is provided by the chain that implements IAutoMovieMotionHumanGaitAided.
   */
  crutchWalk(params: IAutoMovieMotionHumanGaitAided.ICrutchWalk, anchor?: string): Chain;

  /**
   * Walk sweeping a long cane in front of the body.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanGaitAided.caneSweep: Walk sweeping a long cane in front of the body.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGaitAided.caneSweep is provided by the chain that implements IAutoMovieMotionHumanGaitAided.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGaitAided.caneSweep is provided by the chain that implements IAutoMovieMotionHumanGaitAided.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGaitAided.caneSweep is provided by the chain that implements IAutoMovieMotionHumanGaitAided.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGaitAided.caneSweep is provided by the chain that implements IAutoMovieMotionHumanGaitAided.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGaitAided.caneSweep is provided by the chain that implements IAutoMovieMotionHumanGaitAided.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGaitAided.caneSweep is provided by the chain that implements IAutoMovieMotionHumanGaitAided.
   */
  caneSweep(params: IAutoMovieMotionHumanGaitAided.ICaneSweep, anchor?: string): Chain;
}

/**
 * The parameter types of the GaitAided methods.
 */
export namespace IAutoMovieMotionHumanGaitAided {
  /**
   * The parameters of `aidWalk`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the parameter type of `aidWalk`: the existing type of its law.
   */
  export type IAidWalk = IAutoMovieMotionHumanAidWalk;

  /**
   * The parameters of `frailWalk`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the parameter type of `frailWalk`: the existing type of its law.
   */
  export type IFrailWalk = IAutoMovieMotionHumanFrailWalk;

  /**
   * The parameters of `crutchWalk`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the parameter type of `crutchWalk`: the existing type of its law.
   */
  export type ICrutchWalk = IAutoMovieMotionHumanCrutchWalk;

  /**
   * The parameters of `caneSweep`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the parameter type of `caneSweep`: the existing type of its law.
   */
  export type ICaneSweep = IAutoMovieMotionHumanCaneSweep;
}
