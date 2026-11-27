import type { IAutoMovieMotionHumanPickUp } from "./IAutoMovieMotionHumanPickUp";
import type { IAutoMovieMotionHumanPutDown } from "./IAutoMovieMotionHumanPutDown";
import type { IAutoMovieMotionHumanOperate } from "./IAutoMovieMotionHumanOperate";
import type { IAutoMovieMotionHumanTouch } from "./IAutoMovieMotionHumanTouch";
import type { IAutoMovieMotionHumanWeaponPresent } from "./IAutoMovieMotionHumanWeaponPresent";

/**
 * Open parameters of the musketDrill lexicon family, keyed by each runtime
 * export name: the 1764 Manual Exercise's musket drill.
 */
export interface IAutoMovieMotionHumanLexiconMusketDrillParams {
  /** Take the firelock by its butt in the left hand. */
  takeFirelock: Omit<IAutoMovieMotionHumanPickUp.IParams, "handle" | "hand">;

  /** Shoulder arms: the firelock carried shouldered in the left hand. */
  shoulderArms: Omit<
    IAutoMovieMotionHumanWeaponPresent.IPresent,
    "carriage" | "hand" | "hands"
  >;

  /** Order arms: set the butt down by the foot. */
  orderArms: IAutoMovieMotionHumanPutDown.IParams;

  /** Handle cartridge: take one from the pouch. */
  handleCartridge: Omit<IAutoMovieMotionHumanPickUp.IParams, "handle">;

  /** Bite the cartridge: its end brought to the mouth. */
  biteCartridge: Omit<IAutoMovieMotionHumanTouch.IParams, "target" | "point">;

  /** Prime: the cartridge brought to the pan. */
  prime: IAutoMovieMotionHumanTouch.IParams;

  /** Shut the pan: the frizzen closed. */
  shutPan: IAutoMovieMotionHumanOperate.IParams;

  /** Cast about: the musket brought before the body, the muzzle up. */
  castAbout: Omit<IAutoMovieMotionHumanWeaponPresent.IPresent, "carriage">;

  /** Charge with cartridge: the cartridge set into the muzzle. */
  charge: IAutoMovieMotionHumanPutDown.IParams;

  /** Draw the rammer from its pipe. */
  drawRammer: IAutoMovieMotionHumanOperate.IParams;

  /** Ram down the cartridge: the rod inserted into the bore and withdrawn. */
  ramDown: IAutoMovieMotionHumanOperate.IParams;

  /** Return the rammer to its pipe. */
  returnRammer: IAutoMovieMotionHumanPutDown.IParams;

  /** Seize: the right hand on the small of the stock. */
  seize: Omit<IAutoMovieMotionHumanPickUp.IParams, "handle" | "hand">;

  /** Recover: the firelock upright before the body, its butt at the left breast. */
  recover: Omit<IAutoMovieMotionHumanWeaponPresent.IPresent, "carriage">;

  /** Make ready: the cock drawn to full cock. */
  makeReady: IAutoMovieMotionHumanOperate.IParams;

  /** Present: the musket to the cheek on the line. */
  presentMusket: IAutoMovieMotionHumanWeaponPresent.IPresent;

  /** Fire: the trigger pulled, the lock falling. */
  fireMusket: IAutoMovieMotionHumanWeaponPresent.IWield;
}
