import type { IAutoMovieViolationCollector } from "./IAutoMovieViolationCollector";

/** Sink that reports warning-severity findings. */
export type IAutoMovieViolationWarningSink = Pick<
  IAutoMovieViolationCollector,
  "warn"
>;
