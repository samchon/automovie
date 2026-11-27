import type { IAutoMovieViolationCollector } from "./IAutoMovieViolationCollector";

/** Sink for procedural-surface findings that also exposes prior findings. */
export type IAutoMovieViolationAppendSurfaceItemsSink = Pick<
  IAutoMovieViolationCollector,
  "items" | "push" | "positive" | "range" | "direction"
>;
