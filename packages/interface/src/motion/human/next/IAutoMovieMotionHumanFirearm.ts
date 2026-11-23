import type { IAutoMovieMotionHumanPickUp } from "../handling/IAutoMovieMotionHumanPickUp";
import type { IAutoMovieMotionHumanPutDown } from "../handling/IAutoMovieMotionHumanPutDown";
import type { IAutoMovieMotionHumanWeaponPresent } from "../lexicon/IAutoMovieMotionHumanWeaponPresent";
import type { IAutoMovieMotionHumanWeaponTrack } from "../lexicon/IAutoMovieMotionHumanWeaponTrack";
import type { IAutoMovieMotionHumanGesture } from "./IAutoMovieMotionHumanGesture";
import type { IAutoMovieMotionHumanTouch } from "./IAutoMovieMotionHumanTouch";

/**
 * Handling a firearm with the weapon as the effector: drawing it, presenting it to an aim or a ready position, firing a shot, tracking a moving target and holstering it.
 *
 * The firearm is a prop the hand holds (a handgun or a long gun, taken by its `grip`); presenting and firing read the gun's `muzzle` and `sight` and aim from the eye (a handgun) or the cheek (a long gun) unless the call names another tip, edge or anchor. A shot is three actions in a chain: `drawFirearm`, `presentFirearm` and `fireFirearm`. Presenting takes 0.9 s at novice to 0.5 s at elite and a shot 0.42 s (press 0.1, rise 0.07, return 0.25), all provisional.
 *
 * The presets are the constants of `AutoMovieMotionHumanFirearm` that the film rows read: `REACH_HOLSTER` (the right palm held on the hip for 0.3 s), `SURRENDER` (the hands raised for 2 s) and `DRAW` (the grip taken and the weapon lifted 0.15 m clear with its bore continuing the forearm).
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the effector, how the firearm is given, how a shot is composed and the preset constants.
 * @evidence contracts/development/design.md#principled-representation One method per law of the family, each taking the law's own parameter type, and one named type per narrowing or preset.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The family's laws and presets and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law or a named narrowing of it; nothing is redefined.
 */
export interface IAutoMovieMotionHumanFirearm<Chain> {
  /**
   * Tracking: a presented firearm kept on a target that moves (#3348).
   *
   * @param params The `target` and `track` of `IAutoMovieMotionHumanWeaponTrack.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanFirearm.weaponTrack is provided by the chain that implements IAutoMovieMotionHumanFirearm.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanFirearm.weaponTrack is provided by the chain that implements IAutoMovieMotionHumanFirearm.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanFirearm.weaponTrack is provided by the chain that implements IAutoMovieMotionHumanFirearm.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanFirearm.weaponTrack is provided by the chain that implements IAutoMovieMotionHumanFirearm.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanFirearm.weaponTrack is provided by the chain that implements IAutoMovieMotionHumanFirearm.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanFirearm.weaponTrack is provided by the chain that implements IAutoMovieMotionHumanFirearm.
   */
  weaponTrack(
    params: IAutoMovieMotionHumanWeaponTrack.IParams,
    anchor?: string,
  ): Chain;

  /**
   * Present the firearm: the muzzle brought onto the line from the eye or the cheek to the target, or to a ready position, and held.
   *
   * @param params The members of `IAutoMovieMotionHumanWeaponPresent.IPresent`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanFirearm.presentFirearm is provided by the chain that implements IAutoMovieMotionHumanFirearm.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanFirearm.presentFirearm is provided by the chain that implements IAutoMovieMotionHumanFirearm.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanFirearm.presentFirearm is provided by the chain that implements IAutoMovieMotionHumanFirearm.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanFirearm.presentFirearm is provided by the chain that implements IAutoMovieMotionHumanFirearm.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanFirearm.presentFirearm is provided by the chain that implements IAutoMovieMotionHumanFirearm.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanFirearm.presentFirearm is provided by the chain that implements IAutoMovieMotionHumanFirearm.
   */
  presentFirearm(
    params: IAutoMovieMotionHumanWeaponPresent.IPresent,
    anchor?: string,
  ): Chain;

  /**
   * Fire one shot: the trigger pressed, the muzzle risen about the hand and returned onto the line.
   *
   * @param params The members of `IAutoMovieMotionHumanWeaponPresent.IWield`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanFirearm.fireFirearm is provided by the chain that implements IAutoMovieMotionHumanFirearm.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanFirearm.fireFirearm is provided by the chain that implements IAutoMovieMotionHumanFirearm.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanFirearm.fireFirearm is provided by the chain that implements IAutoMovieMotionHumanFirearm.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanFirearm.fireFirearm is provided by the chain that implements IAutoMovieMotionHumanFirearm.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanFirearm.fireFirearm is provided by the chain that implements IAutoMovieMotionHumanFirearm.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanFirearm.fireFirearm is provided by the chain that implements IAutoMovieMotionHumanFirearm.
   */
  fireFirearm(
    params: IAutoMovieMotionHumanWeaponPresent.IWield,
    anchor?: string,
  ): Chain;

  /**
   * Draw: take the holstered firearm by its grip and lift it clear.
   *
   * @param params The members of `IAutoMovieMotionHumanPickUp.IParams` except the handle, the lift and the use, which the law fixes.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanFirearm.drawFirearm is provided by the chain that implements IAutoMovieMotionHumanFirearm.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanFirearm.drawFirearm is provided by the chain that implements IAutoMovieMotionHumanFirearm.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanFirearm.drawFirearm is provided by the chain that implements IAutoMovieMotionHumanFirearm.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanFirearm.drawFirearm is provided by the chain that implements IAutoMovieMotionHumanFirearm.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanFirearm.drawFirearm is provided by the chain that implements IAutoMovieMotionHumanFirearm.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanFirearm.drawFirearm is provided by the chain that implements IAutoMovieMotionHumanFirearm.
   */
  drawFirearm(
    params: IAutoMovieMotionHumanFirearm.IDrawFirearm,
    anchor?: string,
  ): Chain;

  /**
   * Holster: put the firearm back where the holster holds it.
   *
   * @param params The members of `IAutoMovieMotionHumanPutDown.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanFirearm.holsterFirearm is provided by the chain that implements IAutoMovieMotionHumanFirearm.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanFirearm.holsterFirearm is provided by the chain that implements IAutoMovieMotionHumanFirearm.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanFirearm.holsterFirearm is provided by the chain that implements IAutoMovieMotionHumanFirearm.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanFirearm.holsterFirearm is provided by the chain that implements IAutoMovieMotionHumanFirearm.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanFirearm.holsterFirearm is provided by the chain that implements IAutoMovieMotionHumanFirearm.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanFirearm.holsterFirearm is provided by the chain that implements IAutoMovieMotionHumanFirearm.
   */
  holsterFirearm(
    params: IAutoMovieMotionHumanPutDown.IParams,
    anchor?: string,
  ): Chain;
}

/**
 * The parameter and preset types of the family's methods.
 */
export namespace IAutoMovieMotionHumanFirearm {
  /**
   * The parameters of `drawFirearm`: the pick up without the handle, the lift and the use that the draw fixes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises, the type it narrows and the members that narrowing removes.
   * @evidence contracts/development/design.md#principled-representation A named narrowing of `IAutoMovieMotionHumanPickUp.IParams`: every member kept has the units, frames, defaults and invariants that type states.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanPickUp.IParams` owns the members; this alias names the narrowing so no signature writes it inline.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast.
   */
  export type IDrawFirearm = Omit<
    IAutoMovieMotionHumanPickUp.IParams,
    "handle" | "lift" | "use"
  >;

  /**
   * The touch the `REACH_HOLSTER` preset fixes: the right palm held on the right hip for 0.3 s.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the members of `IAutoMovieMotionHumanTouch.IParams` that the rows reading it fix, with the values each preset gives them.
   * @evidence contracts/development/design.md#principled-representation The fixed members are those of `IAutoMovieMotionHumanTouch.IParams` with its own units, frames and invariants; the values are the preset constants'.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanTouch.IParams` owns the members; this alias types the family's preset constants so no preset is written inline.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast.
   */
  export type IReachHolsterPreset = Pick<
    IAutoMovieMotionHumanTouch.IParams,
    "target" | "effector" | "kind" | "hand" | "hold"
  >;

  /**
   * The gesture the `SURRENDER` preset fixes: the cheer held for 2 s with the hands raised.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the members of `IAutoMovieMotionHumanGesture.IParams` that the rows reading it fix, with the values each preset gives them.
   * @evidence contracts/development/design.md#principled-representation The fixed members are those of `IAutoMovieMotionHumanGesture.IParams` with its own units, frames and invariants; the values are the preset constants'.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanGesture.IParams` owns the members; this alias types the family's preset constants so no preset is written inline.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast.
   */
  export type ISurrenderPreset = Pick<
    IAutoMovieMotionHumanGesture.IParams,
    "kind" | "hold"
  >;

  /**
   * The pick up the `DRAW` preset fixes: the grip, a lift of 0.15 m and the bore continuing the forearm.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the members of `IAutoMovieMotionHumanPickUp.IParams` that the rows reading it fix, with the values each preset gives them.
   * @evidence contracts/development/design.md#principled-representation The fixed members are those of `IAutoMovieMotionHumanPickUp.IParams` with its own units, frames and invariants; the values are the preset constants'.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanPickUp.IParams` owns the members; this alias types the family's preset constants so no preset is written inline.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast.
   */
  export type IDrawPreset = Pick<
    IAutoMovieMotionHumanPickUp.IParams,
    "handle" | "lift" | "use"
  >;
}
