import type { IAutoMovieMotionHumanBrace } from "../everyday/IAutoMovieMotionHumanBrace";
import type { IAutoMovieMotionHumanDefend } from "../striking/IAutoMovieMotionHumanDefend";

/**
 * Open parameters of the defence lexicon family, keyed by each runtime export name: the named blocks, evasions and braces of #3362.
 * Omitted keys are fixed by the row before its underlying law plans; the remaining members retain that law's defaults, units and required status.
 * HumanPerformanceParams checks these open inputs using the generated row schema before HumanActionRow resolves fixed values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each row describes the performed act; its parameter expression identifies the underlying contract and every fixed key.
 * @evidence contracts/development/design.md#principled-representation The defence family is a closed export-name map with the exact Omit projection of each source law.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This interface owns the defence row parameter map used by the family registry and schema generator.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Parameter types refer to canonical action contracts and never infer from runtime law values.
 */
export interface IAutoMovieMotionHumanLexiconDefenceParams {
  /** Both forearms brought up to cover the head. */
  cover: Omit<IAutoMovieMotionHumanDefend.IParams, "kind">;

  /** The incoming fist deflected by the hand. */
  handParry: Omit<IAutoMovieMotionHumanDefend.IParams, "kind">;

  /** A body strike taken on the elbow. */
  elbowBlock: Omit<IAutoMovieMotionHumanDefend.IParams, "kind">;

  /** A high strike taken on the raised forearm. */
  highBlock: Omit<IAutoMovieMotionHumanDefend.IParams, "kind">;

  /** A kick checked with the raised shin. */
  checkKick: Omit<IAutoMovieMotionHumanDefend.IParams, "kind">;

  /** The head moved off the line of a straight punch. */
  slip: Omit<IAutoMovieMotionHumanDefend.IParams, "kind">;

  /** The body rolled under a hook. */
  rollUnder: Omit<IAutoMovieMotionHumanDefend.IParams, "kind">;

  /** The trunk swayed back from a strike. */
  swayBack: Omit<IAutoMovieMotionHumanDefend.IParams, "kind">;

  /** The stance widened and lowered for an impact. */
  braceImpact: Omit<IAutoMovieMotionHumanBrace.IParams, "kind">;

  /** The stance set against a push. */
  bracePush: Omit<IAutoMovieMotionHumanBrace.IParams, "kind">;
}