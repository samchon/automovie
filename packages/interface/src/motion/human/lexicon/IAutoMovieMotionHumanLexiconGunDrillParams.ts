import type { IAutoMovieMotionHumanWalkParams } from "../actions/IAutoMovieMotionHumanWalkParams";
import type { IAutoMovieMotionHumanHandoverAction } from "../handling/IAutoMovieMotionHumanHandoverAction";
import type { IAutoMovieMotionHumanPutDown } from "../handling/IAutoMovieMotionHumanPutDown";
import type { IAutoMovieMotionHumanOperate } from "../next/IAutoMovieMotionHumanOperate";
import type { IAutoMovieMotionHumanTouch } from "../next/IAutoMovieMotionHumanTouch";

/**
 * Open parameters of the gunDrill lexicon family, keyed by each runtime export
 * name: a field gun crew's duties.
 */
export interface IAutoMovieMotionHumanLexiconGunDrillParams {
  /** Cover the vent with the fingertips. */
  coverVent: Omit<IAutoMovieMotionHumanTouch.IParams, "effector" | "kind">;

  /** Sponge the bore. */
  spongeBore: IAutoMovieMotionHumanOperate.IParams;

  /** Pass the charge to the loader. */
  passCharge: IAutoMovieMotionHumanHandoverAction.IParams;

  /** Place the charge in the muzzle. */
  loadCharge: IAutoMovieMotionHumanPutDown.IParams;

  /** Ram the charge home. */
  ramCharge: IAutoMovieMotionHumanOperate.IParams;

  /** Prick the cartridge through the vent. */
  prickVent: IAutoMovieMotionHumanOperate.IParams;

  /** Run the gun up into battery. */
  runUp: IAutoMovieMotionHumanOperate.IParams;

  /** Lay the gun by its elevating screw. */
  layGun: IAutoMovieMotionHumanOperate.IParams;

  /** Hook the primer into the vent. */
  hookPrimer: IAutoMovieMotionHumanPutDown.IParams;

  /** Step clear of the wheels and the muzzle. */
  standClear: IAutoMovieMotionHumanWalkParams;

  /** Pull the lanyard. */
  pullLanyard: IAutoMovieMotionHumanOperate.IParams;
}
