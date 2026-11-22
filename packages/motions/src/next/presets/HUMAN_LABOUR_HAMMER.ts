import type { IAutoMovieMotionHumanLabour } from "@automovie/interface";

/**
 * The hammer preset: a hammer swung 4 times, which at 2 Hz take 2 s (`useTool.PERIODS`); building, repair. Spread into `useTool`'s parameters; the `hammer` row of `HumanLabour` fixes these values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the tool and the stroke count the preset fixes with their result, how it is applied and which row reads it.
 * @evidence contracts/development/design.md#principled-representation The tool law's own tool and count as one `IHammerPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanLabour.HAMMER`; the hammer row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_LABOUR_HAMMER: IAutoMovieMotionHumanLabour.IHammerPreset = {
  tool: "hammer",
  count: 4,
};
