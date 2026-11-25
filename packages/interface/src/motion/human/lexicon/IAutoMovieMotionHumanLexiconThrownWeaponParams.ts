import type { IAutoMovieMotionHumanThrowObjectParams } from "../throwing/IAutoMovieMotionHumanThrowObjectParams";

/**
 * Open parameters of the thrownWeapon lexicon family, keyed by each runtime
 * export name: the thrown weapons.
 */
export interface IAutoMovieMotionHumanLexiconThrownWeaponParams {
  /** A javelin thrown overarm, its shaft along its flight. */
  throwJavelin: Omit<
    IAutoMovieMotionHumanThrowObjectParams,
    "style" | "angle" | "attitude"
  >;

  /** A spear thrown overarm, its shaft along its flight. */
  throwSpear: Omit<
    IAutoMovieMotionHumanThrowObjectParams,
    "style" | "angle" | "attitude"
  >;

  /** A knife thrown overarm, spinning whole half turns to the target. */
  throwKnife: Omit<
    IAutoMovieMotionHumanThrowObjectParams,
    "style" | "attitude"
  >;

  /** A grenade lobbed overarm. */
  throwGrenade: Omit<IAutoMovieMotionHumanThrowObjectParams, "style">;

  /** A stone hurled overarm. */
  hurlStone: Omit<IAutoMovieMotionHumanThrowObjectParams, "style">;

  /** A bottle hurled overarm. */
  hurlBottle: Omit<IAutoMovieMotionHumanThrowObjectParams, "style">;

  /** A stone slung from the sling the composition names. */
  sling: Omit<IAutoMovieMotionHumanThrowObjectParams, "style">;

  /** A dart cast with the atlatl the composition names. */
  castAtlatl: Omit<IAutoMovieMotionHumanThrowObjectParams, "style">;
}
