import type { IAutoMovieMotionHumanRest } from "../everyday/IAutoMovieMotionHumanRest";
import type { IAutoMovieMotionHumanSelfAction } from "../touch/IAutoMovieMotionHumanSelfAction";

/**
 * Open parameters of the stance lexicon family, keyed by each runtime export name.
 * Omitted keys are fixed by the row before its underlying law plans; the remaining members retain that law's defaults, units and required status.
 * HumanPerformanceParams checks these open inputs using the generated row schema before HumanActionRow resolves fixed values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each row describes the performed act; its parameter expression identifies the underlying contract and every fixed key.
 * @evidence contracts/development/design.md#principled-representation The stance family is a closed export-name map with the exact Omit projection of each source law.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This interface owns the stance row parameter map used by the family registry and schema generator.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Parameter types refer to canonical action contracts and never infer from runtime law values.
 */
export interface IAutoMovieMotionHumanLexiconStanceParams {
  /** Arms crossed on the chest. */
  armsCrossed: Omit<IAutoMovieMotionHumanRest.IParams, "left" | "right">;

  /** Hands on the hips. */
  handsOnHips: Omit<IAutoMovieMotionHumanRest.IParams, "left" | "right">;

  /** Hands in the pockets. */
  handsInPockets: Omit<IAutoMovieMotionHumanRest.IParams, "left" | "right">;

  /** Parade rest: the hands clasped behind the back. */
  paradeRest: Omit<IAutoMovieMotionHumanRest.IParams, "left" | "right">;

  /** The hands clasped in front. */
  handsClasped: Omit<IAutoMovieMotionHumanRest.IParams, "left" | "right">;

  /** The hands behind the head. */
  handsBehindHead: Omit<IAutoMovieMotionHumanRest.IParams, "left" | "right">;

  /** The thinker: the chin on one hand, the other arm supporting its elbow. */
  thinking: Omit<IAutoMovieMotionHumanRest.IParams, "left" | "right">;

  /** A victory raise of the arms. */
  victory: Omit<IAutoMovieMotionHumanSelfAction.IParams, "kind">;

  /** A fist pump. */
  fistPump: Omit<IAutoMovieMotionHumanSelfAction.IParams, "kind">;

  /** A stretch on waking or after sitting long. */
  bigStretch: Omit<IAutoMovieMotionHumanSelfAction.IParams, "kind">;

  /** A roll of a stiff neck. */
  neckRoll: Omit<IAutoMovieMotionHumanSelfAction.IParams, "kind">;
}
