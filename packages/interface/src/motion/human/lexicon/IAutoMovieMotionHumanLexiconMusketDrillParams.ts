import type { IAutoMovieMotionHumanOperate } from "../affordance/IAutoMovieMotionHumanOperate";
import type { IAutoMovieMotionHumanPickUp } from "../handling/IAutoMovieMotionHumanPickUp";
import type { IAutoMovieMotionHumanPutDown } from "../handling/IAutoMovieMotionHumanPutDown";
import type { IAutoMovieMotionHumanTouch } from "../touch/IAutoMovieMotionHumanTouch";
import type { IAutoMovieMotionHumanWeaponPresent } from "./IAutoMovieMotionHumanWeaponPresent";

/**
 * Open parameters of the musketDrill lexicon family, keyed by each runtime export name: the 1764 Manual Exercise's musket drill of #3488.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each row describes the performed act; its parameter expression identifies the underlying contract and every fixed key.
 * @evidence contracts/development/design.md#principled-representation The musketDrill family is a closed export-name map with the exact Omit projection of each source law.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This interface owns the musketDrill row parameter map used by the family registry and schema generator.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Parameter types refer to canonical action contracts and never infer from runtime law values.
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
