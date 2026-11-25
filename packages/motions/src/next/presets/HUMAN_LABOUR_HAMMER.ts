import type { IAutoMovieMotionHumanLabour } from "@automovie/interface";

/**
 * The hammer preset: a hammer swung 4 times, which at 2 Hz take 2 s
 * (`useTool.PERIODS`); building, repair. Spread into `useTool`'s parameters;
 * the `hammer` row of `HumanLabour` fixes these values.
 */
export const HUMAN_LABOUR_HAMMER: IAutoMovieMotionHumanLabour.IHammerPreset = {
  tool: "hammer",
  count: 4,
};
