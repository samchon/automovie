import { TestValidator } from "@nestia/e2e";

import { createRecoveryCameraChart } from "../../../../packages/recovery/src/internal/createRecoveryCameraChart";
import { fitRecoveryResectionDesign } from "../../../../packages/recovery/src/internal/fitRecoveryResectionDesign";
import { projectRecoveryMapPoint } from "../../../../packages/recovery/src/internal/projectRecoveryMapPoint";
import type { IAutoMovieRecoveryMapPose } from "../../../../packages/recovery/src/structures/image/IAutoMovieRecoveryMapPose";
import { createRecoveryMapNumericalFixture } from "../internal/createRecoveryMapNumericalFixture";
import { nclose } from "../internal/nclose";

/**
 * Noisy resection describes the same physical camera in translated world charts.
 *
 * Scenarios:
 * 1. Fixed nonplanar anisotropic/skew pinhole observations with deterministic subpixel noise produce a qualified nonrigid projective block.
 * 2. Translation, scale alone, scale plus translation, and a rotated/scaled/translated world preserve the proper rotation, unknown-scale translation and physical pixel predictions under their coordinate transformation.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the actual calibrated initializer in five world charts and checks returned coefficients and every projected physical point, exposing origin-dependent rigid projection rather than checking implementation arrangement.
 * @evidence contracts/testing.md#independent-expectations A prescribed rigid world change Xnew=a*Q*X+o requires Rnew=R*Qtranspose and tnew=a*t-Rnew*o for the same pixels, regardless of measurement noise. These algebraic expectations are independent of DLT implementation and make no photographic-accuracy claim.
 * @evidence contracts/testing.md#distinguishing-cases Fixed 0.05-pixel trigonometric perturbations distinguish a genuinely nonrigid DLT block from the exact-pinhole case that hid the defect. Scale-only is an adjacent case the old method could preserve; translated and rotated-origin cases require the same projected rotation in centroid reversal. Existing tests own robust outliers, degeneracy, observer isolation and convergence.
 * @evidence contracts/testing.md#execution-ownership The portable test_recovery_camera_resection_gauge entry owns only finite arrays and CPU calls; it creates no filesystem, process, native artifact, installed consumer, host or viewer and replaces no foreign method.
 */
export function test_recovery_camera_resection_gauge(): void {
  const fixture: ReturnType<typeof createRecoveryMapNumericalFixture> =
    createRecoveryMapNumericalFixture();
  const chart: ReturnType<typeof createRecoveryCameraChart> =
    createRecoveryCameraChart(fixture.input.views[2]!);
  const pixels: [number, number][] = fixture.pixels[2]!.map(
    (pixel: [number, number], at: number): [number, number] => [
      pixel[0] + 0.05 * Math.sin(at + 1),
      pixel[1] + 0.05 * Math.cos(2 * at + 1),
    ],
  );
  const fitted: ReturnType<typeof fitRecoveryResectionDesign> =
    fitRecoveryResectionDesign(
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
      (point: [number, number, number]): [number, number, number] =>
        [0, 1, 2].map(
          (row: number): number =>
            scale *
              point.reduce(
                (sum: number, value: number, col: number): number =>
                  sum + worldRotation[3 * row + col]! * value,
                0,
              ) +
            offset[row]!,
        ) as [number, number, number],
    );
    const actual: IAutoMovieRecoveryMapPose = fitRecoveryResectionDesign(
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
          const before: ReturnType<typeof projectRecoveryMapPoint> =
            projectRecoveryMapPoint(fitted.pose, point, chart.matrix);
          const after: ReturnType<typeof projectRecoveryMapPoint> =
            projectRecoveryMapPoint(actual, points[at]!, chart.matrix);
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
