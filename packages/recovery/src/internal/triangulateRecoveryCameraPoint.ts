import { AutoMovieMatrix3 } from "@automovie/engine/math/AutoMovieMatrix3";
import { Vector3 } from "@automovie/engine/math/Vector3";
import { decomposeAutoMovieSingularMatrix } from "@automovie/engine/math/decomposeAutoMovieSingularMatrix";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { createRecoveryCameraChart } from "./createRecoveryCameraChart";

/**
 * Triangulate one observation pair in the first-camera, unit-baseline gauge.
 * Original 4-by-4 DLT uses calibrated rays and P1=[I|0], P2=[R|t]. An unresolved
 * third design direction, point at infinity or nonfinite divided coordinate
 * returns null; a finite point behind a camera remains explicitly nonpositive.
 * Invalid or overflowing matrix actions and SVD nonconvergence throw.
 * This algebraic point is fitting evidence, not an independently observed surface.
 *
 * @evidence contracts/common.md#principled-implementation Two cross-product projection equations per camera define the original homogeneous DLT design. Its last right singular direction yields a finite point only when rank and division resolve; camera depths, actual calibrated pixel reprojection and ray angle are then measured separately.
 * @evidence contracts/common.md#clear-and-simple-design One pair-level helper keeps the first-camera gauge and geometric diagnostics together; the caller aggregates four-pose cheirality and decides the minimum admissible parallax.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No positive-depth clamp, guessed finite point, regularization, metric-scale claim or source mesh supplies a missing triangulation. Invalid or overflowing matrix actions and SVD nonconvergence propagate instead of passing as geometry.
 * @evidence contracts/common.md#meaningful-documentation States row-major world-to-second convention, first-camera gauge, null reasons, signed-depth handling, pixel units and sparse fitting-only status.
 * @evidence contracts/performance.md#efficient-algorithms One bounded 4-by-4 original-design SVD and fixed-size projections cost O(S) time and constant temporary memory per pair.
 * @evidence contracts/performance.md#reuse-equivalent-work The calibrated rays serve both DLT and parallax; the single reconstructed point serves depths and both independent pixel reprojections.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only an owned three-coordinate point and scalar diagnostics escape; call-local factors and rays expire, and no image, process or cache remains.
 */
export function triangulateRecoveryCameraPoint(
  firstPoint: readonly [number, number],
  secondPoint: readonly [number, number],
  first: ReturnType<typeof createRecoveryCameraChart>,
  second: ReturnType<typeof createRecoveryCameraChart>,
  pose: {
    rotation: readonly number[];
    translation: readonly [number, number, number];
  },
  minimumDesignRatio: number,
  maxSweeps: number,
): {
  point: [number, number, number];
  firstDepth: number;
  secondDepth: number;
  positiveDepth: boolean;
  parallaxRadians: number;
  firstReprojectionPx: number;
  secondReprojectionPx: number;
} | null {
  const ray1: [number, number, number] = AutoMovieMatrix3.apply(first.inverse, [
    ...firstPoint,
    1,
  ]);
  const ray2: [number, number, number] = AutoMovieMatrix3.apply(
    second.inverse,
    [...secondPoint, 1],
  );
  const r: readonly number[] = pose.rotation;
  const t: readonly number[] = pose.translation;
  const rows: number[][] = [
    [-1, 0, ray1[0], 0],
    [0, -1, ray1[1], 0],
    [
      ray2[0] * r[6]! - r[0]!,
      ray2[0] * r[7]! - r[1]!,
      ray2[0] * r[8]! - r[2]!,
      ray2[0] * t[2]! - t[0]!,
    ],
    [
      ray2[1] * r[6]! - r[3]!,
      ray2[1] * r[7]! - r[4]!,
      ray2[1] * r[8]! - r[5]!,
      ray2[1] * t[2]! - t[1]!,
    ],
  ];
  const factors: ReturnType<typeof decomposeAutoMovieSingularMatrix> =
    decomposeAutoMovieSingularMatrix(rows, {
      maxEntries: 16,
      maxSweeps,
      orthogonalityTolerance: 1e-12,
    });
  const ratio: number = factors.singularValues[2]! / factors.singularValues[0]!;
  if (!Number.isFinite(ratio) || ratio < minimumDesignRatio) return null;
  const homogeneous: number[] = factors.rightColumns[3]!;
  if (homogeneous[3] === 0) return null;
  const point: [number, number, number] = [
    homogeneous[0]! / homogeneous[3]!,
    homogeneous[1]! / homogeneous[3]!,
    homogeneous[2]! / homogeneous[3]!,
  ];
  if (!point.every(Number.isFinite)) return null;
  const rotated: [number, number, number] = AutoMovieMatrix3.apply(r, point);
  const inSecond: [number, number, number] = [
    rotated[0] + t[0]!,
    rotated[1] + t[1]!,
    rotated[2] + t[2]!,
  ];
  if (!inSecond.every(Number.isFinite) || point[2] === 0 || inSecond[2] === 0)
    return null;
  // Direction comparison requires R-transpose, not a camera-centre displacement;
  // translation determines triangulation but does not transform a free ray.
  const backRay: [number, number, number] = AutoMovieMatrix3.apply(
    AutoMovieMatrix3.transpose(r),
    ray2,
  );
  const norm1: number = Math.hypot(...ray1);
  const norm2: number = Math.hypot(...backRay);
  if (
    !(norm1 > 0) ||
    !(norm2 > 0) ||
    !Number.isFinite(norm1) ||
    !Number.isFinite(norm2)
  )
    return null;
  const unit1: IAutoMovieVector3 = {
    x: ray1[0] / norm1,
    y: ray1[1] / norm1,
    z: ray1[2] / norm1,
  };
  const unit2: IAutoMovieVector3 = {
    x: backRay[0] / norm2,
    y: backRay[1] / norm2,
    z: backRay[2] / norm2,
  };
  const cross: IAutoMovieVector3 = Vector3.cross(unit1, unit2);
  const parallaxRadians: number = Math.atan2(
    Math.hypot(cross.x, cross.y, cross.z),
    Vector3.dot(unit1, unit2),
  );
  const projection1: [number, number, number] = AutoMovieMatrix3.apply(
    first.matrix,
    [point[0] / point[2], point[1] / point[2], 1],
  );
  const projection2: [number, number, number] = AutoMovieMatrix3.apply(
    second.matrix,
    [inSecond[0] / inSecond[2], inSecond[1] / inSecond[2], 1],
  );
  const firstReprojectionPx: number = Math.hypot(
    projection1[0] - firstPoint[0],
    projection1[1] - firstPoint[1],
  );
  const secondReprojectionPx: number = Math.hypot(
    projection2[0] - secondPoint[0],
    projection2[1] - secondPoint[1],
  );
  if (
    ![parallaxRadians, firstReprojectionPx, secondReprojectionPx].every(
      Number.isFinite,
    )
  )
    return null;
  return {
    point,
    firstDepth: point[2],
    secondDepth: inSecond[2],
    positiveDepth: point[2] > 0 && inSecond[2] > 0,
    parallaxRadians,
    firstReprojectionPx,
    secondReprojectionPx,
  };
}
