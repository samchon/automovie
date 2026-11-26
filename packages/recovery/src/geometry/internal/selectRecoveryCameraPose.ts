import type {
  IAutoMovieRecoveryCameraPointTriangulationOperation,
  IAutoMovieRecoveryCameraPoseSelectionOperation,
  IAutoMovieRecoveryEpipolarMatrixCalibrateOperation,
} from "@automovie/interface";

import { calibrateRecoveryEpipolarMatrix } from "./calibrateRecoveryEpipolarMatrix";
import { triangulateRecoveryCameraPoint } from "../../internal/triangulateRecoveryCameraPoint";

/**
 * Measure all four calibrated pose branches on one fixed correspondence set.
 * The largest positive-depth count supplies a candidate; equal winning counts
 * remain explicitly ambiguous even though deterministic order names a
 * candidate. Parallax is summarized only for finite points positive in both
 * cameras.
 */
export function selectRecoveryCameraPose(
  fundamental: Parameters<IAutoMovieRecoveryCameraPoseSelectionOperation.Operation>[0],
  firstPoints: Parameters<IAutoMovieRecoveryCameraPoseSelectionOperation.Operation>[1],
  secondPoints: Parameters<IAutoMovieRecoveryCameraPoseSelectionOperation.Operation>[2],
  first: Parameters<IAutoMovieRecoveryCameraPoseSelectionOperation.Operation>[3],
  second: Parameters<IAutoMovieRecoveryCameraPoseSelectionOperation.Operation>[4],
  minimumDesignRatio: Parameters<IAutoMovieRecoveryCameraPoseSelectionOperation.Operation>[5],
  maxSweeps: Parameters<IAutoMovieRecoveryCameraPoseSelectionOperation.Operation>[6],
): ReturnType<IAutoMovieRecoveryCameraPoseSelectionOperation.Operation> {
  if (firstPoints.length === 0 || firstPoints.length !== secondPoints.length)
    throw new Error("camera-pose: nonempty paired pose evidence required");
  const calibrated: ReturnType<IAutoMovieRecoveryEpipolarMatrixCalibrateOperation.Operation> =
    calibrateRecoveryEpipolarMatrix(fundamental, first, second, maxSweeps);
  const counts: number[] = [];
  let best: {
    pose: (typeof calibrated.poses)[number];
    points: ReturnType<IAutoMovieRecoveryCameraPointTriangulationOperation.Operation>[];
    positive: number;
    angles: number[];
  } | null = null;
  for (const pose of calibrated.poses) {
    const points: ReturnType<IAutoMovieRecoveryCameraPointTriangulationOperation.Operation>[] =
      [];
    const angles: number[] = [];
    for (let at: number = 0; at < firstPoints.length; at++) {
      const point: ReturnType<IAutoMovieRecoveryCameraPointTriangulationOperation.Operation> =
        triangulateRecoveryCameraPoint(
          firstPoints[at]!,
          secondPoints[at]!,
          first,
          second,
          pose,
          minimumDesignRatio,
          maxSweeps,
        );
      points.push(point);
      if (point?.positiveDepth) angles.push(point.parallaxRadians);
    }
    counts.push(angles.length);
    if (best === null || angles.length > best.positive)
      best = { pose, points, positive: angles.length, angles };
  }
  if (best === null)
    throw new Error("camera-pose: nonempty paired pose evidence required");
  best.angles.sort((a: number, b: number): number => a - b);
  const middle: number = (best.angles.length - 1) / 2;
  return {
    ...best.pose,
    fundamental: calibrated.fundamental,
    points: best.points,
    allPositiveDepthCounts: counts,
    positiveDepthFraction: best.positive / firstPoints.length,
    medianParallaxRadians:
      best.angles.length === 0
        ? null
        : (best.angles[Math.floor(middle)]! + best.angles[Math.ceil(middle)]!) /
          2,
    uniqueWinner:
      counts.filter((count: number): boolean => count === best!.positive)
        .length === 1,
    relativeProjectionDiscrepancy: calibrated.relativeProjectionDiscrepancy,
  };
}
