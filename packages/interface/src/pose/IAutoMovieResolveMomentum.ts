import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** Data and callback contracts shared by the ResolveMomentum operations. */
export namespace IAutoMovieResolveMomentum {
  /** Linear and angular momentum of a body over an interval. */
    export interface IMomentum {
      /** The whole-body centre of mass at the interval's middle, the mean of its two ends, metres. */
      centre: IAutoMovieVector3;
  
      /** The centre's velocity over the interval, metres per second. */
      velocity: IAutoMovieVector3;
  
      /** Linear momentum, the total mass times `velocity`, kg m/s. */
      linear: IAutoMovieVector3;
  
      /** Angular momentum about `centre`, kg m²/s. */
      angular: IAutoMovieVector3;
    }

  /** A tensor's principal frame. */
    export interface IPrincipal {
      /** The principal moments in ascending order, in the tensor's unit. */
      moments: IAutoMovieVector3;
  
      /** The rotation from the principal frame to the tensor's frame; its columns are the moments' axes. */
      rotation: IAutoMovieQuaternion;
    }
}
