import type { IAutoMovieMotionHumanFirefight } from "../tasks/IAutoMovieMotionHumanFirefight";

/**
 * Mechanism: Behaviour: fighting a fire. A nozzle and a backup role extinguish, run a hose line and beat flames; a victim whose clothes burn stops, drops and rolls. The durations are provisional.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the Firefighting family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The Firefighting laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanFirefighting<Chain> {
  /**
   * Firefighting drills with coarse inert props.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanFirefighting.extinguish: Firefighting drills with coarse inert props.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanFirefighting.extinguish is provided by the chain that implements IAutoMovieMotionHumanFirefighting.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanFirefighting.extinguish is provided by the chain that implements IAutoMovieMotionHumanFirefighting.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanFirefighting.extinguish is provided by the chain that implements IAutoMovieMotionHumanFirefighting.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanFirefighting.extinguish is provided by the chain that implements IAutoMovieMotionHumanFirefighting.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanFirefighting.extinguish is provided by the chain that implements IAutoMovieMotionHumanFirefighting.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanFirefighting.extinguish is provided by the chain that implements IAutoMovieMotionHumanFirefighting.
   */
  extinguish(params: IAutoMovieMotionHumanFirefighting.IExtinguish, anchor?: string): Chain;

  /**
   * Firefighting drills with coarse inert props.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanFirefighting.hoseLine: Firefighting drills with coarse inert props.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanFirefighting.hoseLine is provided by the chain that implements IAutoMovieMotionHumanFirefighting.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanFirefighting.hoseLine is provided by the chain that implements IAutoMovieMotionHumanFirefighting.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanFirefighting.hoseLine is provided by the chain that implements IAutoMovieMotionHumanFirefighting.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanFirefighting.hoseLine is provided by the chain that implements IAutoMovieMotionHumanFirefighting.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanFirefighting.hoseLine is provided by the chain that implements IAutoMovieMotionHumanFirefighting.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanFirefighting.hoseLine is provided by the chain that implements IAutoMovieMotionHumanFirefighting.
   */
  hoseLine(params: IAutoMovieMotionHumanFirefighting.IHoseLine, anchor?: string): Chain;

  /**
   * Firefighting drills with coarse inert props.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanFirefighting.beatFlames: Firefighting drills with coarse inert props.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanFirefighting.beatFlames is provided by the chain that implements IAutoMovieMotionHumanFirefighting.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanFirefighting.beatFlames is provided by the chain that implements IAutoMovieMotionHumanFirefighting.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanFirefighting.beatFlames is provided by the chain that implements IAutoMovieMotionHumanFirefighting.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanFirefighting.beatFlames is provided by the chain that implements IAutoMovieMotionHumanFirefighting.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanFirefighting.beatFlames is provided by the chain that implements IAutoMovieMotionHumanFirefighting.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanFirefighting.beatFlames is provided by the chain that implements IAutoMovieMotionHumanFirefighting.
   */
  beatFlames(params: IAutoMovieMotionHumanFirefighting.IBeatFlames, anchor?: string): Chain;

  /**
   * Firefighting drills with coarse inert props.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanFirefighting.stopDropRoll: Firefighting drills with coarse inert props.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanFirefighting.stopDropRoll is provided by the chain that implements IAutoMovieMotionHumanFirefighting.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanFirefighting.stopDropRoll is provided by the chain that implements IAutoMovieMotionHumanFirefighting.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanFirefighting.stopDropRoll is provided by the chain that implements IAutoMovieMotionHumanFirefighting.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanFirefighting.stopDropRoll is provided by the chain that implements IAutoMovieMotionHumanFirefighting.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanFirefighting.stopDropRoll is provided by the chain that implements IAutoMovieMotionHumanFirefighting.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanFirefighting.stopDropRoll is provided by the chain that implements IAutoMovieMotionHumanFirefighting.
   */
  stopDropRoll(params: IAutoMovieMotionHumanFirefighting.IStopDropRoll, anchor?: string): Chain;
}

/**
 * The parameter types of the Firefighting methods.
 */
export namespace IAutoMovieMotionHumanFirefighting {
  /**
   * The parameters of `extinguish`: the law's own `IAutoMovieMotionHumanFirefight.IExtinguish`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanFirefight` owns the type; the alias serves this family's `extinguish` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `extinguish` takes the type its law reads.
   */
  export type IExtinguish = IAutoMovieMotionHumanFirefight.IExtinguish;

  /**
   * The parameters of `hoseLine`: the law's own `IAutoMovieMotionHumanFirefight.IHoseLine`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanFirefight` owns the type; the alias serves this family's `hoseLine` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `hoseLine` takes the type its law reads.
   */
  export type IHoseLine = IAutoMovieMotionHumanFirefight.IHoseLine;

  /**
   * The parameters of `beatFlames`: the law's own `IAutoMovieMotionHumanFirefight.IBeatFlames`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanFirefight` owns the type; the alias serves this family's `beatFlames` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `beatFlames` takes the type its law reads.
   */
  export type IBeatFlames = IAutoMovieMotionHumanFirefight.IBeatFlames;

  /**
   * The parameters of `stopDropRoll`: the law's own `IAutoMovieMotionHumanFirefight.IStopDropRoll`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanFirefight` owns the type; the alias serves this family's `stopDropRoll` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `stopDropRoll` takes the type its law reads.
   */
  export type IStopDropRoll = IAutoMovieMotionHumanFirefight.IStopDropRoll;
}
