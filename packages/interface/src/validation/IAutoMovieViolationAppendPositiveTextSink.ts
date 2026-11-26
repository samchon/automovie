import type { IAutoMovieViolationCollector } from "./IAutoMovieViolationCollector";

/**
 * Sink that appends violations and checks positive values and non-empty text.
 */
export type IAutoMovieViolationAppendPositiveTextSink = Pick<
  IAutoMovieViolationCollector,
  "push" | "positive" | "nonEmpty"
>;
