import { selectRecoveryCameraPose } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { recoveryStereoChart as chart } from "./recoveryStereoChart";

/**
 * Pose selection ranks the four admissible branches by positive depth.
 *
 * Scenarios:
 *
 * 1. One finite stereo observation is positive only under the true branch.
 * 2. An observation at infinity cannot separate the four branches by score. Its
 *    summary has no positive-point parallax and no unique winner.
 * 3. Absent pairing refuses before calibration or triangulation.
 */
export function test_recovery_internal_select_camera_pose(): void {
  const select = (
    first: [number, number][],
    second: [number, number][],
  ): ReturnType<typeof selectRecoveryCameraPose> =>
    selectRecoveryCameraPose(
      chart.fundamental,
      first,
      second,
      chart.first,
      chart.second,
      chart.minimumRatio,
      chart.budget.maxSingularSweeps,
    );
  const finite: ReturnType<typeof select> = select(
    [chart.firstPixel],
    [chart.secondPixel],
  );
  TestValidator.predicate(
    "one winning branch",
    finite.uniqueWinner &&
      finite.positiveDepthFraction === 1 &&
      finite.allPositiveDepthCounts.length === 4 &&
      finite.allPositiveDepthCounts.filter(
        (count: number): boolean => count === 1,
      ).length === 1,
  );
  TestValidator.predicate(
    "winner and positive-ray summary",
    finite.rotation.every((value: number, index: number): boolean =>
      nclose(value, chart.pose.rotation[index]!, chart.projectionTolerance),
    ) &&
      finite.translation.every((value: number, index: number): boolean =>
        nclose(
          value,
          chart.pose.translation[index]!,
          chart.projectionTolerance,
        ),
      ) &&
      finite.medianParallaxRadians !== null &&
      nclose(
        finite.medianParallaxRadians,
        Math.atan2(Math.sqrt(17), 19),
        chart.projectionTolerance,
      ),
  );
  const distant: ReturnType<typeof select> = select(
    [chart.firstPixel],
    [[-7, 5]],
  );
  TestValidator.equals(
    "a tied count stays ambiguous",
    [
      distant.uniqueWinner,
      distant.positiveDepthFraction,
      distant.medianParallaxRadians,
    ],
    [false, 0, null],
  );
  TestValidator.error("unpaired data", (): unknown =>
    select([chart.firstPixel], []),
  );
}
