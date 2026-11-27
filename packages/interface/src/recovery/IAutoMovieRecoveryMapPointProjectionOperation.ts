import type {
  IAutoMovieRecoveryMapPose,
  IAutoMovieRecoveryMapProjection,
} from "..";

/**
 * Project one point in the pose's reconstruction frame through a row-major 3 by
 * 3 pixel intrinsic matrix. The camera pose maps that frame into camera
 * coordinates. Return null only for nonpositive depth. Nonrepresentable camera
 * coordinates, pixels or derivatives throw. A valid projection returns pixel
 * coordinates, positive depth and Jacobians in the original physical parameter
 * units. No observation residual or scene acceptance is inferred.
 */
export namespace IAutoMovieRecoveryMapPointProjectionOperation {
  /**
   * Project one point in the pose's reconstruction frame through a row-major 3
   * by 3 pixel intrinsic matrix. The camera pose maps that frame into camera
   * coordinates. Return null only for nonpositive depth. Nonrepresentable
   * camera coordinates, pixels or derivatives throw. A valid projection returns
   * pixel coordinates, positive depth and Jacobians in the original physical
   * parameter units. No observation residual or scene acceptance is inferred.
   */
  export type Operation = (
    pose: IAutoMovieRecoveryMapPose,
    point: readonly [number, number, number],
    intrinsic: readonly number[],
  ) => IAutoMovieRecoveryMapProjection | null;
}
