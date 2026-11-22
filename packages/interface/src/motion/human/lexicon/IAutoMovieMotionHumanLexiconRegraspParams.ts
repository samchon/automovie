import type { IAutoMovieMotionHumanRegrasp } from "../handling/IAutoMovieMotionHumanRegrasp";

/**
 * Open parameters of the regrasp lexicon family, keyed by each runtime export name.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each row describes the performed act; its parameter expression identifies the underlying contract and every fixed key.
 * @evidence contracts/development/design.md#principled-representation The regrasp family is a closed export-name map with the exact Omit projection of each source law.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This interface owns the regrasp row parameter map used by the family registry and schema generator.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Parameter types refer to canonical action contracts and never infer from runtime law values.
 */
export interface IAutoMovieMotionHumanLexiconRegraspParams {
  /** A key or a cap turned about its own axis by the wrist, the grip held. */
  twist: Omit<IAutoMovieMotionHumanRegrasp.IParams, "kind">;

  /** The object shifted in the still hand to another of its grips. */
  regrip: Omit<IAutoMovieMotionHumanRegrasp.IParams, "kind">;

  /** A small round object rolled across the fingers. */
  roll: Omit<IAutoMovieMotionHumanRegrasp.IParams, "kind">;
}
