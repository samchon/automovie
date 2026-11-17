import type { IAutoMovieRecoveryMapPose, IAutoMovieRecoveryMapProjection } from "../../index";

/**
 * Project one point in the pose's reconstruction frame through a row-major 3 by 3 pixel intrinsic matrix. The camera pose maps that frame into camera coordinates. Return null only for nonpositive depth. Nonrepresentable camera coordinates, pixels or derivatives throw. A valid projection returns pixel coordinates, positive depth and Jacobians in the original physical parameter units. No observation residual or scene acceptance is inferred.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents parameter units, callback effects and failed admission for projectRecoveryMapPoint.
 * @evidence contracts/development/design.md#principled-representation Project one point in the pose's reconstruction frame through a row-major 3 by 3 pixel intrinsic matrix.
 * @evidence contracts/development/design.md#minimal-and-owned-surface projectRecoveryMapPoint and its typed callers share this signature and the referenced canonical input and result records.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Numerical qualification and caller budget admission remain required by projectRecoveryMapPoint; the type does not certify input validity.
 */
export namespace IAutoMovieRecoveryMapPointProjectionOperation {
/**
 * Project one point in the pose's reconstruction frame through a row-major 3 by 3 pixel intrinsic matrix. The camera pose maps that frame into camera coordinates. Return null only for nonpositive depth. Nonrepresentable camera coordinates, pixels or derivatives throw. A valid projection returns pixel coordinates, positive depth and Jacobians in the original physical parameter units. No observation residual or scene acceptance is inferred.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents parameter units, callback effects and failed admission for projectRecoveryMapPoint.
 * @evidence contracts/development/design.md#principled-representation Project one point in the pose's reconstruction frame through a row-major 3 by 3 pixel intrinsic matrix.
 * @evidence contracts/development/design.md#minimal-and-owned-surface projectRecoveryMapPoint and its typed callers share this signature and the referenced canonical input and result records.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Numerical qualification and caller budget admission remain required by projectRecoveryMapPoint; the type does not certify input validity.
 */
export type Operation = (pose: IAutoMovieRecoveryMapPose,
point: readonly [number, number, number],
intrinsic: readonly number[]) => IAutoMovieRecoveryMapProjection | null;
}
