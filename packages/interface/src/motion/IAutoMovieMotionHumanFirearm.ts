import type { IAutoMovieMotionHumanPickUp } from "./IAutoMovieMotionHumanPickUp";
import type { IAutoMovieMotionHumanPutDown } from "./IAutoMovieMotionHumanPutDown";
import type { IAutoMovieMotionHumanWeaponPresent } from "./IAutoMovieMotionHumanWeaponPresent";
import type { IAutoMovieMotionHumanWeaponTrack } from "./IAutoMovieMotionHumanWeaponTrack";
import type { IAutoMovieMotionHumanGesture } from "./IAutoMovieMotionHumanGesture";
import type { IAutoMovieMotionHumanTouch } from "./IAutoMovieMotionHumanTouch";

/**
 * Handling a firearm with the weapon as the effector: drawing it, presenting it
 * to an aim or a ready position, firing a shot, tracking a moving target and
 * holstering it.
 *
 * The firearm is a prop the hand holds (a handgun or a long gun, taken by its
 * `grip`); presenting and firing read the gun's `muzzle` and `sight` and aim
 * from the eye (a handgun) or the cheek (a long gun) unless the call names
 * another tip, edge or anchor. A shot is three actions in a chain:
 * `drawFirearm`, `presentFirearm` and `fireFirearm`. Presenting takes 0.9 s at
 * novice to 0.5 s at elite and a shot 0.42 s (press 0.1, rise 0.07, return
 * 0.25), all provisional.
 *
 * The presets are the constants of `AutoMovieMotionHumanFirearm` that the film
 * rows read: `REACH_HOLSTER` (the right palm held on the hip for 0.3 s),
 * `SURRENDER` (the hands raised for 2 s) and `DRAW` (the grip taken and the
 * weapon lifted 0.15 m clear with its bore continuing the forearm).
 *
 * A method here is a method of `HumanChain` when its name is in
 * `AutoMovieMotionHumanActionName`. Any other member is a registered law or
 * row: pass it in `laws: [...]` to the performance, taking it from
 * `AutoMovieMotionHumanFirearm` or from the row namespace of the family, and
 * append it with `chain.registered("<name>", params)`. A member that is a
 * function, a reader or a layer says so in its own comment.
 *
 * @template Chain The chain every method returns; the chain implements this
 *   interface.
 */
export interface IAutoMovieMotionHumanFirearm<Chain> {
  /**
   * Tracking: a presented firearm kept on a target that moves.
   *
   * Registered law: `registered("weaponTrack", params)`; not a chain method.
   *
   * @param params The `target` and `track` of
   *   `IAutoMovieMotionHumanWeaponTrack.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  weaponTrack(
    params: IAutoMovieMotionHumanWeaponTrack.IParams,
    anchor?: string,
  ): Chain;

  /**
   * Present the firearm: the muzzle brought onto the line from the eye or the
   * cheek to the target, or to a ready position, and held.
   *
   * Registered law: `registered("presentFirearm", params)`; not a chain method.
   *
   * Overlay law: it rides a carrier that yields the channels it claims. It
   * claims the trunk's turn and the holding arms and hands, over a carrier, a
   * stand, a ride or a stance on a moving floor.
   *
   * @param params The members of `IAutoMovieMotionHumanWeaponPresent.IPresent`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  presentFirearm(
    params: IAutoMovieMotionHumanWeaponPresent.IPresent,
    anchor?: string,
  ): Chain;

  /**
   * Fire one shot: the trigger pressed, the muzzle risen about the hand and
   * returned onto the line.
   *
   * Registered law: `registered("fireFirearm", params)`; not a chain method.
   *
   * Overlay law: it rides a carrier that yields the channels it claims. It
   * claims what `presentFirearm` claims: the trunk's turn and the holding arms
   * and hands.
   *
   * @param params The members of `IAutoMovieMotionHumanWeaponPresent.IWield`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  fireFirearm(
    params: IAutoMovieMotionHumanWeaponPresent.IWield,
    anchor?: string,
  ): Chain;

  /**
   * Draw: take the holstered firearm by its grip and lift it clear.
   *
   * Registered law: `registered("drawFirearm", params)`; not a chain method.
   *
   * @param params The members of `IAutoMovieMotionHumanPickUp.IParams` except
   *   the handle, the lift and the use, which the law fixes.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  drawFirearm(
    params: IAutoMovieMotionHumanFirearm.IDrawFirearm,
    anchor?: string,
  ): Chain;

  /**
   * Holster: put the firearm back where the holster holds it.
   *
   * Registered law: `registered("holsterFirearm", params)`; not a chain method.
   *
   * @param params The members of `IAutoMovieMotionHumanPutDown.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  holsterFirearm(
    params: IAutoMovieMotionHumanPutDown.IParams,
    anchor?: string,
  ): Chain;
}

/** The parameter and preset types of the family's methods. */
export namespace IAutoMovieMotionHumanFirearm {
  /**
   * The parameters of `drawFirearm`: the pick up without the handle, the lift
   * and the use that the draw fixes.
   */
  export type IDrawFirearm = Omit<
    IAutoMovieMotionHumanPickUp.IParams,
    "handle" | "lift" | "use"
  >;

  /**
   * The touch the `REACH_HOLSTER` preset fixes: the right palm held on the
   * right hip for 0.3 s.
   */
  export type IReachHolsterPreset = Pick<
    IAutoMovieMotionHumanTouch.IParams,
    "target" | "effector" | "kind" | "hand" | "hold"
  >;

  /**
   * The gesture the `SURRENDER` preset fixes: the cheer held for 2 s with the
   * hands raised.
   */
  export type ISurrenderPreset = Pick<
    IAutoMovieMotionHumanGesture.IParams,
    "kind" | "hold"
  >;

  /**
   * The pick up the `DRAW` preset fixes: the grip, a lift of 0.15 m and the
   * bore continuing the forearm.
   */
  export type IDrawPreset = Pick<
    IAutoMovieMotionHumanPickUp.IParams,
    "handle" | "lift" | "use"
  >;
}
