import type { IAutoMovieRecoveryMapJointBlock } from "@automovie/interface";

/*
 * Apply the current undamped weighted original design to an actual increment.
 * Camera coordinates precede three coordinates for each landmark. The gradient
 * and blocks use the same current vector soft-L1 weights and physical chart.
 */
export function predictRecoveryMapDecrease(
  blocks: readonly IAutoMovieRecoveryMapJointBlock[],
  gradient: readonly number[],
  increment: readonly number[],
): number | null {
  const cameraWidth: number = gradient.length - 3 * blocks.length;
  if (
    blocks.length < 1 ||
    cameraWidth < 1 ||
    increment.length !== gradient.length
  )
    throw new Error(
      "camera-regularization: finite matching physical coordinates required",
    );
  let linear: number = 0,
    quadratic: number = 0;
  for (let axis: number = 0; axis < gradient.length; axis++)
    linear += gradient[axis]! * increment[axis]!;
  for (let point: number = 0; point < blocks.length; point++) {
    const block: IAutoMovieRecoveryMapJointBlock = blocks[point]!;
    if (
      block.pointRows.length !== block.right.length ||
      block.cameraRows.length !== block.right.length
    )
      throw new Error(
        "camera-regularization: matching complete original rows required",
      );
    for (let row: number = 0; row < block.right.length; row++) {
      const camera: readonly number[] = block.cameraRows[row]!;
      const local: readonly number[] = block.pointRows[row]!;
      if (camera.length !== cameraWidth || local.length !== 3)
        throw new Error(
          "camera-regularization: finite original block layout required",
        );
      let value: number = 0;
      for (let axis: number = 0; axis < cameraWidth; axis++)
        value += camera[axis]! * increment[axis]!;
      for (let axis: number = 0; axis < 3; axis++)
        value += local[axis]! * increment[cameraWidth + 3 * point + axis]!;
      quadratic += value * value;
    }
  }
  const predicted: number = -linear - 0.5 * quadratic;
  return [linear, quadratic, predicted].some(
    (value: number): boolean => value === Infinity || value === -Infinity,
  )
    ? null
    : predicted;
}
