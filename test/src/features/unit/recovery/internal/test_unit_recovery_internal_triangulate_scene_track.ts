import type {
  IAutoMovieRecoveryCameraMapPolicy,
  IAutoMovieRecoveryMapObservation,
  IAutoMovieRecoveryMapPose,
} from "@automovie/interface";
import { triangulateRecoverySceneTrack } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { recoveryStereoChart as chart } from "./recoveryStereoChart";

/**
 * Track triangulation retains the registered world gauge and reason codes.
 *
 * Scenarios:
 *
 * 1. The same stereo setup with twice the baseline sends (1, 2, 4) to (0, 1, 4) in
 *    camera two. Neither observation uses registered index zero. The recovered
 *    coordinates are in that original gauge.
 * 2. Repeated view indices fail as indistinct. A missing pose fails as
 *    unregistered. A parallax policy above the ray angle refuses the point.
 */
export function test_unit_recovery_internal_triangulate_scene_track(): void {
  const observations: IAutoMovieRecoveryMapObservation[] = [
    { viewIndex: 1, featureIndex: 0, pixel: chart.firstPixel },
    { viewIndex: 2, featureIndex: 7, pixel: [-3, 5] },
  ];
  const poses: (IAutoMovieRecoveryMapPose | null)[] = [
    null,
    chart.identity,
    { ...chart.pose, translation: [2, 0, 0] },
  ];
  const charts: Parameters<typeof triangulateRecoverySceneTrack>[2] = [
    chart.first,
    chart.first,
    chart.second,
  ];
  const policy: IAutoMovieRecoveryCameraMapPolicy = {
    maximumReprojectionErrorPx: 1 / 16,
    minimumPointParallaxDegrees: 1,
    minimumResectionInliers: 6,
    minimumResectionInlierFraction: 1 / 2,
    samplingConfidence: 1 / 2,
    samplingSeed: 1,
    minimumDesignSingularRatio: chart.minimumRatio,
    maximumDltNullRatio: 1 / 256,
    maximumRotationProjectionError: 1 / 16,
    lossScalePx: 1,
  };
  const good: ReturnType<typeof triangulateRecoverySceneTrack> =
    triangulateRecoverySceneTrack(
      observations,
      poses,
      charts,
      policy,
      chart.budget,
    );
  TestValidator.equals("no refusal", good.reasons, []);
  TestValidator.predicate(
    "point uses the given metric baseline",
    good.point !== null &&
      good.point.every((value: number, index: number): boolean =>
        nclose(value, [1, 2, 4][index]!, chart.projectionTolerance),
      ),
  );
  TestValidator.equals(
    "two readings of the same view",
    triangulateRecoverySceneTrack(
      [observations[0]!, observations[0]!],
      poses,
      charts,
      policy,
      chart.budget,
    ),
    { point: null, reasons: ["insufficient-distinct-point-observations"] },
  );
  TestValidator.equals(
    "unregistered view",
    triangulateRecoverySceneTrack(
      observations,
      [null, chart.identity, null],
      charts,
      policy,
      chart.budget,
    ),
    { point: null, reasons: ["unregistered-point-observation"] },
  );
  TestValidator.equals(
    "parallax floor rejects the measured angle",
    triangulateRecoverySceneTrack(
      observations,
      poses,
      charts,
      { ...policy, minimumPointParallaxDegrees: 45 },
      chart.budget,
    ),
    { point: null, reasons: ["low-point-parallax"] },
  );
}
