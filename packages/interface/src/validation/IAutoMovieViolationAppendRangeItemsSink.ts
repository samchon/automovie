import type { IAutoMovieViolationCollector } from "./IAutoMovieViolationCollector";

/** Sink that appends range findings and exposes its ordered finding list. */
export type IAutoMovieViolationAppendRangeItemsSink = Pick<
  IAutoMovieViolationCollector,
  "items" | "push" | "range"
>;
