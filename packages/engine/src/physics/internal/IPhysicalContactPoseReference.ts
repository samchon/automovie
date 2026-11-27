import type {
  IAutoMoviePoses,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

/*
 * A bone pose and its optional dependency in the candidate being probed.
 */
export interface IPhysicalContactPoseReference {
  /*
   * Candidate pose-map key of this bone; omitted for a fixed reference whose
   * pose never changes during the fit.
   */
  readonly key?: string;

  /*
   * Read the bone's world pose from a candidate pose map. A fixed reference
   * ignores the candidate and returns its snapshot pose.
   */
  read(poses: IAutoMoviePoses): IAutoMovieRigidTransform;
}
