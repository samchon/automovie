import type { IAutoMovieMotionHumanLabour } from "@automovie/interface";

/**
 * The scrub preset: six passes of the cloth, circles at the tool-stroke hand speed (`useTool.STROKE_SPEED`); cleaning a table, a window, a floor. Spread into `wipe`'s parameters; the `scrub` row of `HumanLabour` fixes this value.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the pass count the preset fixes, how it is applied and which row reads it.
 * @evidence contracts/development/design.md#principled-representation The wipe law's own count as one `IScrubPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanLabour.SCRUB`; the scrub row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_LABOUR_SCRUB: IAutoMovieMotionHumanLabour.IScrubPreset = {
  count: 6,
};
