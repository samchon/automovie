import { AutoMovieMatrix3 } from "@automovie/engine/math/AutoMovieMatrix3";
import type { IAutoMovieRecoveryCameraPairInput } from "@automovie/interface/recovery";
import { TestValidator } from "@nestia/e2e";

import { calibrateRecoveryEpipolarMatrix } from "../../../../packages/recovery/src/internal/calibrateRecoveryEpipolarMatrix";
import { createRecoveryCameraChart } from "../../../../packages/recovery/src/internal/createRecoveryCameraChart";
import { fitRecoveryEpipolarMatrix } from "../../../../packages/recovery/src/internal/fitRecoveryEpipolarMatrix";
import { fitRecoveryHomography } from "../../../../packages/recovery/src/internal/fitRecoveryHomography";
import { measureRecoveryEpipolarErrors } from "../../../../packages/recovery/src/internal/measureRecoveryEpipolarErrors";
import { triangulateRecoveryCameraPoint } from "../../../../packages/recovery/src/internal/triangulateRecoveryCameraPoint";
import { nclose } from "../internal/nclose";

/**
 * Calibrated image geometry preserves unequal/skew intrinsics and unit scale.
 *
 * Scenarios:
 * 1. Independently projected nonplanar points recover their epipolar incidence and a member of the four-pose set with the known relative orientation and translation sign.
 * 2. The known pose triangulates the independently authored 3D points and retains negative depths for points behind the camera.
 * 3. A separately authored projective image map is recovered in both directions, while collinear data is refused.
 * 4. Undefined epipolar lines, overflowing matrix products and principal offsets that erase a pixel step cannot become finite geometric evidence.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the numerical geometry used by the image-pair estimator and observes pixel incidence, physical pose candidates, sparse point coordinates, signed depths, bidirectional projective transfer and refusal. Wrong inverse skew, matrix storage, essential orientation or unit-baseline convention changes these results.
 * @evidence contracts/testing.md#independent-expectations Analytic world points, a prescribed Y rotation, a prescribed unit translation and direct scalar pinhole equations generate both images without the fitting code. A separate rational 2D projective map supplies homography truth. These noise-free expectations test numerical semantics, not photographic accuracy or robust matching.
 * @evidence contracts/testing.md#distinguishing-cases Covers unequal focal scales, opposite skew signs, changed principal points, nonplanar depths, both translation signs in the pose ambiguity, a finite point behind both cameras, collinear designs, zero lines, unchanged borrowed matrix data, overflow and an unrepresentable chart. Noisy consensus, feature extraction and public operation admission belong to their owning tests.
 * @evidence contracts/testing.md#execution-ownership The portable test_recovery_camera_geometry function owns only finite analytic arrays and synchronous assertions; it creates no files, subprocess, installed consumer, browser or GPU and replaces no foreign implementation.
 */
export function test_recovery_camera_geometry(): void {
  const makeView: (focal: [number, number], skew: number, centre: [number, number]) =>
    IAutoMovieRecoveryCameraPairInput["views"][number] = (
      focal: [number, number], skew: number, centre: [number, number],
    ): IAutoMovieRecoveryCameraPairInput["views"][number] => ({
      id: "analytic", sourceSha256: "0".repeat(64), pixelProvenance: "analytic unchanged pixel centres",
      width: 800, height: 600, rgb8: new Uint8Array(0), camera: {
        type: "pinhole", calibration: "supplied-intrinsics", distortion: "caller-corrected",
        focalPx: focal, skewPx: skew, principalPointPx: centre, uncertaintyPx: null,
      },
    });
  const view1: ReturnType<typeof makeView> = makeView([700, 750], 13, [390, 290]);
  const view2: ReturnType<typeof makeView> = makeView([820, 680], -9, [410, 305]);
  const chart1: ReturnType<typeof createRecoveryCameraChart> = createRecoveryCameraChart(view1);
  const chart2: ReturnType<typeof createRecoveryCameraChart> = createRecoveryCameraChart(view2);
  const angle: number = 0.23, cosine: number = Math.cos(angle), sine: number = Math.sin(angle);
  const rotation: number[] = [cosine, 0, sine, 0, 1, 0, -sine, 0, cosine];
  const length: number = Math.hypot(0.8, 0.2, 0.1);
  const translation: [number, number, number] = [0.8 / length, 0.2 / length, 0.1 / length];
  const points: [number, number, number][] = Array.from({ length: 24 },
    (_: unknown, at: number): [number, number, number] => [
      ((at * 7) % 13 - 6) / 5, ((at * 11) % 17 - 8) / 7,
      4 + ((at * 5) % 19) / 6,
    ]);
  // Independent scalar pinhole equations preserve the skew contribution to x.
  const project: (point: readonly number[], view: ReturnType<typeof makeView>) => [number, number] = (
    point: readonly number[], view: ReturnType<typeof makeView>,
  ): [number, number] => [
    (view.camera.focalPx[0] * point[0]! + view.camera.skewPx * point[1]!) / point[2]! + view.camera.principalPointPx[0],
    view.camera.focalPx[1] * point[1]! / point[2]! + view.camera.principalPointPx[1],
  ];
  const inSecond: (point: readonly number[]) => [number, number, number] = (
    point: readonly number[],
  ): [number, number, number] => [cosine * point[0]! + sine * point[2]! + translation[0],
    point[1]! + translation[1], -sine * point[0]! + cosine * point[2]! + translation[2]];
  const first: [number, number][] = points.map((point: number[]): [number, number] => project(point, view1));
  const second: [number, number][] = points.map((point: number[]): [number, number] => project(inSecond(point), view2));
  const fitted: ReturnType<typeof fitRecoveryEpipolarMatrix> = fitRecoveryEpipolarMatrix(first, second, 1e-8, 64);
  const calibrated: ReturnType<typeof calibrateRecoveryEpipolarMatrix> = calibrateRecoveryEpipolarMatrix(
    fitted.matrix, chart1, chart2, 64,
  );
  TestValidator.predicate("calibrated epipolar incidence has independent noise-free pixel truth",
    measureRecoveryEpipolarErrors(calibrated.fundamental, first, second).every(
      (error: ReturnType<typeof measureRecoveryEpipolarErrors>[number]): boolean =>
        error !== null && nclose(error.signedSampsonPx, 0, 1e-6) && nclose(error.symmetricPointLinePx, 0, 1e-6),
    ));
  TestValidator.predicate("four-pose ambiguity includes the prescribed proper orientation and signed baseline",
    calibrated.poses.length === 4 && calibrated.poses.some((pose: typeof calibrated.poses[number]): boolean =>
      pose.rotation.every((value: number, at: number): boolean => nclose(value, rotation[at]!, 1e-8)) &&
      pose.translation.every((value: number, at: number): boolean => nclose(value, translation[at]!, 1e-8))));
  for (let at: number = 0; at < points.length; at++) {
    const result: ReturnType<typeof triangulateRecoveryCameraPoint> = triangulateRecoveryCameraPoint(
      first[at]!, second[at]!, chart1, chart2, { rotation, translation }, 1e-8, 64,
    );
    TestValidator.predicate("unit-baseline triangulation recovers independently authored depth and projections",
      result !== null && result.positiveDepth && result.parallaxRadians > 0 &&
      result.point.every((value: number, axis: number): boolean => nclose(value, points[at]![axis]!, 1e-8)) &&
      nclose(result.firstReprojectionPx, 0, 1e-7) && nclose(result.secondReprojectionPx, 0, 1e-7));
  }
  const behind: [number, number, number] = [0.2, -0.1, -6];
  const negative: ReturnType<typeof triangulateRecoveryCameraPoint> = triangulateRecoveryCameraPoint(
    project(behind, view1), project(inSecond(behind), view2), chart1, chart2,
    { rotation, translation }, 1e-8, 64,
  );
  TestValidator.predicate("negative depth remains evidence against the candidate pose",
    negative !== null && !negative.positiveDepth && negative.firstDepth < 0 && negative.secondDepth < 0);
  const plane: [number, number][] = [[20, 30], [240, 50], [60, 230], [310, 190], [130, 80], [90, 290], [390, 310], [280, 360]];
  const mapped: [number, number][] = plane.map((point: [number, number]): [number, number] => {
    const divisor: number = 1 + 0.0002 * point[0] - 0.0001 * point[1];
    return [(1.1 * point[0] + 0.08 * point[1] + 12) / divisor,
      (-0.03 * point[0] + 0.9 * point[1] - 7) / divisor];
  });
  const homography: ReturnType<typeof fitRecoveryHomography> = fitRecoveryHomography(plane, mapped, 1e-8, 64);
  for (let at: number = 0; at < plane.length; at++) {
    const forward: [number, number, number] = AutoMovieMatrix3.apply(homography.matrix, [...plane[at]!, 1]);
    const backward: [number, number, number] = AutoMovieMatrix3.apply(homography.inverse, [...mapped[at]!, 1]);
    TestValidator.predicate("rational projective map and reverse transfer agree with independent truth",
      nclose(forward[0] / forward[2], mapped[at]![0], 1e-7) && nclose(forward[1] / forward[2], mapped[at]![1], 1e-7) &&
      nclose(backward[0] / backward[2], plane[at]![0], 1e-7) && nclose(backward[1] / backward[2], plane[at]![1], 1e-7));
  }
  TestValidator.predicate("zero epipolar lines remain undefined observations",
    measureRecoveryEpipolarErrors(new Array<number>(9).fill(0), [[1, 2]], [[3, 4]])[0] === null);
  const invalid: (() => unknown)[] = [
    (): unknown => createRecoveryCameraChart(makeView([700, 750], 0, [1e300, 290])),
    (): unknown => fitRecoveryHomography([[0, 0], [1, 1], [2, 2], [3, 3]], [[0, 0], [2, 2], [4, 4], [6, 6]], 1e-8, 64),
    (): unknown => AutoMovieMatrix3.multiply(new Array<number>(9).fill(Number.MAX_VALUE), new Array<number>(9).fill(2)),
  ];
  for (const action of invalid) {
    let refused: boolean = false;
    try { action(); } catch (error: unknown) { refused = error instanceof Error; }
    TestValidator.predicate("unobservable or nonrepresentable geometry refuses without invented evidence", refused);
  }
  const borrowed: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  AutoMovieMatrix3.transpose(borrowed);
  TestValidator.predicate("matrix operations leave borrowed coordinates unchanged",
    borrowed.every((value: number, at: number): boolean => nclose(value, at + 1, 0)));
}
