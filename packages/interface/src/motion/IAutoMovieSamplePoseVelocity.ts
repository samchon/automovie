import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMoviePose } from "../pose/IAutoMoviePose";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** Data and callback contracts shared by the SamplePoseVelocity operations. */
export namespace IAutoMovieSamplePoseVelocity {
  /**
     * The side of an instant a motion is read from: `before` for a motion that
     * ends there, `after` for one that begins there, `both` for one that runs
     * through it.
     */
    export type Side = "both" | "before" | "after";

  /** A pose's velocity. */
    export interface IVelocity {
      /** Flexion, abduction and twist rates per bone, degrees per second. */
      joints: Map<AutoMovieHumanoidBone, [number, number, number]>;
  
      /**
       * Each joint's angular velocity, radians per second, in the frame its
       * articulation is applied in (after the bone's rest rotation).
       */
      spins: Map<AutoMovieHumanoidBone, IAutoMovieVector3>;
  
      /** Root translation rate, metres per second, the pose's parent frame. */
      linear: IAutoMovieVector3;
  
      /** Root angular velocity, radians per second, the pose's parent frame. */
      angular: IAutoMovieVector3;
    }

  /** A pose with its velocity. */
    export interface IState {
      /** The pose. */
      pose: IAutoMoviePose;
  
      /** Its velocity. */
      velocity: IAutoMovieSamplePoseVelocity.IVelocity;
    }
}
