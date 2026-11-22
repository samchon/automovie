import type { IAutoMovieMotionHumanWalkParams } from "../actions/IAutoMovieMotionHumanWalkParams";
import type { IAutoMovieMotionHumanOperate } from "../affordance/IAutoMovieMotionHumanOperate";
import type { IAutoMovieMotionHumanHandoverAction } from "../handling/IAutoMovieMotionHumanHandoverAction";
import type { IAutoMovieMotionHumanPutDown } from "../handling/IAutoMovieMotionHumanPutDown";
import type { IAutoMovieMotionHumanTouch } from "../touch/IAutoMovieMotionHumanTouch";

/**
 * Open parameters of the gunDrill lexicon family, keyed by each runtime export name: a field gun crew's duties of #3489.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each row describes the performed act; its parameter expression identifies the underlying contract and every fixed key.
 * @evidence contracts/development/design.md#principled-representation The gunDrill family is a closed export-name map with the exact Omit projection of each source law.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This interface owns the gunDrill row parameter map used by the family registry and schema generator.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Parameter types refer to canonical action contracts and never infer from runtime law values.
 */
export interface IAutoMovieMotionHumanLexiconGunDrillParams {
  /** Cover the vent with the fingertips. */
  coverVent: Omit<IAutoMovieMotionHumanTouch.IParams, "with" | "kind">;

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
