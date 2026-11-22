import type { IAutoMovieMotionHumanGesture } from "../everyday/IAutoMovieMotionHumanGesture";
import type { IAutoMovieMotionHumanTouch } from "../touch/IAutoMovieMotionHumanTouch";
import type { IAutoMovieMotionHumanWeaponPresent } from "./IAutoMovieMotionHumanWeaponPresent";

/**
 * Open parameters of the firearm lexicon family, keyed by each runtime export name.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each row describes the performed act; its parameter expression identifies the underlying contract and every fixed key.
 * @evidence contracts/development/design.md#principled-representation The firearm family is a closed export-name map with the exact Omit projection of each source law.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This interface owns the firearm row parameter map used by the family registry and schema generator.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Parameter types refer to canonical action contracts and never infer from runtime law values.
 */
export interface IAutoMovieMotionHumanLexiconFirearmParams {
  /** Reach for a holster at the right hip. */
  reachHolster: Omit<
    IAutoMovieMotionHumanTouch.IParams,
    "target" | "with" | "kind" | "side" | "hold"
  >;

  /** Level the weapon at the target and hold the aim. */
  takeAim: Omit<IAutoMovieMotionHumanWeaponPresent.IPresent, "carriage">;

  /** Low ready: the weapon before the body, the muzzle down ahead. */
  lowReady: Omit<IAutoMovieMotionHumanWeaponPresent.IPresent, "carriage">;

  /** High ready: the weapon before the chest, the muzzle up. */
  highReady: Omit<IAutoMovieMotionHumanWeaponPresent.IPresent, "carriage">;

  /** One shot: the trigger's press, the muzzle's rise and its return. */
  recoil: IAutoMovieMotionHumanWeaponPresent.IWield;

  /** Hands up at gunpoint. */
  surrender: Omit<IAutoMovieMotionHumanGesture.IParams, "kind" | "hold">;
}
