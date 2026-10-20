import type { IAutoMovieSimplexAtom } from "@automovie/engine/math/IAutoMovieSimplexAtom";
import { reduceAutoMovieQrDesign } from "@automovie/engine/math/reduceAutoMovieQrDesign";
import type { IAutoMovieRecoveryCameraMapBudget } from "@automovie/interface/recovery";

import type { IAutoMovieRecoveryMapMetric } from "../structures/internal/IAutoMovieRecoveryMapMetric";

/**
 * Retain the upper arrowhead of a consistently scaled point-first bundle QR.
 * Physical vectors list camera coordinates before the three coordinates per
 * landmark; elimination internally orders points first. The solve and covector
 * multiplication actions use the same original global column scales.
 *
 * @evidence contracts/common.md#principled-implementation Givens reduction produces the camera upper factor of the already point-eliminated damped design. Solving R^T*w=scaled-covector first resolves independent point blocks and then the camera tail; R*s=z reverses that order. No Gram matrix, inverse or second camera scaling changes coordinates.
 * @evidence contracts/common.md#clear-and-simple-design This owner retains the exact factor lifetime needed for feasible-direction whitening; independent original rank and the old unconstrained solve stay with solveRecoveryMapJointStep.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No pivot floor or active inequality supplies missing data rank. Every nonrepresentable triangular action throws instead of returning a zero direction.
 * @evidence contracts/common.md#meaningful-documentation States camera/point ordering, scale direction and distinction between an invertible damped metric and undamped rank qualification.
 * @evidence contracts/performance.md#efficient-algorithms One camera QR costs O(E*C^2) and O(C^2) retained scalars. A covector touching k points costs O(k*C+C^2), and inverse action costs O(L*C+C^2); no full (C+3L)^2 factor is formed.
 * @evidence contracts/performance.md#reuse-equivalent-work Current point triangles, camera upper factor and global scales supply both triangular solves and physical covector multiplication; no second factor or normal matrix is built.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owned upper factors/scales live in returned closures for one model. The caller admits their retention and charges each whitening action; sparse row temporaries expire without input mutation or external state.
 */
export function createRecoveryMapMetric(
  triangles: readonly (readonly (readonly number[])[])[],
  reduced: readonly (readonly number[])[],
  pointScales: readonly (readonly number[])[],
  cameraScales: readonly number[],
  budget: IAutoMovieRecoveryCameraMapBudget,
): IAutoMovieRecoveryMapMetric {
  const cameraWidth: number = cameraScales.length;
  const width: number = cameraWidth + 3 * triangles.length;
  const camera: number[][] = reduceAutoMovieQrDesign(
    reduced,
    new Array<number>(reduced.length).fill(0),
    {
      maxEntries: budget.maxLinearEntries,
      maxWork: reduced.length * cameraWidth * (cameraWidth + 1),
    },
  ).rows;
  const divide: (value: number, pivot: number) => number = (
    value: number,
    pivot: number,
  ): number => {
    const answer: number = value / pivot;
    if (pivot === 0 || !Number.isFinite(answer))
      throw new Error("camera-feasible: unresolved triangular metric action");
    return answer;
  };
  return {
    width,
    whiten: (row: IAutoMovieSimplexAtom): IAutoMovieSimplexAtom => {
      const cameraRight: number[] = new Array<number>(cameraWidth).fill(0);
      const points: Map<number, number[]> = new Map();
      for (let at: number = 0; at < row.indices.length; at++) {
        const axis: number = row.indices[at]!;
        if (axis < cameraWidth)
          cameraRight[axis] = row.values[at]! / cameraScales[axis]!;
        else {
          const point: number = Math.floor((axis - cameraWidth) / 3);
          const local: number = (axis - cameraWidth) % 3;
          let right: number[] | undefined = points.get(point);
          if (right === undefined) {
            right = [0, 0, 0];
            points.set(point, right);
          }
          right[local] = row.values[at]! / pointScales[point]![local]!;
        }
      }
      for (const [point, right] of points) {
        const triangular: readonly (readonly number[])[] = triangles[point]!;
        for (let axis: number = 0; axis < 3; axis++) {
          let value: number = right[axis]!;
          for (let previous: number = 0; previous < axis; previous++)
            value -= triangular[previous]![axis]! * right[previous]!;
          right[axis] = divide(value, triangular[axis]![axis]!);
        }
        for (let column: number = 0; column < cameraWidth; column++)
          for (let axis: number = 0; axis < 3; axis++)
            cameraRight[column]! -=
              triangular[axis]![3 + column]! * right[axis]!;
      }
      for (let axis: number = 0; axis < cameraWidth; axis++) {
        let value: number = cameraRight[axis]!;
        for (let previous: number = 0; previous < axis; previous++)
          value -= camera[previous]![axis]! * cameraRight[previous]!;
        cameraRight[axis] = divide(value, camera[axis]![axis]!);
      }
      const indices: number[] = Array.from(
        { length: cameraWidth },
        (_: unknown, axis: number): number => axis,
      );
      const values: number[] = cameraRight;
      for (const [point, right] of points)
        for (let axis: number = 0; axis < 3; axis++) {
          indices.push(cameraWidth + 3 * point + axis);
          values.push(right[axis]!);
        }
      return { indices, values, offset: row.offset };
    },
    unwhiten: (step: readonly number[]): number[] => {
      if (step.length !== width)
        throw new Error("camera-feasible: metric width mismatch");
      const cameraStep: number[] = step.slice(0, cameraWidth);
      for (let axis: number = cameraWidth - 1; axis >= 0; axis--) {
        let value: number = cameraStep[axis]!;
        for (let next: number = axis + 1; next < cameraWidth; next++)
          value -= camera[axis]![next]! * cameraStep[next]!;
        cameraStep[axis] = divide(value, camera[axis]![axis]!);
      }
      const physical: number[] = cameraStep.map(
        (value: number, axis: number): number => value / cameraScales[axis]!,
      );
      for (let point: number = 0; point < triangles.length; point++) {
        const triangle: readonly (readonly number[])[] = triangles[point]!;
        const local: number[] = step.slice(
          cameraWidth + 3 * point,
          cameraWidth + 3 * point + 3,
        );
        for (let axis: number = 2; axis >= 0; axis--) {
          let value: number = local[axis]!;
          for (let column: number = 0; column < cameraWidth; column++)
            value -= triangle[axis]![3 + column]! * cameraStep[column]!;
          for (let next: number = axis + 1; next < 3; next++)
            value -= triangle[axis]![next]! * local[next]!;
          local[axis] = divide(value, triangle[axis]![axis]!);
        }
        for (let axis: number = 0; axis < 3; axis++)
          physical.push(local[axis]! / pointScales[point]![axis]!);
      }
      if (!physical.every(Number.isFinite))
        throw new Error("camera-feasible: nonrepresentable physical step");
      return physical;
    },
    toPhysicalCovector: (value: readonly number[]): number[] => {
      if (value.length !== width)
        throw new Error("camera-feasible: metric covector width mismatch");
      const physical: number[] = new Array<number>(width).fill(0);
      for (let column: number = 0; column < cameraWidth; column++)
        for (let row: number = 0; row <= column; row++)
          physical[column]! += camera[row]![column]! * value[row]!;
      for (let point: number = 0; point < triangles.length; point++) {
        const triangle: readonly (readonly number[])[] = triangles[point]!;
        for (let row: number = 0; row < 3; row++) {
          const at: number = cameraWidth + 3 * point + row;
          for (let column: number = row; column < 3; column++)
            physical[cameraWidth + 3 * point + column]! +=
              triangle[row]![column]! * value[at]!;
          for (let column: number = 0; column < cameraWidth; column++)
            physical[column]! += triangle[row]![3 + column]! * value[at]!;
        }
        for (let axis: number = 0; axis < 3; axis++)
          physical[cameraWidth + 3 * point + axis]! *= pointScales[point]![axis]!;
      }
      for (let axis: number = 0; axis < cameraWidth; axis++)
        physical[axis]! *= cameraScales[axis]!;
      if (!physical.every(Number.isFinite))
        throw new Error("camera-feasible: nonrepresentable physical covector");
      return physical;
    },
  };
}
