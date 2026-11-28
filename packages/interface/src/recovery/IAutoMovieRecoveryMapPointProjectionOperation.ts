import type {
  IAutoMovieRecoveryMapPose,
  IAutoMovieRecoveryMapProjection,
} from "..";

/**
 * Callable contract for calibrated point projection and analytic local
 * derivatives in the supplied reconstruction gauge.
 */
export namespace IAutoMovieRecoveryMapPointProjectionOperation {
  /**
   * Project `point` using camera transform `R ? point + t` and the row-major
   * upper-triangular pinhole chart. A finite point at nonpositive depth returns
   * null. Nonrepresentable camera coordinates, projected pixels or derivatives
   * raise an error. Successful output contains both pixel Jacobians in the
   * supplied coordinates.
   */
  export type Operation = (
    pose: IAutoMovieRecoveryMapPose,
    point: readonly [number, number, number],
    intrinsic: readonly number[],
  ) => IAutoMovieRecoveryMapProjection | null;
}
