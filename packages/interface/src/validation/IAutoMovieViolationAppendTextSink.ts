import type { IAutoMovieViolationCollector } from "./IAutoMovieViolationCollector";

/** Sink that appends violations and checks non-empty text. */
export type IAutoMovieViolationAppendTextSink = Pick<
  IAutoMovieViolationCollector,
  "push" | "nonEmpty"
>;
