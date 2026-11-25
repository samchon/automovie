import type { IAutoMovieMotionHumanUseTool } from "../tasks/IAutoMovieMotionHumanUseTool";

/**
 * Open parameters of the upperTool lexicon family, keyed by each runtime export
 * name.
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
