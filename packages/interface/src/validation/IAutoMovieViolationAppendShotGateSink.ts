import type { IAutoMovieViolationCollector } from "./IAutoMovieViolationCollector";

/**
 * Sink for staged shot gates that inspect findings and check action rotations.
 */
export type IAutoMovieViolationAppendShotGateSink = Pick<
  IAutoMovieViolationCollector,
  "items" | "push" | "nonEmpty" | "unitQuaternion"
>;
