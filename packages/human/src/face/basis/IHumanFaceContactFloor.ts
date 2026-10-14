/**
 * One original unit-gradient affine contact floor in basis metres.
 * The local solver must retain the existing budget and actual-query verification.
 *
 * @evidence contracts/common.md#principled-implementation Original signed-distance gradients linearize each known contact floor into a metre displacement inequality; edge/vertex radial gradients differ from orientation pseudonormals.
 * @evidence contracts/common.md#clear-and-simple-design Normal/minimum rows enter the local correction owner without duplicating collider state or accepting its solver result alone.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Affine floors are local numerical constraints, not whole-skin validity; the owner verifies actual signed queries and net movement budget before committing.
 * @evidence contracts/common.md#meaningful-documentation Members state unit gradient, original performed point and metre displacement requirement.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This record solves nothing; solveHumanFaceContactCorrection and solveHumanFaceContactProjection own supported local solve costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type coordinates no computation; the original rows are reused during candidate verification and spread.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no resource; original floor arrays are invocation-owned.
 *
 * @author Samchon
 */
export interface IHumanFaceContactFloor {
  /** Unit signed-distance gradient at the original performed point. */
  normal: readonly number[];

  /** Required local displacement along this gradient, metres. */
  minimum: number;
}
