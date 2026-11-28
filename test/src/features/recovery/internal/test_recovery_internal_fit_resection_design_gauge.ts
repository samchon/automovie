import type { IAutoMovieRecoveryMapPose } from "@automovie/interface";
import { AutoMovieRecoveryCameraMap, AutoMovieRecoveryCameraGeometry } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { createRecoveryMapNumericalFixture } from "../../internal/createRecoveryMapNumericalFixture";
import { nclose } from "../../internal/nclose";

/**
 * Noisy resection describes the same physical camera in translated world
 * charts.
 *
 * Scenarios:
 *
 * 1. Fixed nonplanar anisotropic/skew pinhole observations with deterministic
 *    subpixel noise produce a qualified nonrigid projective block.
 * 2. Translation, scale alone, scale plus translation, and a
 *    rotated/scaled/translated world preserve the proper rotation,
 *    unknown-scale translation and physical pixel predictions under their
 *    coordinate transformation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names noisy nonplanar observations, world transforms and fixed physical pixel predictions.
 * @evidence contracts/development/testing.md#behavioral-verification Fits resection in four independently transformed charts and checks the rigid projection and pre-projection projective block.
 * @evidence contracts/development/testing.md#independent-expectations Changing coordinates alone leaves the same authored observations. Known scale, rotation and origin transform the recovered reference camera analytically.
 */
export function test_recovery_internal_fit_resection_design_gauge(): void {
  const fixture: ReturnType<typeof createRecoveryMapNumericalFixture> =
    createRecoveryMapNumericalFixture();
  const chart: ReturnType<typeof AutoMovieRecoveryCameraMap.createCameraChart> =
    AutoMovieRecoveryCameraMap.createCameraChart(fixture.input.views[2]!);
  const pixels: [number, number][] = fixture.pixels[2]!.map(
    (pixel: [number, number], at: number): [number, number] => [
      pixel[0] + 0.05 * Math.sin(at + 1),
      pixel[1] + 0.05 * Math.cos(2 * at + 1),
    ],
  );
  const fitted: ReturnType<typeof AutoMovieRecoveryCameraGeometry.fitResectionDesign> =
    AutoMovieRecoveryCameraGeometry.fitResectionDesign(
      fixture.points,
      pixels,
      chart.inverse,
      fixture.input.policy,
      fixture.input.budget,
    );
  TestValidator.predicate(
    "noise distinguishes projective and rigid blocks",
    fitted.projectionError > 1e-5 &&
      fitted.projectionError <
        fixture.input.policy.maximumRotationProjectionError,
  );
  const identity: number[] = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  const angle: number = 0.23;
  const rotated: number[] = [
    Math.cos(angle),
    0,
    Math.sin(angle),
    0,
    1,
    0,
    -Math.sin(angle),
    0,
    Math.cos(angle),
  ];
  const transforms: readonly [
    number,
    readonly number[],
    readonly [number, number, number],
  ][] = [
    [1, identity, [3, -2, 1]],
    [2, identity, [0, 0, 0]],
    [2, identity, [3, -2, 1]],
    [1.7, rotated, [3, -2, 1]],
  ];
  for (const [scale, worldRotation, offset] of transforms) {
    const points: [number, number, number][] = fixture.points.map(
      (point: [number, number, number]): [number, number, number] => {
        const moved: (row: number) => number = (row: number): number =>
          scale *
            (worldRotation[3 * row]! * point[0] +
              worldRotation[3 * row + 1]! * point[1] +
              worldRotation[3 * row + 2]! * point[2]) +
          offset[row]!;
        return [moved(0), moved(1), moved(2)];
      },
    );
    const actual: IAutoMovieRecoveryMapPose = AutoMovieRecoveryCameraGeometry.fitResectionDesign(
      points,
      pixels,
      chart.inverse,
      fixture.input.policy,
      fixture.input.budget,
    ).pose;
    const expectedRotation: number[] = [0, 1, 2].flatMap(
      (row: number): number[] =>
        [0, 1, 2].map((col: number): number =>
          [0, 1, 2].reduce(
            (sum: number, inner: number): number =>
              sum +
              fitted.pose.rotation[3 * row + inner]! *
                worldRotation[3 * col + inner]!,
            0,
          ),
        ),
    );
    const expectedTranslation: number[] = [0, 1, 2].map(
      (row: number): number =>
        scale * fitted.pose.translation[row]! -
        offset.reduce(
          (sum: number, value: number, col: number): number =>
            sum + expectedRotation[3 * row + col]! * value,
          0,
        ),
    );
    TestValidator.predicate(
      "noisy rigid estimate follows the world chart",
      actual.rotation.every((value: number, at: number): boolean =>
        nclose(value, expectedRotation[at]!, 1e-7),
      ) &&
        actual.translation.every((value: number, at: number): boolean =>
          nclose(value, expectedTranslation[at]!, 1e-6),
        ),
    );
    TestValidator.predicate(
      "same physical points keep their pixel predictions",
      fixture.points.every(
        (point: [number, number, number], at: number): boolean => {
          const before: ReturnType<typeof AutoMovieRecoveryCameraMap.projectMapPoint> =
            AutoMovieRecoveryCameraMap.projectMapPoint(fitted.pose, point, chart.matrix);
          const after: ReturnType<typeof AutoMovieRecoveryCameraMap.projectMapPoint> =
            AutoMovieRecoveryCameraMap.projectMapPoint(actual, points[at]!, chart.matrix);
          return (
            before !== null &&
            after !== null &&
            before.pixel.every((value: number, axis: number): boolean =>
              nclose(value, after.pixel[axis]!, 1e-5),
            )
          );
        },
      ),
    );
  }
}
