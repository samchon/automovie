import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** Contracts used by HumanPropFrame.bone. */
export namespace IAutoMovieMotionHumanPropFrame {
  /**
   * A resolved bone's world frame. Input bone of HumanPropFrame.bone. The
   * bone's world position and rotation.
   */
  export type IBoneBone = {
    /** Resolved bone origin in world metres. */
    worldPosition: IAutoMovieVector3;
    /** Resolved bone orientation as a world unit quaternion. */
    worldRotation: IAutoMovieQuaternion;
  };
}
