import type { IAutoMovieViolationCollector } from "./IAutoMovieViolationCollector";

/** Sink that supports only appending canonical violations. */
export type IAutoMovieViolationAppendSink = Pick<
  IAutoMovieViolationCollector,
  "push"
>;
