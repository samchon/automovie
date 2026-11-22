import type { IAutoMovieMotionHumanTouch } from "../next/IAutoMovieMotionHumanTouch";
import type { IAutoMovieMotionHumanSword } from "./IAutoMovieMotionHumanSword";

/**
 * Open parameters of the weaponMelee lexicon family, keyed by each runtime export name.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each row describes the performed act; its parameter expression identifies the underlying contract and every fixed key.
 * @evidence contracts/development/design.md#principled-representation The weaponMelee family is a closed export-name map with the exact Omit projection of each source law.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This interface owns the weaponMelee row parameter map used by the family registry and schema generator.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Parameter types refer to canonical action contracts and never infer from runtime law values.
 */
export interface IAutoMovieMotionHumanLexiconWeaponMeleeParams {
  /** A club or a bat swung level at a person or a thing. */
  clubSwing: Omit<IAutoMovieMotionHumanSword.ICut, "from" | "tip">;

  /** A club or a baton brought down from overhead. */
  clubStrike: Omit<IAutoMovieMotionHumanSword.ICut, "from" | "tip">;

  /** A knife slashed across from the knife hand's side. */
  knifeSlash: Omit<IAutoMovieMotionHumanSword.ICut, "from">;

  /** A knife slashed back across from the off side. */
  knifeBackslash: Omit<IAutoMovieMotionHumanSword.ICut, "from">;

  /** A knife driven forward, the point first, with the least advance that reaches. */
  knifeStab: IAutoMovieMotionHumanSword.IAttack;

  /** A knife held point down (taken by its `reverseGrip`) and driven down from overhead. */
  stabOverhand: Omit<IAutoMovieMotionHumanSword.ICut, "from">;

  /** A reload: the support hand's palm pressed once to the magazine well the composition names. */
  reload: Omit<
    IAutoMovieMotionHumanTouch.IParams,
    "effector" | "kind" | "count" | "hand"
  >;
}
