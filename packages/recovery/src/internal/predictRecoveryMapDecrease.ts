import type { IAutoMovieRecoveryMapJointBlock } from "../structures/internal/IAutoMovieRecoveryMapJointBlock";

/**
 * Apply the current undamped weighted original design to an actual increment.
 * Camera coordinates precede three coordinates for each landmark. The gradient
 * and blocks use the same current vector soft-L1 weights and physical chart.
 *
 * @evidence contracts/common.md#principled-implementation Minus gradient dot u minus half sum(Jw*u)^2 is the decrease of the original current weighted-GN model. Each row combines its dense camera part and local point part before squaring; no damping penalty or trial reweighting changes that model.
 * @evidence contracts/common.md#clear-and-simple-design A streaming design action serves accepted-step metric reactions without a dense Jacobian, Gram matrix or metric subtraction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Wrong physical width, row layout or nonfinite gradient, increment or Jacobian throws as a core error. Nonrepresentable arithmetic returns null rather than a fabricated positive prediction; neither status qualifies a nonlinear candidate.
 * @evidence contracts/common.md#meaningful-documentation Inputs are borrowed current-base arrays and the exact chosen retraction increment; the finite return is a computed squared-pixel decrease and may be nonpositive, while null means arithmetic support is unavailable.
 * @evidence contracts/performance.md#efficient-algorithms E observations, L points and C camera coordinates require O(E*(C+3)+n+L) visits and constant scratch. The owner precharges32*(E*(C+4)+n+L+1) before this scan.
 * @evidence contracts/performance.md#reuse-equivalent-work Retained current weighted blocks and gradient are used directly; there is no projection, factorization, retraction, new residual population or trial.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrowed design, gradient and increment remain unchanged. Only scalar accumulators live during the call; the owner releases its current design after the reaction.
 */
export function predictRecoveryMapDecrease(
  blocks: readonly IAutoMovieRecoveryMapJointBlock[],
  gradient: readonly number[],
  increment: readonly number[],
): number | null {
  const cameraWidth: number = gradient.length - 3 * blocks.length;
  if (blocks.length < 1 || cameraWidth < 1 || increment.length !== gradient.length ||
      !gradient.every(Number.isFinite) || !increment.every(Number.isFinite))
    throw new Error("camera-regularization: finite matching physical coordinates required");
  let linear: number = 0, quadratic: number = 0;
  for (let axis: number = 0; axis < gradient.length; axis++)
    linear += gradient[axis]! * increment[axis]!;
  for (let point: number = 0; point < blocks.length; point++) {
    const block: IAutoMovieRecoveryMapJointBlock = blocks[point]!;
    if (block.pointRows.length !== block.right.length || block.cameraRows.length !== block.right.length)
      throw new Error("camera-regularization: matching complete original rows required");
    for (let row: number = 0; row < block.right.length; row++) {
      const camera: readonly number[] = block.cameraRows[row]!;
      const local: readonly number[] = block.pointRows[row]!;
      if (camera.length !== cameraWidth || local.length !== 3 ||
          !camera.every(Number.isFinite) || !local.every(Number.isFinite))
        throw new Error("camera-regularization: finite original block layout required");
      let value: number = 0;
      for (let axis: number = 0; axis < cameraWidth; axis++) value += camera[axis]! * increment[axis]!;
      for (let axis: number = 0; axis < 3; axis++) value += local[axis]! * increment[cameraWidth + 3 * point + axis]!;
      quadratic += value * value;
    }
  }
  const predicted: number = -linear - 0.5 * quadratic;
  return Number.isFinite(predicted) ? predicted : null;
}
