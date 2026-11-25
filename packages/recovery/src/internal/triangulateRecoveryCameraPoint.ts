import {
  AutoMovieMatrix3,
  Vector3,
  decomposeAutoMovieSingularMatrix,
} from "@automovie/engine";
import type {
  IAutoMovieRecoveryCameraPointTriangulationOperation,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Resolution of the sine between normalized camera rays. Each component is
 * bounded by one. Allow 16 binary64 rounding units for rotation, normalization
 * and the difference of the two products in each cross-product component.
 */
const PARALLEL_RAY_RESOLUTION: number = 16 * Number.EPSILON;

/**
 * Triangulate one observation pair in the first-camera, unit-baseline gauge.
 * Original 4-by-4 DLT uses calibrated rays and P1=[I|0], P2=[R|t]. An
 * unresolved third design direction, parallel ray pair, point at infinity or
 * nonfinite divided coordinate returns null. A finite point behind a camera
 * remains explicitly nonpositive. Invalid or overflowing matrix actions and SVD
 * nonconvergence throw. This algebraic point is fitting evidence, not an
 * independently observed surface.
 */
export function triangulateRecoveryCameraPoint(
  firstPoint: Parameters<IAutoMovieRecoveryCameraPointTriangulationOperation.Operation>[0],
  secondPoint: Parameters<IAutoMovieRecoveryCameraPointTriangulationOperation.Operation>[1],
  first: Parameters<IAutoMovieRecoveryCameraPointTriangulationOperation.Operation>[2],
  second: Parameters<IAutoMovieRecoveryCameraPointTriangulationOperation.Operation>[3],
  pose: Parameters<IAutoMovieRecoveryCameraPointTriangulationOperation.Operation>[4],
  minimumDesignRatio: Parameters<IAutoMovieRecoveryCameraPointTriangulationOperation.Operation>[5],
  maxSweeps: Parameters<IAutoMovieRecoveryCameraPointTriangulationOperation.Operation>[6],
): ReturnType<IAutoMovieRecoveryCameraPointTriangulationOperation.Operation> {
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

  // Parallel rays do not determine depth. Read the angle before the DLT, whose
  // rounded null vector can give a point at infinity a tiny nonzero weight.
  const parallaxRadians: number | null = measureParallax(ray1, ray2, r);
  if (parallaxRadians === null) return null;

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
  if (factors.singularValues[0] === 0 || ratio < minimumDesignRatio)
    return null;
  const homogeneous: number[] = factors.rightColumns[3]!;
  if (homogeneous[3] === 0) return null;
  const point: [number, number, number] = [
    homogeneous[0]! / homogeneous[3]!,
    homogeneous[1]! / homogeneous[3]!,
    homogeneous[2]! / homogeneous[3]!,
  ];
  const rotated: [number, number, number] = AutoMovieMatrix3.apply(r, point);
  const inSecond: [number, number, number] = [
    rotated[0] + t[0]!,
    rotated[1] + t[1]!,
    rotated[2] + t[2]!,
  ];
  // A near-zero homogeneous weight overflows the point it divides.
  if (
    [...point, ...inSecond].some(
      (value: number): boolean => value === Infinity || value === -Infinity,
    ) ||
    point[2] === 0 ||
    inSecond[2] === 0
  )
    return null;
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
  if (firstReprojectionPx === Infinity || secondReprojectionPx === Infinity)
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

/** Measure the resolved angle between calibrated free rays in the first frame. */
function measureParallax(
  first: readonly [number, number, number],
  second: readonly [number, number, number],
  rotation: readonly number[],
): number | null {
  // A free ray rotates into the first frame without a camera-centre shift.
  const backward: [number, number, number] = AutoMovieMatrix3.apply(
    AutoMovieMatrix3.transpose(rotation),
    second,
  );
  const norm1: number = Math.hypot(...first);
  const norm2: number = Math.hypot(...backward);
  if (!(norm1 > 0) || !(norm2 > 0) || norm1 === Infinity || norm2 === Infinity)
    return null;
  const unit1: IAutoMovieVector3 = {
    x: first[0] / norm1,
    y: first[1] / norm1,
    z: first[2] / norm1,
  };
  const unit2: IAutoMovieVector3 = {
    x: backward[0] / norm2,
    y: backward[1] / norm2,
    z: backward[2] / norm2,
  };
  const cross: IAutoMovieVector3 = Vector3.cross(unit1, unit2);
  const sine: number = Math.hypot(cross.x, cross.y, cross.z);
  if (!(sine > PARALLEL_RAY_RESOLUTION)) return null;
  return Math.atan2(sine, Vector3.dot(unit1, unit2));
}
