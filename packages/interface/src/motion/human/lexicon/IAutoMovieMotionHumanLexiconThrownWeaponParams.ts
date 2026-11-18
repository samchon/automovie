import type { IAutoMovieMotionHumanThrowObjectParams } from "../throwing/IAutoMovieMotionHumanThrowObjectParams";

/**
 * Open parameters of the thrownWeapon lexicon family, keyed by each runtime export name: the thrown weapons of #3490.
 * Omitted keys are fixed by the row before its underlying law plans; the remaining members retain that law's defaults, units and required status.
 * HumanPerformanceParams checks these open inputs using the generated row schema before HumanActionRow resolves fixed values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each row describes the performed act; its parameter expression identifies the underlying contract and every fixed key.
 * @evidence contracts/development/design.md#principled-representation The thrownWeapon family is a closed export-name map with the exact Omit projection of each source law.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This interface owns the thrownWeapon row parameter map used by the family registry and schema generator.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Parameter types refer to canonical action contracts and never infer from runtime law values.
 */
export interface IAutoMovieMotionHumanLexiconThrownWeaponParams {
  /** A javelin thrown overarm, its shaft along its flight. */
  throwJavelin: Omit<IAutoMovieMotionHumanThrowObjectParams, "style" | "angle" | "attitude">;

  /** A spear thrown overarm, its shaft along its flight. */
  throwSpear: Omit<IAutoMovieMotionHumanThrowObjectParams, "style" | "angle" | "attitude">;

  /** A knife thrown overarm, spinning whole half turns to the target. */
  throwKnife: Omit<IAutoMovieMotionHumanThrowObjectParams, "style" | "attitude">;

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