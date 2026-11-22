import type { IAutoMovieMotionHumanBrace } from "../everyday/IAutoMovieMotionHumanBrace";
import type { IAutoMovieMotionHumanDefence } from "../next/IAutoMovieMotionHumanDefence";

/**
 * Open parameters of the defence lexicon family, keyed by each runtime export name: the named blocks, evasions and braces of #3362.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each row describes the performed act; its parameter expression identifies the underlying contract and every fixed key.
 * @evidence contracts/development/design.md#principled-representation The defence family is a closed export-name map with the exact Omit projection of each source law.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This interface owns the defence row parameter map used by the family registry and schema generator.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Parameter types refer to canonical action contracts and never infer from runtime law values.
 */
export interface IAutoMovieMotionHumanLexiconDefenceParams {
  /** Both forearms brought up to cover the head. */
  cover: IAutoMovieMotionHumanDefence.IDefendRow;

  /** The incoming fist deflected by the hand. */
  handParry: IAutoMovieMotionHumanDefence.IDefendRow;

  /** A body strike taken on the elbow. */
  elbowBlock: IAutoMovieMotionHumanDefence.IDefendRow;

  /** A high strike taken on the raised forearm. */
  highBlock: IAutoMovieMotionHumanDefence.IDefendRow;

  /** A kick checked with the raised shin. */
  checkKick: IAutoMovieMotionHumanDefence.IDefendRow;

  /** The head moved off the line of a straight punch. */
  slip: IAutoMovieMotionHumanDefence.IDefendRow;

  /** The body rolled under a hook. */
  rollUnder: IAutoMovieMotionHumanDefence.IDefendRow;

  /** The trunk swayed back from a strike. */
  swayBack: IAutoMovieMotionHumanDefence.IDefendRow;

  /** The stance widened and lowered for an impact. */
  braceImpact: Omit<IAutoMovieMotionHumanBrace.IParams, "kind">;

  /** The stance set against a push. */
  bracePush: Omit<IAutoMovieMotionHumanBrace.IParams, "kind">;
}
