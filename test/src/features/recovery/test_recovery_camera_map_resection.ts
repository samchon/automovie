import { TestValidator } from "@nestia/e2e";

import { createRecoveryCameraChart } from "../../../../packages/recovery/src/internal/createRecoveryCameraChart";
import { fitRecoveryResectionConsensus } from "../../../../packages/recovery/src/internal/fitRecoveryResectionConsensus";
import { fitRecoveryResectionDesign } from "../../../../packages/recovery/src/internal/fitRecoveryResectionDesign";
import { projectRecoveryMapPoint } from "../../../../packages/recovery/src/internal/projectRecoveryMapPoint";
import { refineRecoveryResection } from "../../../../packages/recovery/src/internal/refineRecoveryResection";
import { stepRecoveryMapPose } from "../../../../packages/recovery/src/internal/stepRecoveryMapPose";
import type { IAutoMovieRecoveryMapPose } from "../../../../packages/recovery/src/structures/image/IAutoMovieRecoveryMapPose";
import { createRecoveryMapNumericalFixture } from "../internal/createRecoveryMapNumericalFixture";
import { nclose } from "../internal/nclose";

/**
 * Calibrated resection preserves proper rotation and the map's translation scale.
 *
 * Scenarios:
 * 1. Independent skew/anisotropic pinhole data recover a nonunit third translation and transform consistently after a changed 3D origin/scale; a rotating camera against the existing map can have zero translation.
 * 2. Six camera and three world-point analytic derivatives agree with independent central differences; a point behind the camera has no projection.
 * 3. Robust resection handles separated pixel outliers; fixed-support refinement converges with actual cost descent and reports an exhausted one-step budget.
 * 4. Planar/collinear nonminimal DLT, insufficient pairs and insufficient robust support refuse without a replacement pose.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual DLT, projection, six-coordinate updates, robust consensus and local fitting, asserting camera coefficients, point derivatives, inlier identities, descent, nonconvergence and refusal rather than repository structure.
 * @evidence contracts/testing.md#independent-expectations Prescribed nonplanar world points, trigonometric Y rotations, nonunit translation and direct scalar pinhole equations supply truth. A known affine change Xnew=2*X+offset gives R unchanged and tnew=2*t-R*offset. Central differences check the declared projection chart, not photographic accuracy.
 * @evidence contracts/testing.md#distinguishing-cases Covers unequal focal lengths/skew, all nine derivative directions, changed 3D gauge, positive/negative depth, deterministic outliers, exact support identities, flat/collinear point spans, fewer than six pairs and bounded unfinished refinement. Shared tracks, joint gauge and public admission have separate tests.
 * @evidence contracts/testing.md#execution-ownership The portable test_recovery_camera_map_resection entry owns finite resident arrays and CPU assertions only, with no files, native builds, installation, process, viewer or foreign-method replacement.
 */
export function test_recovery_camera_map_resection(): void {
  const fixture: ReturnType<typeof createRecoveryMapNumericalFixture> =
    createRecoveryMapNumericalFixture();
  const chart: ReturnType<typeof createRecoveryCameraChart> =
    createRecoveryCameraChart(fixture.input.views[2]!);
  const fitted: ReturnType<typeof fitRecoveryResectionDesign> =
    fitRecoveryResectionDesign(
      fixture.points,
      fixture.pixels[2]!,
      chart.inverse,
      fixture.input.policy,
      fixture.input.budget,
    );
  TestValidator.predicate(
    "independent prescribed camera and nonunit translation recovered",
    fitted.pose.rotation.every((value: number, at: number): boolean =>
      nclose(value, fixture.poses[2]!.rotation[at]!, 1e-7),
    ) &&
      fitted.pose.translation.every((value: number, at: number): boolean =>
        nclose(value, fixture.poses[2]!.translation[at]!, 1e-7),
      ) &&
      Math.hypot(...fitted.pose.translation) > 1.5,
  );
  const changed: [number, number, number][] = fixture.points.map(
    (point: [number, number, number]): [number, number, number] => [
      2 * point[0] + 3,
      2 * point[1] - 2,
      2 * point[2] + 1,
    ],
  );
  const shifted: ReturnType<typeof fitRecoveryResectionDesign> =
    fitRecoveryResectionDesign(
      changed,
      fixture.pixels[2]!,
      chart.inverse,
      fixture.input.policy,
      fixture.input.budget,
    );
  TestValidator.predicate(
    "isotropic world normalization reverses origin and scale",
    shifted.pose.translation.every((value: number, at: number): boolean =>
      nclose(
        value,
        2 * fixture.poses[2]!.translation[at]! -
          fixture.poses[2]!.rotation.slice(3 * at, 3 * at + 3).reduce(
            (sum: number, entry: number, axis: number): number =>
              sum + entry * [3, -2, 1][axis]!,
            0,
          ),
        1e-6,
      ),
    ),
  );
  const point: [number, number, number] = fixture.points[0]!;
  const analytic: NonNullable<ReturnType<typeof projectRecoveryMapPoint>> =
    projectRecoveryMapPoint(fixture.poses[2]!, point, chart.matrix)!;
  for (let parameter: number = 0; parameter < 9; parameter++) {
    const values: [number, number][] = [];
    for (const sign of [-1, 1]) {
      const epsilon: number = sign * 1e-6;
      let pose: IAutoMovieRecoveryMapPose = fixture.poses[2]!;
      const moved: [number, number, number] = [...point];
      if (parameter < 6) {
        const step: number[] = new Array<number>(6).fill(0);
        step[parameter] = epsilon;
        pose = stepRecoveryMapPose(pose, step);
      } else moved[parameter - 6] += epsilon;
      values.push(projectRecoveryMapPoint(pose, moved, chart.matrix)!.pixel);
    }
    for (let axis: number = 0; axis < 2; axis++)
      TestValidator.predicate(
        `analytic local derivative ${parameter}/${axis}`,
        nclose(
          (values[1]![axis]! - values[0]![axis]!) / 2e-6,
          parameter < 6
            ? analytic.cameraJacobian[axis]![parameter]!
            : analytic.pointJacobian[axis]![parameter - 6]!,
          2e-5,
        ),
      );
  }
  TestValidator.predicate(
    "behind-camera points stay unprojectable",
    projectRecoveryMapPoint(
      { rotation: [1, 0, 0, 0, 1, 0, 0, 0, 1], translation: [0, 0, 0] },
      [0, 0, -1],
      chart.matrix,
    ) === null,
  );
  const rotationOnlyPixels: [number, number][] = fixture.points.map(
    (value: [number, number, number]): [number, number] => {
      const x: number =
        Math.cos(-0.08) * value[0] + Math.sin(-0.08) * value[2];
      const z: number =
        -Math.sin(-0.08) * value[0] + Math.cos(-0.08) * value[2];
      return [
        (chart.matrix[0]! * x + chart.matrix[1]! * value[1]) / z +
          chart.matrix[2]!,
        (chart.matrix[4]! * value[1]) / z + chart.matrix[5]!,
      ];
    },
  );
  const rotationOnly: ReturnType<typeof fitRecoveryResectionDesign> =
    fitRecoveryResectionDesign(
      fixture.points,
      rotationOnlyPixels,
      chart.inverse,
      fixture.input.policy,
      fixture.input.budget,
    );
  TestValidator.predicate(
    "a constrained existing map permits zero-translation rotating-camera PnP",
    rotationOnly.pose.translation.every(
      (value: number): boolean => nclose(value, 0, 1e-7),
    ) &&
      rotationOnly.pose.rotation.every(
        (value: number, at: number): boolean =>
          nclose(value, fixture.poses[2]!.rotation[at]!, 1e-7),
      ),
  );
  const outliers: [number, number][] = fixture.pixels[2]!.map(
    (pixel: [number, number], at: number): [number, number] =>
      at % 5 === 0 ? [pixel[0] + 100, pixel[1] - 70] : [...pixel],
  );
  const robust: ReturnType<typeof fitRecoveryResectionConsensus> =
    fitRecoveryResectionConsensus(
      fixture.points,
      outliers,
      chart.matrix,
      chart.inverse,
      fixture.input.policy,
      fixture.input.budget,
      (): void => {},
    );
  TestValidator.predicate(
    "distinct true support survives robust outlier resection",
    robust.pose !== null &&
      robust.indices.length === 32 &&
      robust.indices.every((at: number): boolean => at % 5 !== 0) &&
      robust.stable &&
      robust.refusalReasons.length === 0,
  );
  const initial: IAutoMovieRecoveryMapPose = stepRecoveryMapPose(
    fixture.poses[2]!,
    [0.01, -0.008, 0.004, 0.03, -0.02, 0.01],
  );
  const refined: ReturnType<typeof refineRecoveryResection> =
    refineRecoveryResection(
      initial,
      fixture.points,
      fixture.pixels[2]!,
      chart.matrix,
      fixture.input.policy,
      fixture.input.budget,
      (): void => {},
    );
  const unfinished: ReturnType<typeof refineRecoveryResection> =
    refineRecoveryResection(
      initial,
      fixture.points,
      fixture.pixels[2]!,
      chart.matrix,
      fixture.input.policy,
      { ...fixture.input.budget, maxRefinementIterations: 1 },
      (): void => {},
    );
  TestValidator.predicate(
    "fixed-population descent and unfinished budget stay distinct",
    refined.converged &&
      refined.finalCost < refined.initialCost &&
      refined.pose.translation.every((value: number, at: number): boolean =>
        nclose(value, fixture.poses[2]!.translation[at]!, 1e-5),
      ) &&
      !unfinished.converged,
  );
  for (const points of [
    fixture.points.map(
      (value: [number, number, number]): [number, number, number] => [
        value[0],
        value[1],
        5,
      ],
    ),
    fixture.points.map((_: unknown, at: number): [number, number, number] => [
      at,
      0,
      5,
    ]),
    fixture.points.slice(0, 5),
  ]) {
    let refused: boolean = false;
    try {
      fitRecoveryResectionDesign(
        points,
        fixture.pixels[2]!.slice(0, points.length),
        chart.inverse,
        fixture.input.policy,
        fixture.input.budget,
      );
    } catch {
      refused = true;
    }
    TestValidator.predicate("unsupported original DLT design refuses", refused);
  }
  const insufficient: ReturnType<typeof fitRecoveryResectionConsensus> =
    fitRecoveryResectionConsensus(
      fixture.points.slice(0, 5),
      fixture.pixels[2]!.slice(0, 5),
      chart.matrix,
      chart.inverse,
      fixture.input.policy,
      fixture.input.budget,
      (): void => {},
    );
  TestValidator.predicate(
    "insufficient landmark support exposes no pose",
    insufficient.pose === null &&
      insufficient.refusalReasons.includes("insufficient-resection-support"),
  );
}
