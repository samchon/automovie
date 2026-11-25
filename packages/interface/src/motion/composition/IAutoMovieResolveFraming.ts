import type { IAutoMovieVector3 } from "../../geometry/IAutoMovieVector3";

/** Data and callback contracts shared by the ResolveFraming operations. */
export namespace IAutoMovieResolveFraming {
  /** A resolved camera. */
  export interface ICamera {
    /** Camera position, world metres. */
    position: IAutoMovieVector3;

    /** Look-at target, world metres. */
    target: IAutoMovieVector3;

    /** Vertical field of view, radians. */
    fieldOfView: number;

    /** Radius of the framed bounding sphere, metres. */
    radius: number;
  }
}
