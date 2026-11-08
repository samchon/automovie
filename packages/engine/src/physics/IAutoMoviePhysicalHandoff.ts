import type { IAutoMovieVector3 as V } from "@automovie/interface";

/** Serialized relative-transform correction at a dynamic-to-authored boundary; native snapshots own actual bodies, while this record owns the remaining C1 return trajectory. */
export interface IAutoMoviePhysicalHandoff {
  /** Exact integer native tick immediately before switching ownership. */ tick: number;
  /** Positive authored return duration, seconds. */ duration: number;
  /** Parent-local inherited anchor error, or root displacement from the authored path, metres. */
  position: V;
  /** Parent-local derivative of the inherited displacement, m/s. */
  velocity: V;
  /** Parent-local rotation-vector displacement from the authored path, radians. */
  rotation: V;
  /** Derivative of the rotation vector, rad/s. */
  angularVelocity: V;
  /** Retain the final candidate through its path check before removing this record on the next step. */ completed?: boolean;
}
