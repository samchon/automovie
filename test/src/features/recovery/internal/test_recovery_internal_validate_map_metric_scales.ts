import { AutoMovieRecoveryCameraMap } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieRecoveryCameraMap.validateMapMetricScales` admits positive camera
 * column scales, at least one, and three positive scales per point.
 *
 * Scenarios:
 *
 * 1. Camera [1, 2] and points [[1, 1, 1]] are admitted.
 * 2. No camera scale, a zero camera scale, a negative point scale and a two-scale
 *    point refuse.
 * 3. Infinite camera and point scales refuse.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names positive per-camera and three-per-point scale requirements.
 * @evidence contracts/development/testing.md#behavioral-verification Admits one declared set of scales and submits empty, zero, negative, infinite and mis-sized alternatives.
 * @evidence contracts/development/testing.md#independent-expectations The two finite positive camera scales and one triple meet the required shape. Positive infinity exceeds the finite range even though it compares greater than zero.
 */
export function test_recovery_internal_validate_map_metric_scales(): void {
  AutoMovieRecoveryCameraMap.validateMapMetricScales({
    cameraScales: [1, 2],
    pointScales: [[1, 1, 1]],
  });
  const refused: [string, number[], number[][]][] = [
    ["no camera scale", [], [[1, 1, 1]]],
    ["a zero camera scale", [0], [[1, 1, 1]]],
    ["a negative point scale", [1], [[1, -1, 1]]],
    ["a two-scale point", [1], [[1, 1]]],
  ];
  for (const [name, camera, points] of refused)
    TestValidator.error(name, (): void =>
      AutoMovieRecoveryCameraMap.validateMapMetricScales({
        cameraScales: camera,
        pointScales: points,
      }),
    );
  const admitted: string[] = [];
  for (const [name, cameraScales, pointScales] of [
    ["infinite camera scale", [Infinity], [[1, 1, 1]]],
    ["infinite point scale", [1], [[1, Infinity, 1]]],
  ] satisfies [string, number[], number[][]][]) {
    try {
      AutoMovieRecoveryCameraMap.validateMapMetricScales({
        cameraScales,
        pointScales,
      });
      admitted.push(name);
    } catch (error: unknown) {
      if (
        !(error instanceof Error) ||
        !error.message.startsWith("camera-feasible: ")
      )
        throw error;
    }
  }
  TestValidator.equals(
    "unrepresentable scale values are refused at admission",
    admitted,
    [],
  );
}
