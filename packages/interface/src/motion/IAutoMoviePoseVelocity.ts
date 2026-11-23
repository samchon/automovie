import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/** A pose's velocity. */
export interface IAutoMoviePoseVelocity {
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
