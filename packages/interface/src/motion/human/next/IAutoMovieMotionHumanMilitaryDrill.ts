import type { IAutoMovieMotionHumanGait } from "../lexicon/IAutoMovieMotionHumanGait";

/**
 * Mechanism: Behaviour: military drill. Marching keeps the regulation's cadence and step: quick time is 120 steps a minute and double time 180 on a 30 inch (0.762 m) step (US Army TC 3-21.5, as `HumanGait.MARCH` and `HumanGait.DOUBLE` state them). The gun crew, gun drill and musket drill rows are preset data.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the MilitaryDrill family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The MilitaryDrill laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanMilitaryDrill<Chain> {
  /**
   * Named ways of going somewhere on foot; the composition gives the destination.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanMilitaryDrill.march: Named ways of going somewhere on foot; the composition gives the destination.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanMilitaryDrill.march is provided by the chain that implements IAutoMovieMotionHumanMilitaryDrill.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanMilitaryDrill.march is provided by the chain that implements IAutoMovieMotionHumanMilitaryDrill.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanMilitaryDrill.march is provided by the chain that implements IAutoMovieMotionHumanMilitaryDrill.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanMilitaryDrill.march is provided by the chain that implements IAutoMovieMotionHumanMilitaryDrill.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanMilitaryDrill.march is provided by the chain that implements IAutoMovieMotionHumanMilitaryDrill.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanMilitaryDrill.march is provided by the chain that implements IAutoMovieMotionHumanMilitaryDrill.
   */
  march(params: IAutoMovieMotionHumanMilitaryDrill.IMarch, anchor?: string): Chain;

  /**
   * Named ways of going somewhere on foot; the composition gives the destination.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanMilitaryDrill.doubleTime: Named ways of going somewhere on foot; the composition gives the destination.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanMilitaryDrill.doubleTime is provided by the chain that implements IAutoMovieMotionHumanMilitaryDrill.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanMilitaryDrill.doubleTime is provided by the chain that implements IAutoMovieMotionHumanMilitaryDrill.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanMilitaryDrill.doubleTime is provided by the chain that implements IAutoMovieMotionHumanMilitaryDrill.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanMilitaryDrill.doubleTime is provided by the chain that implements IAutoMovieMotionHumanMilitaryDrill.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanMilitaryDrill.doubleTime is provided by the chain that implements IAutoMovieMotionHumanMilitaryDrill.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanMilitaryDrill.doubleTime is provided by the chain that implements IAutoMovieMotionHumanMilitaryDrill.
   */
  doubleTime(params: IAutoMovieMotionHumanMilitaryDrill.IDoubleTime, anchor?: string): Chain;
}

/**
 * The parameter types of the MilitaryDrill methods.
 */
export namespace IAutoMovieMotionHumanMilitaryDrill {
  /**
   * The parameters of `march`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the parameter type of `march`: the existing type of its law.
   */
  export type IMarch = IAutoMovieMotionHumanGait.IMarch;

  /**
   * The parameters of `doubleTime`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the parameter type of `doubleTime`: the existing type of its law.
   */
  export type IDoubleTime = IAutoMovieMotionHumanGait.IParams;
}
