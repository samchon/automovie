import type { IAutoMovieMotionHumanPickUp } from "../handling/IAutoMovieMotionHumanPickUp";
import type { IAutoMovieMotionHumanWeaponPresent } from "../lexicon/IAutoMovieMotionHumanWeaponPresent";
import type { IAutoMovieMotionHumanKick } from "../striking/IAutoMovieMotionHumanKick";
import type { IAutoMovieMotionHumanPunch } from "../striking/IAutoMovieMotionHumanPunch";
import type { IAutoMovieMotionHumanGaitStyled } from "./IAutoMovieMotionHumanGaitStyled";
import type { IAutoMovieMotionHumanGesture } from "./IAutoMovieMotionHumanGesture";
import type { IAutoMovieMotionHumanTouch } from "./IAutoMovieMotionHumanTouch";

/**
 * Military drill: the Gait family's `march` and `doubleTime` at the regulation's cadence and step (`HUMAN_DRILL_CADENCES`; US Army TC 3-21.5: quick time 120 steps a minute and double time 180, on a 0.762 m step), with the drill, gun drill, musket drill and gun crew rows on `AutoMovieMotionHumanMilitaryDrill` (`HumanDrill`, `HumanGunDrill`, `HumanMusketDrill`, `HumanGunCrew`). The drill adds no method of its own.
 *
 * The presets are the constants of `AutoMovieMotionHumanMilitaryDrill` that the rows of `HumanDrill`, `HumanGunDrill` and `HumanMusketDrill` read; each names the members of its law that the row fixes, and `HUMAN_DRILL_CADENCES` stays the one home of the cadences.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the gaits drill marches with, the cadences and step with their source, the drill rows on the runtime namespace and the preset constants.
 * @evidence contracts/development/design.md#principled-representation The drill's vocabulary is the styled gaits, extended rather than redeclared, so the march keeps one method.
 * @evidence contracts/development/design.md#minimal-and-owned-surface No method the Gait family owns; the drill rows and presets are runtime data.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the march and double time are not declared a second time.
 */
export interface IAutoMovieMotionHumanMilitaryDrill<
  Chain,
> extends IAutoMovieMotionHumanGaitStyled<Chain> {}

/**
 * The preset types of the drill rows.
 */
export namespace IAutoMovieMotionHumanMilitaryDrill {
  /**
   * The punch the `HOOK` and `UPPERCUT` presets fix: the technique and the hand that throws it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the members of `IAutoMovieMotionHumanPunch.IParams` that the rows reading it fix, with the values each preset gives them.
   * @evidence contracts/development/design.md#principled-representation The fixed members are those of `IAutoMovieMotionHumanPunch.IParams` with its own units, frames and invariants; the values are the preset constants'.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanPunch.IParams` owns the members; this alias types the family's preset constants so no preset is written inline.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast.
   */
  export type IPunchPreset = Pick<
    IAutoMovieMotionHumanPunch.IParams,
    "technique" | "hand"
  >;

  /**
   * The kick the `FRONT_KICK` preset fixes: the technique and the leg that throws it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the members of `IAutoMovieMotionHumanKick.IParams` that the rows reading it fix, with the values each preset gives them.
   * @evidence contracts/development/design.md#principled-representation The fixed members are those of `IAutoMovieMotionHumanKick.IParams` with its own units, frames and invariants; the values are the preset constants'.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanKick.IParams` owns the members; this alias types the family's preset constants so no preset is written inline.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast.
   */
  export type IKickPreset = Pick<
    IAutoMovieMotionHumanKick.IParams,
    "technique" | "leg"
  >;

  /**
   * The gesture the `AIM` preset fixes: the point held for a time.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the members of `IAutoMovieMotionHumanGesture.IParams` that the rows reading it fix, with the values each preset gives them.
   * @evidence contracts/development/design.md#principled-representation The fixed members are those of `IAutoMovieMotionHumanGesture.IParams` with its own units, frames and invariants; the values are the preset constants'.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanGesture.IParams` owns the members; this alias types the family's preset constants so no preset is written inline.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast.
   */
  export type IAimPreset = Pick<
    IAutoMovieMotionHumanGesture.IParams,
    "kind" | "hold"
  >;

  /**
   * The grip the `TAKE_FIRELOCK` and `SEIZE` presets fix: the part of the musket taken and the hand that takes it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the members of `IAutoMovieMotionHumanPickUp.IParams` that the rows reading it fix, with the values each preset gives them.
   * @evidence contracts/development/design.md#principled-representation The fixed members are those of `IAutoMovieMotionHumanPickUp.IParams` with its own units, frames and invariants; the values are the preset constants'.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanPickUp.IParams` owns the members; this alias types the family's preset constants so no preset is written inline.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast.
   */
  export type IFirelockGripPreset = Pick<
    IAutoMovieMotionHumanPickUp.IParams,
    "handle" | "hand"
  >;

  /**
   * The presentation the `SHOULDER_ARMS` preset fixes: the carriage, the hand and the number of hands.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the members of `IAutoMovieMotionHumanWeaponPresent.IPresent` that the rows reading it fix, with the values each preset gives them.
   * @evidence contracts/development/design.md#principled-representation The fixed members are those of `IAutoMovieMotionHumanWeaponPresent.IPresent` with its own units, frames and invariants; the values are the preset constants'.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanWeaponPresent.IPresent` owns the members; this alias types the family's preset constants so no preset is written inline.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast.
   */
  export type IShoulderArmsPreset = Pick<
    IAutoMovieMotionHumanWeaponPresent.IPresent,
    "carriage" | "hand" | "hands"
  >;

  /**
   * The touch the `BITE_CARTRIDGE` preset fixes: the mouth as the target and the end of the cartridge as the point.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the members of `IAutoMovieMotionHumanTouch.IParams` that the rows reading it fix, with the values each preset gives them.
   * @evidence contracts/development/design.md#principled-representation The fixed members are those of `IAutoMovieMotionHumanTouch.IParams` with its own units, frames and invariants; the values are the preset constants'.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanTouch.IParams` owns the members; this alias types the family's preset constants so no preset is written inline.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast.
   */
  export type IBiteCartridgePreset = Pick<
    IAutoMovieMotionHumanTouch.IParams,
    "target" | "point"
  >;

  /**
   * The touch the `COVER_VENT` preset fixes: the fingertips held on the vent.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the members of `IAutoMovieMotionHumanTouch.IParams` that the rows reading it fix, with the values each preset gives them.
   * @evidence contracts/development/design.md#principled-representation The fixed members are those of `IAutoMovieMotionHumanTouch.IParams` with its own units, frames and invariants; the values are the preset constants'.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanTouch.IParams` owns the members; this alias types the family's preset constants so no preset is written inline.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast.
   */
  export type ICoverVentPreset = Pick<
    IAutoMovieMotionHumanTouch.IParams,
    "effector" | "kind"
  >;
}
