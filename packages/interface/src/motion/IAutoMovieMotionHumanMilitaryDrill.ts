import type { IAutoMovieMotionHumanPickUp } from "./IAutoMovieMotionHumanPickUp";
import type { IAutoMovieMotionHumanWeaponPresent } from "./IAutoMovieMotionHumanWeaponPresent";
import type { IAutoMovieMotionHumanKick } from "./IAutoMovieMotionHumanKick";
import type { IAutoMovieMotionHumanPunch } from "./IAutoMovieMotionHumanPunch";
import type { IAutoMovieMotionHumanGaitStyled } from "./IAutoMovieMotionHumanGaitStyled";
import type { IAutoMovieMotionHumanGesture } from "./IAutoMovieMotionHumanGesture";
import type { IAutoMovieMotionHumanTouch } from "./IAutoMovieMotionHumanTouch";

/**
 * Military drill: the Gait family's `march` and `doubleTime` at the
 * regulation's cadence and step (`HUMAN_DRILL_CADENCES`; US Army TC 3-21.5:
 * quick time 120 steps a minute and double time 180, on a 0.762 m step), with
 * the drill, gun drill, musket drill and gun crew rows on
 * `AutoMovieMotionHumanMilitaryDrill` (`HumanDrill`, `HumanGunDrill`,
 * `HumanMusketDrill`, `HumanGunCrew`). The drill adds no method of its own.
 *
 * The presets are the constants of `AutoMovieMotionHumanMilitaryDrill` that the
 * rows of `HumanDrill`, `HumanGunDrill` and `HumanMusketDrill` read; each names
 * the members of its law that the row fixes, and `HUMAN_DRILL_CADENCES` stays
 * the one home of the cadences.
 *
 * @template Chain The chain every method returns; the chain implements this
 *   interface.
 */
export interface IAutoMovieMotionHumanMilitaryDrill<
  Chain,
> extends IAutoMovieMotionHumanGaitStyled<Chain> {}

/** The preset types of the drill rows. */
export namespace IAutoMovieMotionHumanMilitaryDrill {
  /**
   * The punch the `HOOK` and `UPPERCUT` presets fix: the technique and the hand
   * that throws it.
   */
  export type IPunchPreset = Pick<
    IAutoMovieMotionHumanPunch.IParams,
    "technique" | "hand"
  >;

  /**
   * The kick the `FRONT_KICK` preset fixes: the technique and the leg that
   * throws it.
   */
  export type IKickPreset = Pick<
    IAutoMovieMotionHumanKick.IParams,
    "technique" | "leg"
  >;

  /** The gesture the `AIM` preset fixes: the point held for a time. */
  export type IAimPreset = Pick<
    IAutoMovieMotionHumanGesture.IParams,
    "kind" | "hold"
  >;

  /**
   * The grip the `TAKE_FIRELOCK` and `SEIZE` presets fix: the part of the
   * musket taken and the hand that takes it.
   */
  export type IFirelockGripPreset = Pick<
    IAutoMovieMotionHumanPickUp.IParams,
    "handle" | "hand"
  >;

  /**
   * The presentation the `SHOULDER_ARMS` preset fixes: the carriage, the hand
   * and the number of hands.
   */
  export type IShoulderArmsPreset = Pick<
    IAutoMovieMotionHumanWeaponPresent.IPresent,
    "carriage" | "hand" | "hands"
  >;

  /**
   * The touch the `BITE_CARTRIDGE` preset fixes: the mouth as the target and
   * the end of the cartridge as the point.
   */
  export type IBiteCartridgePreset = Pick<
    IAutoMovieMotionHumanTouch.IParams,
    "target" | "point"
  >;

  /** The touch the `COVER_VENT` preset fixes: the fingertips held on the vent. */
  export type ICoverVentPreset = Pick<
    IAutoMovieMotionHumanTouch.IParams,
    "effector" | "kind"
  >;
}
