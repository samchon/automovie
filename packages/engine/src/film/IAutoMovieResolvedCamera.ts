import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

/** A camera's resolved world placement (position + rotation). */
export interface IAutoMovieResolvedCamera {
  /** Camera origin in world space. */
  position: IAutoMovieVector3;
  /** Camera orientation in world space. */
  rotation: IAutoMovieQuaternion;
}
