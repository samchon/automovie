import { triangulateRecoveryCameraPoint } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { recoveryStereoChart as chart } from "./recoveryStereoChart";

/**
 * Triangulation recovers a calibrated point, its two depths and its ray angle.
 *
 * Scenarios:
 *
 * 1. The quarter-turn sends (1, 2, 4) to (-1, 1, 4). An independent ray dot and
 *    cross norm give atan2(√17, 19), and both projections have zero error.
 * 2. The projections of (1, 2, -4) still identify the point behind both cameras.
 * 3. Parallel, unshifted rays have no finite triangulation. A positive design
 *    below the requested rank ratio also returns null.
 */
export function test_recovery_internal_triangulate_camera_point(): void {
  const solve = (
    first: [number, number],
    second: [number, number],
    ratio: number = chart.minimumRatio,
  ): ReturnType<typeof triangulateRecoveryCameraPoint> =>
    triangulateRecoveryCameraPoint(
      first,
      second,
      chart.first,
      chart.second,
      chart.pose,
      ratio,
      chart.budget.maxSingularSweeps,
    );
  const front: ReturnType<typeof solve> = solve(
    chart.firstPixel,
    chart.secondPixel,
  );
  const back: ReturnType<typeof solve> = solve([1, -5], [-1, -3]);
  TestValidator.predicate(
    "calibrated front point and angle",
    front !== null &&
      front.positiveDepth &&
      [
        front.point[0],
        front.point[1],
        front.point[2],
        front.firstDepth,
        front.secondDepth,
        front.firstReprojectionPx,
        front.secondReprojectionPx,
        front.parallaxRadians,
      ].every((value: number, index: number): boolean =>
        nclose(
          value,
          [1, 2, 4, 4, 4, 0, 0, Math.atan2(Math.sqrt(17), 19)][index]!,
          chart.projectionTolerance,
        ),
      ),
  );
  TestValidator.predicate(
    "finite point behind both cameras",
    back !== null &&
      !back.positiveDepth &&
      [
        back.point[0],
        back.point[1],
        back.point[2],
        back.firstDepth,
        back.secondDepth,
      ].every((value: number, index: number): boolean =>
        nclose(value, [1, 2, -4, -4, -4][index]!, chart.projectionTolerance),
      ),
  );
  TestValidator.equals(
    "point at infinity",
    solve(chart.firstPixel, [-7, 5]),
    null,
  );
  TestValidator.equals(
    "rank below floor",
    solve(chart.firstPixel, chart.secondPixel, 1),
    null,
  );
}
