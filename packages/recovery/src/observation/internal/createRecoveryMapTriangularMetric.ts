import type {
  IAutoMovieRecoveryMapTriangularMetric,
  IAutoMovieSimplexAtom,
} from "@automovie/interface";

import { validateRecoveryMapMetricRow } from "../../internal/validateRecoveryMapMetricRow";
import { validateRecoveryMapMetricScales } from "../../internal/validateRecoveryMapMetricScales";

/** Bind one point-first upper factor and original column scales to its actions. */
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
    }
  }
  const divide: (value: number, pivot: number) => number = (
    value: number,
    pivot: number,
  ): number => {
    const answer: number = value / pivot;
    if (pivot === 0 || overflowed(answer))
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
        if (triangular[axis]![axis] === 0 || overflowed(right[axis]!))
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
      if (camera[axis]![axis] === 0 || overflowed(cameraRight[axis]!))
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
      if (physical.some(overflowed))
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
      if (physical.some(overflowed))
        throw new Error("camera-feasible: nonrepresentable physical covector");
      return physical;
    },
  };
}

/** Whether a metric action entry overflowed binary64. */
function overflowed(value: number): boolean {
  return value === Infinity || value === -Infinity;
}
