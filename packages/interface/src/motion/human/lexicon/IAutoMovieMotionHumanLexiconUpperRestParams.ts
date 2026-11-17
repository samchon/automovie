import type { IAutoMovieMotionHumanRest } from "../everyday/IAutoMovieMotionHumanRest";

/**
 * Open parameters of the upperRest lexicon family, keyed by each runtime export name.
 * Omitted keys are fixed by the row before its underlying law plans; the remaining members retain that law's defaults, units and required status.
 * HumanPerformanceParams checks these open inputs using the generated row schema before HumanActionRow resolves fixed values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each row describes the performed act; its parameter expression identifies the underlying contract and every fixed key.
 * @evidence contracts/development/design.md#principled-representation The upperRest family is a closed export-name map with the exact Omit projection of each source law.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This interface owns the upperRest row parameter map used by the family registry and schema generator.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Parameter types refer to canonical action contracts and never infer from runtime law values.
 */
export interface IAutoMovieMotionHumanLexiconUpperRestParams {
  /** `rest` with both hands at `side`. */
  restSide: Omit<IAutoMovieMotionHumanRest.IParams, "left" | "right">;

  /** `rest` with both hands at `pocket`. */
  restPocket: Omit<IAutoMovieMotionHumanRest.IParams, "left" | "right">;

  /** `rest` with both hands at `hip`. */
  restHip: Omit<IAutoMovieMotionHumanRest.IParams, "left" | "right">;

  /** `rest` with both hands at `crossed`. */
  restCrossed: Omit<IAutoMovieMotionHumanRest.IParams, "left" | "right">;

  /** `rest` with both hands at `claspedFront`. */
  restClaspedFront: Omit<IAutoMovieMotionHumanRest.IParams, "left" | "right">;

  /** `rest` with both hands at `claspedBehind`. */
  restClaspedBehind: Omit<IAutoMovieMotionHumanRest.IParams, "left" | "right">;

  /** `rest` with both hands at `behindHead`. */
  restBehindHead: Omit<IAutoMovieMotionHumanRest.IParams, "left" | "right">;

  /** `rest` with both hands at `chinRest`. */
  restChinRest: Omit<IAutoMovieMotionHumanRest.IParams, "left" | "right">;

  /** `rest` with both hands at `elbowSupport`. */
  restElbowSupport: Omit<IAutoMovieMotionHumanRest.IParams, "left" | "right">;
}
