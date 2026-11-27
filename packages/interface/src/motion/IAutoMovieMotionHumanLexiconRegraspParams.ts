import type { IAutoMovieMotionHumanRegrasp } from "./IAutoMovieMotionHumanRegrasp";

/**
 * Open parameters of the regrasp lexicon family, keyed by each runtime export
 * name.
 */
export interface IAutoMovieMotionHumanLexiconRegraspParams {
  /** A key or a cap turned about its own axis by the wrist, the grip held. */
  twist: Omit<IAutoMovieMotionHumanRegrasp.IParams, "kind">;

  /** The object shifted in the still hand to another of its grips. */
  regrip: Omit<IAutoMovieMotionHumanRegrasp.IParams, "kind">;

  /** A small round object rolled across the fingers. */
  roll: Omit<IAutoMovieMotionHumanRegrasp.IParams, "kind">;
}
