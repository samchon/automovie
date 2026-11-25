import type { IAutoMovieQuaternion } from "../../../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * Contracts used by HumanCarried.carried.frame, carryHumanPosture,
 * HumanCarried.carried.
 */
export namespace IAutoMovieMotionHumanCarryHumanPosture {
  /** A rigid world frame. */
  export interface IFrame {
    /** Origin, world metres. */
    position: IAutoMovieVector3;

    /** Rotation to the world. */
    rotation: IAutoMovieQuaternion;
  }
}
