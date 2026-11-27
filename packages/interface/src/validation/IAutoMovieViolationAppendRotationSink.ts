import type { IAutoMovieViolationCollector } from "./IAutoMovieViolationCollector";

/** Sink that appends violations and checks unit-quaternion rotations. */
export type IAutoMovieViolationAppendRotationSink = Pick<
  IAutoMovieViolationCollector,
  "push" | "unitQuaternion"
>;
