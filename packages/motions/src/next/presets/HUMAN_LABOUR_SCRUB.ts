import type { IAutoMovieMotionHumanLabour } from "@automovie/interface";

/*
 * The scrub preset: six passes of the cloth, circles at the tool-stroke hand
 * speed (`useTool.STROKE_SPEED`); cleaning a table, a window, a floor. Spread
 * into `wipe`'s parameters; the `scrub` row of `HumanLabour` fixes this value.
 */
export const HUMAN_LABOUR_SCRUB: IAutoMovieMotionHumanLabour.IScrubPreset = {
  count: 6,
};
