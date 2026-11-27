import type {
  IAutoMovieRecoveryMapCurvatureBlocks,
  IAutoMovieRecoveryMapCurvatureFit,
  IAutoMovieRecoveryMapTriangularMetric,
  IAutoMovieSimplexAtom,
} from "@automovie/interface";

import { createRecoveryMapTriangularMetric } from "./createRecoveryMapTriangularMetric";
import { validateRecoveryMapMetricRow } from "../../internal/validateRecoveryMapMetricRow";
import { validateRecoveryMapMetricScales } from "../../internal/validateRecoveryMapMetricScales";

/** Factor one owned scaled arrowhead and preflight all fixed physical rows. */
export function factorRecoveryMapCurvature(
  blocks: IAutoMovieRecoveryMapCurvatureBlocks,
  cameraScales: readonly number[],
  pointScales: readonly (readonly number[])[],
  physicalRows: readonly IAutoMovieSimplexAtom[],
): IAutoMovieRecoveryMapCurvatureFit {
  const cameraWidth: number = cameraScales.length;
  validateRecoveryMapMetricScales(cameraScales, pointScales);
  if (
    blocks.camera.length !== cameraWidth ||
    blocks.points.length !== pointScales.length
  )
    throw new Error(
      "camera-curvature: matching owned arrowhead shapes required",
    );
  for (let axis: number = 0; axis < cameraWidth; axis++) {
    const row: number[] | undefined = blocks.camera[axis];
    if (row?.length !== cameraWidth)
      throw new Error(
        "camera-curvature: matching owned arrowhead shapes required",
      );
  }
  for (let point: number = 0; point < blocks.points.length; point++) {
    const rows: number[][] | undefined = blocks.points[point];
    if (rows?.length !== 3)
      throw new Error(
        "camera-curvature: matching owned arrowhead shapes required",
      );
    for (let axis: number = 0; axis < 3; axis++) {
      const row: number[] | undefined = rows[axis];
      if (row?.length !== cameraWidth + 3)
        throw new Error(
          "camera-curvature: matching owned arrowhead shapes required",
        );
    }
  }
  for (const row of physicalRows)
    validateRecoveryMapMetricRow(row, cameraWidth + 3 * pointScales.length);
  for (const point of blocks.points) {
    for (let axis: number = 0; axis < 3; axis++) {
      let value: number = point[axis]![axis]!;
      for (let previous: number = 0; previous < axis; previous++)
        value -= point[previous]![axis]! ** 2;
      if (!(value > 0))
        return { metric: null, rows: null, reason: "point-pivot" };
      const root: number = Math.sqrt(value);
      if (!(root > 0))
        return { metric: null, rows: null, reason: "point-pivot" };
      point[axis]![axis] = root;
      for (let column: number = axis + 1; column < cameraWidth + 3; column++) {
        value = point[axis]![column]!;
        for (let previous: number = 0; previous < axis; previous++)
          value -= point[previous]![axis]! * point[previous]![column]!;
        value /= root;
        if (value === Infinity || value === -Infinity)
          return { metric: null, rows: null, reason: "point-pivot" };
        point[axis]![column] = value;
      }
    }
    for (let axis: number = 0; axis < cameraWidth; axis++)
      for (let column: number = axis; column < cameraWidth; column++) {
        let value: number = blocks.camera[axis]![column]!;
        for (let component: number = 0; component < 3; component++)
          value -=
            point[component]![3 + axis]! * point[component]![3 + column]!;
        if (value === Infinity || value === -Infinity)
          return { metric: null, rows: null, reason: "camera-pivot" };
        blocks.camera[axis]![column] = value;
      }
  }
  for (let axis: number = 0; axis < cameraWidth; axis++) {
    let value: number = blocks.camera[axis]![axis]!;
    for (let previous: number = 0; previous < axis; previous++)
      value -= blocks.camera[previous]![axis]! ** 2;
    if (!(value > 0))
      return { metric: null, rows: null, reason: "camera-pivot" };
    const root: number = Math.sqrt(value);
    if (!(root > 0))
      return { metric: null, rows: null, reason: "camera-pivot" };
    blocks.camera[axis]![axis] = root;
    for (let column: number = axis + 1; column < cameraWidth; column++) {
      value = blocks.camera[axis]![column]!;
      for (let previous: number = 0; previous < axis; previous++)
        value -=
          blocks.camera[previous]![axis]! * blocks.camera[previous]![column]!;
      value /= root;
      if (value === Infinity || value === -Infinity)
        return { metric: null, rows: null, reason: "camera-pivot" };
      blocks.camera[axis]![column] = value;
    }
  }
  const metric: IAutoMovieRecoveryMapTriangularMetric =
    createRecoveryMapTriangularMetric(
      blocks.points,
      blocks.camera,
      pointScales,
      cameraScales,
    );
  const rows: IAutoMovieSimplexAtom[] = [];
  for (const physical of physicalRows) {
    const row: IAutoMovieSimplexAtom | null = metric.tryWhiten(physical);
    if (row === null)
      return { metric: null, rows: null, reason: "row-whitening" };
    rows.push(row);
  }
  return { metric, rows, reason: null };
}
