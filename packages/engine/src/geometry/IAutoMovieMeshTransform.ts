import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

/** A rigid translate / unit-quaternion rotate / per-axis scale placement. */
export interface IAutoMovieMeshTransform {
  /** Metres added after rotation and scale; omitted means the origin. */
  translation?: IAutoMovieVector3;
  /** Unit quaternion applied after scale; omitted means identity. */
  rotation?: IAutoMovieQuaternion;
  /** Per-axis scale applied first; omitted means unit scale. */
  scale?: IAutoMovieVector3;
}
