import type { IAutoMovieMotionHumanUseTool } from "../tasks/IAutoMovieMotionHumanUseTool";

/**
 * Open parameters of the upperTool lexicon family, keyed by each runtime export name.
 * Omitted keys are fixed by the row before its underlying law plans; the remaining members retain that law's defaults, units and required status.
 * HumanPerformanceParams checks these open inputs using the generated row schema before HumanActionRow resolves fixed values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each row describes the performed act; its parameter expression identifies the underlying contract and every fixed key.
 * @evidence contracts/development/design.md#principled-representation The upperTool family is a closed export-name map with the exact Omit projection of each source law.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This interface owns the upperTool row parameter map used by the family registry and schema generator.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Parameter types refer to canonical action contracts and never infer from runtime law values.
 */
export interface IAutoMovieMotionHumanLexiconUpperToolParams {
  /** `useTool` working with a `hammer`. */
  toolHammer: Omit<IAutoMovieMotionHumanUseTool.IParams, "tool">;

  /** `useTool` working with a `saw`. */
  toolSaw: Omit<IAutoMovieMotionHumanUseTool.IParams, "tool">;

  /** `useTool` working with a `stir`. */
  toolStir: Omit<IAutoMovieMotionHumanUseTool.IParams, "tool">;

  /** `useTool` working with a `screwdriver`. */
  toolScrewdriver: Omit<IAutoMovieMotionHumanUseTool.IParams, "tool">;
}
