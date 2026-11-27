import type { IAutoMovieViolationCollector } from "./IAutoMovieViolationCollector";

/** Sink that appends violations and exposes its ordered findings. */
export type IAutoMovieViolationAppendItemsSink = Pick<
  IAutoMovieViolationCollector,
  "items" | "push"
>;
