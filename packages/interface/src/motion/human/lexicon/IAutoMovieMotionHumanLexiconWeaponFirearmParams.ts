import type { IAutoMovieMotionHumanPickUp } from "../handling/IAutoMovieMotionHumanPickUp";
import type { IAutoMovieMotionHumanPutDown } from "../handling/IAutoMovieMotionHumanPutDown";
import type { IAutoMovieMotionHumanWeaponPresent } from "./IAutoMovieMotionHumanWeaponPresent";

/**
 * Open parameters of the weaponFirearm lexicon family, keyed by each runtime export name.
 * Omitted keys are fixed by the row before its underlying law plans; the remaining members retain that law's defaults, units and required status.
 * HumanPerformanceParams checks these open inputs using the generated row schema before HumanActionRow resolves fixed values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each row describes the performed act; its parameter expression identifies the underlying contract and every fixed key.
 * @evidence contracts/development/design.md#principled-representation The weaponFirearm family is a closed export-name map with the exact Omit projection of each source law.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This interface owns the weaponFirearm row parameter map used by the family registry and schema generator.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Parameter types refer to canonical action contracts and never infer from runtime law values.
 */
export interface IAutoMovieMotionHumanLexiconWeaponFirearmParams {
  /** Present a firearm: `HumanWeaponPresent.present` under its firearm name. */
  present: IAutoMovieMotionHumanWeaponPresent.IPresent;

  /** Fire one shot: `HumanWeaponPresent.fire` under its firearm name. */
  fire: IAutoMovieMotionHumanWeaponPresent.IWield;

  /** Draw: take the holstered firearm by its grip, the bore continuing the forearm, and lift it clear. The composition gives the firearm (`prop`). */
  draw: Omit<IAutoMovieMotionHumanPickUp.IParams, "handle" | "lift" | "use">;

  /** Holster: put the firearm back where the composition says its holster holds it (`prop` and `at`). */
  holster: IAutoMovieMotionHumanPutDown.IParams;
}
