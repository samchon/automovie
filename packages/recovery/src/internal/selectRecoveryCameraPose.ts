import { calibrateRecoveryEpipolarMatrix } from "./calibrateRecoveryEpipolarMatrix";
import type { createRecoveryCameraChart } from "./createRecoveryCameraChart";
import { triangulateRecoveryCameraPoint } from "./triangulateRecoveryCameraPoint";

/**
 * Measure all four calibrated pose branches on one fixed correspondence set.
 * The largest positive-depth count supplies a candidate; equal winning counts
 * remain explicitly ambiguous even though deterministic order names a candidate.
 * Parallax is summarized only for finite points positive in both cameras.
 *
 * @evidence contracts/common.md#principled-implementation Essential decomposition retains both rotations and both translation signs. Original-design triangulation measures each branch's actual depths; the positive-depth maximum is the classical cheirality choice, and the median ray angle conditions its baseline rather than claiming scale or physical truth.
 * @evidence contracts/common.md#clear-and-simple-design One owner aggregates pair-level geometry into the candidate and all competing counts; its caller must still check a unique winner, positive fraction, pixel errors, parallax and a homography explanation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No expected camera, forced positive point, discarded failed triangulation or tie-breaking pose is presented as unique. Null points remain in the candidate's original observation-order evidence.
 * @evidence contracts/common.md#meaningful-documentation States four-branch population, tie meaning, original observation order, finite-positive parallax subset and unit-baseline uncertainty.
 * @evidence contracts/performance.md#efficient-algorithms N pairs require four bounded 4-by-4 triangulations each and median sorting of at most N angles, with O(N) candidate storage rather than retaining four complete point populations.
 * @evidence contracts/performance.md#reuse-equivalent-work One essential projection supplies all four poses; each branch's triangulations supply both its depth count and parallax without another reconstruction.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the current best O(N) point evidence and four scalar counts survive; replaced candidates become unreachable, and no image, cache or external handle is retained.
 */
export function selectRecoveryCameraPose(
  fundamental: readonly number[],
  firstPoints: readonly (readonly [number, number])[],
  secondPoints: readonly (readonly [number, number])[],
  first: ReturnType<typeof createRecoveryCameraChart>,
  second: ReturnType<typeof createRecoveryCameraChart>,
  minimumDesignRatio: number,
  maxSweeps: number,
): {
  rotation: number[];
  translation: [number, number, number];
  fundamental: number[];
  points: ReturnType<typeof triangulateRecoveryCameraPoint>[];
  allPositiveDepthCounts: number[];
  positiveDepthFraction: number;
  medianParallaxRadians: number | null;
  uniqueWinner: boolean;
  relativeProjectionDiscrepancy: number;
} {
  if (firstPoints.length === 0 || firstPoints.length !== secondPoints.length)
    throw new Error("camera-pose: nonempty paired pose evidence required");
  const calibrated: ReturnType<typeof calibrateRecoveryEpipolarMatrix> =
    calibrateRecoveryEpipolarMatrix(fundamental, first, second, maxSweeps);
  const counts: number[] = [];
  let best: {
    pose: (typeof calibrated.poses)[number];
    points: ReturnType<typeof triangulateRecoveryCameraPoint>[];
    positive: number;
    angles: number[];
  } | null = null;
  for (const pose of calibrated.poses) {
    const points: ReturnType<typeof triangulateRecoveryCameraPoint>[] = [];
    const angles: number[] = [];
    for (let at: number = 0; at < firstPoints.length; at++) {
      const point: ReturnType<typeof triangulateRecoveryCameraPoint> =
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
