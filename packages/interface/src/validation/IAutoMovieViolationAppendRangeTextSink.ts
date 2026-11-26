import type { IAutoMovieViolationCollector } from "./IAutoMovieViolationCollector";

/** Sink that appends violations, checks ranges and checks non-empty text. */
export type IAutoMovieViolationAppendRangeTextSink = Pick<
  IAutoMovieViolationCollector,
  "push" | "range" | "nonEmpty"
>;
