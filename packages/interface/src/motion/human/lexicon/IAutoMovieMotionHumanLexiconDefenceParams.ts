import type { IAutoMovieMotionHumanBrace } from "../everyday/IAutoMovieMotionHumanBrace";
import type { IAutoMovieMotionHumanDefence } from "../next/IAutoMovieMotionHumanDefence";

/**
 * Open parameters of the defence lexicon family, keyed by each runtime export
 * name: the named blocks, evasions and braces.
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
