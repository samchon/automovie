import type { IAutoMovieMotionHumanPickUp } from "./IAutoMovieMotionHumanPickUp";
import type { IAutoMovieMotionHumanPutDown } from "./IAutoMovieMotionHumanPutDown";
import type { IAutoMovieMotionHumanWeaponPresent } from "./IAutoMovieMotionHumanWeaponPresent";

/**
 * Open parameters of the weaponFirearm lexicon family, keyed by each runtime
 * export name.
 */
export interface IAutoMovieMotionHumanLexiconWeaponFirearmParams {
  /** Present a firearm: `HumanWeaponPresent.present` under its firearm name. */
  present: IAutoMovieMotionHumanWeaponPresent.IPresent;

  /** Fire one shot: `HumanWeaponPresent.fire` under its firearm name. */
  fire: IAutoMovieMotionHumanWeaponPresent.IWield;

  /**
   * Draw: take the holstered firearm by its grip, the bore continuing the
   * forearm, and lift it clear. The composition gives the firearm (`prop`).
   */
  draw: Omit<IAutoMovieMotionHumanPickUp.IParams, "handle" | "lift" | "use">;

  /**
   * Holster: put the firearm back where the composition says its holster holds
   * it (`prop` and `at`).
   */
  holster: IAutoMovieMotionHumanPutDown.IParams;
}
