import type { IAutoMoviePose } from "../pose/IAutoMoviePose";
import type { IAutoMoviePoseVelocity } from "./IAutoMoviePoseVelocity";

/** A pose with its velocity. */
export interface IAutoMoviePoseState {
  /** The pose. */
  pose: IAutoMoviePose;

  /** Its velocity. */
  velocity: IAutoMoviePoseVelocity;
}
