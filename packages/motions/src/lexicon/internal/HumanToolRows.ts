import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
} from "@automovie/interface";

import { AutoMovieMotionHumanActionRow } from "../../law/AutoMovieMotionHumanActionRow";
import { useTool } from "../../tasks/internal/useTool";

/*
 * The tool strokes as rows: each tool of `useTool` under a name of its own, the
 * held prop, the work site, the hand, the cycles and the manner open.
 *
 * Each row writes no motion: its law plans it, so it fits any body, refuses and
 * is checked as the law is, and its draws are keyed by its own name. The rows
 * over the arm's phrases themselves are `HumanUpperRows`.
 */
export namespace HumanToolRows {
  /*
   * `useTool` working with a `hammer`: strikes at 2 Hz (0.5 s a cycle, Petric
   * et al. 2017), 4 cycles, 2 s, when `cycles` is absent
   * (useTool.PERIODS); nailing, breaking, building.
   */
  export const toolHammer: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperTool"]["toolHammer"]
  > = AutoMovieMotionHumanActionRow.of("toolHammer", useTool, {
    tool: "hammer",
  });

  /*
   * `useTool` working with a `saw`: push and pull at 2 Hz (0.5 s a cycle,
   * Starke and Baber 2017), 4 cycles, 2 s, when `cycles` is absent
   * (useTool.PERIODS); cutting wood.
   */
  export const toolSaw: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperTool"]["toolSaw"]
  > = AutoMovieMotionHumanActionRow.of("toolSaw", useTool, { tool: "saw" });

  /*
   * `useTool` working with a `stir`: a circle whose time follows from its
   * length at a tool speed, 4 cycles when `cycles` is absent (useTool);
   * cooking, mixing a cup.
   */
  export const toolStir: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperTool"]["toolStir"]
  > = AutoMovieMotionHumanActionRow.of("toolStir", useTool, {
    tool: "stir",
  });

  /*
   * `useTool` working with a `screwdriver`: 0.7 s a turn (provisional), 4
   * cycles, 2.8 s, when `cycles` is absent (useTool.PERIODS); fastening
   * a screw, repair.
   */
  export const toolScrewdriver: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperTool"]["toolScrewdriver"]
  > = AutoMovieMotionHumanActionRow.of("toolScrewdriver", useTool, {
    tool: "screwdriver",
  });
}
