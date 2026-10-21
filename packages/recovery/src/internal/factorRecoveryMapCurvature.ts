import type { IAutoMovieSimplexAtom } from "@automovie/engine/math/IAutoMovieSimplexAtom";

import type { IAutoMovieRecoveryMapCurvatureBlocks } from "../structures/internal/IAutoMovieRecoveryMapCurvatureBlocks";
import type { IAutoMovieRecoveryMapCurvatureFit } from "../structures/internal/IAutoMovieRecoveryMapCurvatureFit";
import type { IAutoMovieRecoveryMapTriangularMetric } from "../structures/internal/IAutoMovieRecoveryMapTriangularMetric";
import { createRecoveryMapTriangularMetric } from "./createRecoveryMapTriangularMetric";
import { validateRecoveryMapMetricRow } from "./validateRecoveryMapMetricRow";
import { validateRecoveryMapMetricScales } from "./validateRecoveryMapMetricScales";

/**
 * Factor one owned scaled arrowhead and preflight all fixed physical rows.
 *
 * @evidence contracts/common.md#principled-implementation Unpivoted positive point Cholesky and R_point^-T cross solves produce the camera Schur B-sum(R_cross^T R_cross), followed by positive camera Cholesky. The computed finite positive factor defines R^T R numerically, without certifying intended-Hessian accuracy or conditioning.
 * @evidence contracts/common.md#clear-and-simple-design One in-place owner returns only a complete factor/row pair or a stage-specific optional arithmetic refusal. Its caller still owns original independent rank and whole-GN fallback before model return.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No inverse, eigenvalue shift, pivot floor, clipping, tolerance-derived rescue or second factor is attempted. Malformed shapes throw and no exception is caught as optional support.
 * @evidence contracts/common.md#meaningful-documentation Consumes exclusively owned upper blocks in original D-scaled units. Points eliminate before camera; fixed-row preflight proves no universal future-vector support, and ordinary actions continue throwing after model return.
 * @evidence contracts/performance.md#efficient-algorithms Point/cross work O(LC), Schur O(LC^2), camera factor O(C^3), and all fixed-row whitening O(LC+C^2+E(C^2+C)) fit the owner's prepaid polynomial attempt. Input shape visits and all failed prefixes are included without refunds.
 * @evidence contracts/performance.md#reuse-equivalent-work The owned blocks become factors in place and one triangular action family supplies both preflight and later actions. No duplicate full Hessian, point inverse or observation history remains.
 * @evidence contracts/performance.md#bound-retention-and-release-resources At most C^2+3L(C+3) factor entries coexist with complete/partial row copies and O(n) whitening scratch under A. Refusal returns no retained factor or partial row; support transfers one matched pair for this model.
 */
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
    for (let column: number = 0; column < cameraWidth; column++)
      if (typeof row[column] !== "number")
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
      for (let column: number = 0; column < cameraWidth + 3; column++)
        if (typeof row[column] !== "number")
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
      if (!(value > 0) || !Number.isFinite(value))
        return { metric: null, rows: null, reason: "point-pivot" };
      const root: number = Math.sqrt(value);
      if (!(root > 0) || !Number.isFinite(root))
        return { metric: null, rows: null, reason: "point-pivot" };
      point[axis]![axis] = root;
      for (let column: number = axis + 1; column < cameraWidth + 3; column++) {
        value = point[axis]![column]!;
        for (let previous: number = 0; previous < axis; previous++)
          value -= point[previous]![axis]! * point[previous]![column]!;
        value /= root;
        if (!Number.isFinite(value))
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
        if (!Number.isFinite(value))
          return { metric: null, rows: null, reason: "camera-pivot" };
        blocks.camera[axis]![column] = value;
      }
  }
  for (let axis: number = 0; axis < cameraWidth; axis++) {
    let value: number = blocks.camera[axis]![axis]!;
    for (let previous: number = 0; previous < axis; previous++)
      value -= blocks.camera[previous]![axis]! ** 2;
    if (!(value > 0) || !Number.isFinite(value))
      return { metric: null, rows: null, reason: "camera-pivot" };
    const root: number = Math.sqrt(value);
    if (!(root > 0) || !Number.isFinite(root))
      return { metric: null, rows: null, reason: "camera-pivot" };
    blocks.camera[axis]![axis] = root;
    for (let column: number = axis + 1; column < cameraWidth; column++) {
      value = blocks.camera[axis]![column]!;
      for (let previous: number = 0; previous < axis; previous++)
        value -=
          blocks.camera[previous]![axis]! * blocks.camera[previous]![column]!;
      value /= root;
      if (!Number.isFinite(value))
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
