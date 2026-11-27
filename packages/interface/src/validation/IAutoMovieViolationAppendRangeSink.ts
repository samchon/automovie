import type { IAutoMovieViolationCollector } from "./IAutoMovieViolationCollector";

/** Sink that appends violations and checks inclusive numeric ranges. */
export type IAutoMovieViolationAppendRangeSink = Pick<
  IAutoMovieViolationCollector,
  "push" | "range"
>;
