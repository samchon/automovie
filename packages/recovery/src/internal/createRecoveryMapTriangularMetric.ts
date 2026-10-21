import type { IAutoMovieSimplexAtom } from "@automovie/engine/math/IAutoMovieSimplexAtom";

import type { IAutoMovieRecoveryMapTriangularMetric } from "../structures/internal/IAutoMovieRecoveryMapTriangularMetric";
import { validateRecoveryMapMetricRow } from "./validateRecoveryMapMetricRow";
import { validateRecoveryMapMetricScales } from "./validateRecoveryMapMetricScales";

/**
 * Bind one point-first upper factor and original column scales to its actions.
 *
 * @evidence contracts/common.md#principled-implementation R_point and its camera cross tail precede R_camera in point-first order. R^-T physical covectors, R^-1 steps and D R^T metric covectors use exactly these arrays and original positive column scales without an inverse or full Gram matrix.
 * @evidence contracts/common.md#clear-and-simple-design QR and optional Cholesky producers share triangular actions while owning their independent factor formation and support. Nullable whitening belongs to pre-return model selection; public actions throw thereafter.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Zero pivots and nonfinite solves do not become zero directions or late GN substitutions. These actions supply no independent data rank or intended-Hessian accuracy certificate.
 * @evidence contracts/common.md#meaningful-documentation Physical order is camera then points, with point-first elimination inside the factor. Inputs are owned current factors/scales whose caller has admitted dimensions and lifetime.
 * @evidence contracts/performance.md#efficient-algorithms One O(LC+C^2+n) invariant finite-factor/positive-scale check precedes actions; each row adds one O(Zrow) ownership pass. GN moves its existing point-factor finite scan here rather than duplicating it. A k-point covector costs O(kC+C^2), full inverse/transpose actions O(LC+C^2), with O(n) output/scratch. Caller work envelopes include these scans, every fixed row and subsequent admitted direction/auxiliary action.
 * @evidence contracts/performance.md#reuse-equivalent-work One current factor and shared original D supply all three actions and preflight, retaining the original substitution and accumulation order for GN consumers.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Closures retain C^2+3L(C+4) entries for original GN factors, or C^2+3L(C+3) for curvature, plus shared O(n) scales for one model. The GN transformed-right column is retained but unused by actions. Current owned factor/scale inputs stay live; borrowed row/step/covector inputs never escape. Extra fixed action shells/reference fields fit the original128 constant slots, with no numeric copies.
 */
export function createRecoveryMapTriangularMetric(
  triangles: readonly (readonly (readonly number[])[])[],
  camera: readonly (readonly number[])[],
  pointScales: readonly (readonly number[])[],
  cameraScales: readonly number[],
): IAutoMovieRecoveryMapTriangularMetric {
  const cameraWidth: number = cameraScales.length;
  const width: number = cameraWidth + 3 * triangles.length;
  validateRecoveryMapMetricScales(cameraScales, pointScales);
  if (camera.length !== cameraWidth || pointScales.length !== triangles.length)
    throw new Error(
      "camera-feasible: matching owned factor and positive original scales required",
    );
  for (let axis: number = 0; axis < cameraWidth; axis++) {
    const row: readonly number[] | undefined = camera[axis];
    if (row?.length !== cameraWidth)
      throw new Error(
        "camera-feasible: matching owned factor and positive original scales required",
      );
    for (let column: number = 0; column < cameraWidth; column++)
      if (!Number.isFinite(row[column]))
        throw new Error(
          "camera-feasible: matching owned factor and positive original scales required",
        );
  }
  for (let point: number = 0; point < triangles.length; point++) {
    const rows: readonly (readonly number[])[] | undefined = triangles[point];
    if (rows?.length !== 3)
      throw new Error(
        "camera-feasible: matching owned factor and positive original scales required",
      );
    for (let axis: number = 0; axis < 3; axis++) {
      const row: readonly number[] | undefined = rows[axis];
      if (
        row === undefined ||
        row.length < cameraWidth + 3 ||
        row.length > cameraWidth + 4
      )
        throw new Error(
          "camera-feasible: matching owned factor and positive original scales required",
        );
      for (let column: number = 0; column < row.length; column++)
        if (!Number.isFinite(row[column]))
          throw new Error(
            "camera-feasible: matching owned factor and positive original scales required",
          );
    }
  }
  const divide: (value: number, pivot: number) => number = (
    value: number,
    pivot: number,
  ): number => {
    const answer: number = value / pivot;
    if (pivot === 0 || !Number.isFinite(answer))
      throw new Error("camera-feasible: unresolved triangular metric action");
    return answer;
  };
  const tryWhiten: (
    row: IAutoMovieSimplexAtom,
  ) => IAutoMovieSimplexAtom | null = (
    row: IAutoMovieSimplexAtom,
  ): IAutoMovieSimplexAtom | null => {
    validateRecoveryMapMetricRow(row, width);
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
        right[axis] = value / triangular[axis]![axis]!;
        if (triangular[axis]![axis] === 0 || !Number.isFinite(right[axis]))
          return null;
      }
      for (let column: number = 0; column < cameraWidth; column++)
        for (let axis: number = 0; axis < 3; axis++)
          cameraRight[column]! -= triangular[axis]![3 + column]! * right[axis]!;
    }
    for (let axis: number = 0; axis < cameraWidth; axis++) {
      let value: number = cameraRight[axis]!;
      for (let previous: number = 0; previous < axis; previous++)
        value -= camera[previous]![axis]! * cameraRight[previous]!;
      cameraRight[axis] = value / camera[axis]![axis]!;
      if (camera[axis]![axis] === 0 || !Number.isFinite(cameraRight[axis]))
        return null;
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
  };
  return {
    width,
    tryWhiten,
    whiten: (row: IAutoMovieSimplexAtom): IAutoMovieSimplexAtom => {
      const result: IAutoMovieSimplexAtom | null = tryWhiten(row);
      if (result === null)
        throw new Error("camera-feasible: unresolved triangular metric action");
      return result;
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
          physical[cameraWidth + 3 * point + axis]! *=
            pointScales[point]![axis]!;
      }
      for (let axis: number = 0; axis < cameraWidth; axis++)
        physical[axis]! *= cameraScales[axis]!;
      if (!physical.every(Number.isFinite))
        throw new Error("camera-feasible: nonrepresentable physical covector");
      return physical;
    },
  };
}
