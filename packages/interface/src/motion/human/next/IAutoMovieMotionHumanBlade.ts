import type { IAutoMovieMotionHumanStageBladeFootwork } from "../lexicon/IAutoMovieMotionHumanStageBladeFootwork";
import type { IAutoMovieMotionHumanSwordGuard } from "../lexicon/IAutoMovieMotionHumanSwordGuard";

/**
 * Mechanism: Fighting with a blade: the sword guard and the staged blade footwork.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the Blade family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The Blade laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanBlade<Chain> {
  /**
   * The guards of blade work: the blade taken from where the hand holds it to a named guard and kept there.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanBlade.swordGuard: The guards of blade work: the blade taken from where the hand holds it to a named guard and kept there.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanBlade.swordGuard is provided by the chain that implements IAutoMovieMotionHumanBlade.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanBlade.swordGuard is provided by the chain that implements IAutoMovieMotionHumanBlade.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanBlade.swordGuard is provided by the chain that implements IAutoMovieMotionHumanBlade.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanBlade.swordGuard is provided by the chain that implements IAutoMovieMotionHumanBlade.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanBlade.swordGuard is provided by the chain that implements IAutoMovieMotionHumanBlade.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanBlade.swordGuard is provided by the chain that implements IAutoMovieMotionHumanBlade.
   */
  swordGuard(params: IAutoMovieMotionHumanBlade.ISwordGuard, anchor?: string): Chain;

  /**
   * Controls for one grounded stage mark shift with a padded blade silhouette.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanBlade.stageBladeFootwork: Controls for one grounded stage mark shift with a padded blade silhouette.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanBlade.stageBladeFootwork is provided by the chain that implements IAutoMovieMotionHumanBlade.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanBlade.stageBladeFootwork is provided by the chain that implements IAutoMovieMotionHumanBlade.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanBlade.stageBladeFootwork is provided by the chain that implements IAutoMovieMotionHumanBlade.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanBlade.stageBladeFootwork is provided by the chain that implements IAutoMovieMotionHumanBlade.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanBlade.stageBladeFootwork is provided by the chain that implements IAutoMovieMotionHumanBlade.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanBlade.stageBladeFootwork is provided by the chain that implements IAutoMovieMotionHumanBlade.
   */
  stageBladeFootwork(params: IAutoMovieMotionHumanBlade.IStageBladeFootwork, anchor?: string): Chain;
}

/**
 * The parameter types of the Blade methods.
 */
export namespace IAutoMovieMotionHumanBlade {
  /**
   * The parameters of `swordGuard`: the law's own `IAutoMovieMotionHumanSwordGuard.IParams`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanSwordGuard` owns the type; the alias serves this family's `swordGuard` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `swordGuard` takes the type its law reads.
   */
  export type ISwordGuard = IAutoMovieMotionHumanSwordGuard.IParams;

  /**
   * The parameters of `stageBladeFootwork`: the law's own `IAutoMovieMotionHumanStageBladeFootwork.IParams`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanStageBladeFootwork` owns the type; the alias serves this family's `stageBladeFootwork` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `stageBladeFootwork` takes the type its law reads.
   */
  export type IStageBladeFootwork = IAutoMovieMotionHumanStageBladeFootwork.IParams;
}
