import type { IAutoMovieMotionHumanWeaponTrack } from "../lexicon/IAutoMovieMotionHumanWeaponTrack";

/**
 * Mechanism: Handling a firearm: tracking a target with a weapon.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the Firearm family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The Firearm laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanFirearm<Chain> {
  /**
   * Tracking: a presented firearm kept on a target that moves (#3348).
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanFirearm.weaponTrack: Tracking: a presented firearm kept on a target that moves (#3348).
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanFirearm.weaponTrack is provided by the chain that implements IAutoMovieMotionHumanFirearm.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanFirearm.weaponTrack is provided by the chain that implements IAutoMovieMotionHumanFirearm.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanFirearm.weaponTrack is provided by the chain that implements IAutoMovieMotionHumanFirearm.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanFirearm.weaponTrack is provided by the chain that implements IAutoMovieMotionHumanFirearm.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanFirearm.weaponTrack is provided by the chain that implements IAutoMovieMotionHumanFirearm.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanFirearm.weaponTrack is provided by the chain that implements IAutoMovieMotionHumanFirearm.
   */
  weaponTrack(params: IAutoMovieMotionHumanFirearm.IWeaponTrack, anchor?: string): Chain;
}

/**
 * The parameter types of the Firearm methods.
 */
export namespace IAutoMovieMotionHumanFirearm {
  /**
   * The parameters of `weaponTrack`: the law's own `IAutoMovieMotionHumanWeaponTrack.IParams`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanWeaponTrack` owns the type; the alias serves this family's `weaponTrack` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `weaponTrack` takes the type its law reads.
   */
  export type IWeaponTrack = IAutoMovieMotionHumanWeaponTrack.IParams;
}
