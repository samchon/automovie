import type { IAutoMovieMotionHumanGesture } from "../next/IAutoMovieMotionHumanGesture";
import type { IAutoMovieMotionHumanTouch } from "../next/IAutoMovieMotionHumanTouch";
import type { IAutoMovieMotionHumanWeaponPresent } from "./IAutoMovieMotionHumanWeaponPresent";

/**
 * Open parameters of the firearm lexicon family, keyed by each runtime export
 * name.
 */
export interface IAutoMovieMotionHumanLexiconFirearmParams {
  /** Reach for a holster at the right hip. */
  reachHolster: Omit<
    IAutoMovieMotionHumanTouch.IParams,
    "target" | "effector" | "kind" | "hand" | "hold"
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
