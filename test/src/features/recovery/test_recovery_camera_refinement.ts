import { AutoMovieMatrix3 } from "@automovie/engine/math/AutoMovieMatrix3";
import type { IAutoMovieRecoveryCameraPairInput } from "@automovie/interface/recovery";
import { TestValidator } from "@nestia/e2e";

import { createRecoveryCameraChart } from "../../../../packages/recovery/src/internal/createRecoveryCameraChart";
import { createRecoveryPoseModel } from "../../../../packages/recovery/src/internal/createRecoveryPoseModel";
import { linearizeRecoveryPoseResiduals } from "../../../../packages/recovery/src/internal/linearizeRecoveryPoseResiduals";
import { measureRecoveryEpipolarErrors } from "../../../../packages/recovery/src/internal/measureRecoveryEpipolarErrors";
import { refineRecoveryCameraPose } from "../../../../packages/recovery/src/internal/refineRecoveryCameraPose";
import { requiredRecoveryCameraTrials } from "../../../../packages/recovery/src/internal/requiredRecoveryCameraTrials";
import { sampleRecoveryCameraIndices } from "../../../../packages/recovery/src/internal/sampleRecoveryCameraIndices";
import { stepRecoveryRelativePose } from "../../../../packages/recovery/src/internal/stepRecoveryRelativePose";
import { nclose } from "../internal/nclose";

/**
 * Local camera optimization recovers prescribed pose without changing gauge.
 *
 * Scenarios:
 * 1. Finite-population sampling uses the exact all-inlier probability for unique draws, with impossible and all-inlier boundaries.
 * 2. Deterministic proposal identities retain unique indices and change with the model domain; malformed draws refuse.
 * 3. The analytic five-coordinate Sampson Jacobian agrees with central differences of actual calibrated image residuals, and left rotation/radian conventions have independent trigonometric truth.
 * 4. Noisy independent pinhole projections refine from a perturbed pose toward the known camera, while a one-iteration budget remains explicitly unfinished.
 *
 * @evidence contracts/testing.md#behavioral-verification Exercises sampling, local pose action, analytic derivatives and actual robust optimization, asserting physical camera orientation/direction, unit gauge, cost decrease and explicit nonconvergence. It detects optimistic small-population confidence, repeated indices, wrong quotient derivatives, angle units and matrix-update order.
 * @evidence contracts/testing.md#independent-expectations For10 observations with8 inliers, an eight-draw success probability is1/45; logarithmic failure probability determines the independent trial count. Direct scalar pinhole projection of nonplanar points supplies known R and t. Analytic Y-angle composition and normalized(1,.1,.2) supply local-update truth; central differences only check the derivative of the declared residual, not its photographic accuracy.
 * @evidence contracts/testing.md#distinguishing-cases Covers no possible successful sample, all-inlier single-trial success, deterministic model-domain separation, both skew signs, unequal focal scales, five local directions, small deterministic pixel noise, positive cost reduction, preserved unit translation and exhausted iteration budget. Public RGB admission, outlier consensus and photographic correctness have separate owners.
 * @evidence contracts/testing.md#execution-ownership The portable test_recovery_camera_refinement entry owns finite numerical arrays and synchronous CPU assertions only; no file, installation, native build, process or rendering host is started and no foreign method is replaced.
 */
export function test_recovery_camera_refinement(): void {
  const confidence: number = 0.999;
  TestValidator.predicate("unique draws use finite-population rather than fraction-power probability",
    requiredRecoveryCameraTrials(10, 8, 8, confidence) === Math.ceil(Math.log1p(-confidence) / Math.log1p(-1 / 45)) &&
    requiredRecoveryCameraTrials(10, 10, 8, confidence) === 1 &&
    requiredRecoveryCameraTrials(10, 7, 8, confidence) === Infinity);
  const sample: number[] = sampleRecoveryCameraIndices(20, 8, 17, 101, 3);
  const repeated: number[] = sampleRecoveryCameraIndices(20, 8, 17, 101, 3);
  const otherDomain: number[] = sampleRecoveryCameraIndices(20, 8, 17, 102, 3);
  TestValidator.predicate("sample identity is stable and indices are distinct within the full population",
    new Set(sample).size === 8 && sample.every((value: number, at: number): boolean =>
      value >= 0 && value < 20 && value === repeated[at]) &&
      sample.some((value: number, at: number): boolean => value !== otherDomain[at]));
  const view: IAutoMovieRecoveryCameraPairInput["views"][number] = {
    id: "analytic", sourceSha256: "0".repeat(64), pixelProvenance: "analytic integer-centre chart",
    width: 640, height: 480, rgb8: new Uint8Array(0), camera: { type: "pinhole",
      calibration: "supplied-intrinsics", distortion: "caller-corrected", focalPx: [700, 760],
      skewPx: 7, principalPointPx: [310, 235], uncertaintyPx: null },
  };
  const first: ReturnType<typeof createRecoveryCameraChart> = createRecoveryCameraChart(view);
  const secondView: typeof view = { ...view, camera: { ...view.camera, focalPx: [810, 690], skewPx: -11, principalPointPx: [325, 245] } };
  const second: ReturnType<typeof createRecoveryCameraChart> = createRecoveryCameraChart(secondView);
  const rotationOf: (angle: number) => number[] = (angle: number): number[] => [
    Math.cos(angle), 0, Math.sin(angle), 0, 1, 0, -Math.sin(angle), 0, Math.cos(angle),
  ];
  const axisPose: { rotation: number[]; translation: [number, number, number] } = {
    rotation: rotationOf(0.23), translation: [1, 0, 0],
  };
  const axisModel: ReturnType<typeof createRecoveryPoseModel> = createRecoveryPoseModel(axisPose, first, second);
  const stepped: ReturnType<typeof stepRecoveryRelativePose> = stepRecoveryRelativePose(axisPose, axisModel.tangent, [0, 0.01, 0, 0.1, 0.2]);
  const expectedDirectionNorm: number = Math.hypot(1, 0.1, 0.2);
  const expectedDirection: number[] = [1 / expectedDirectionNorm, 0.1 / expectedDirectionNorm, 0.2 / expectedDirectionNorm];
  TestValidator.predicate("left Y rotation is radians and tangent retraction has independent sphere truth",
    stepped.rotation.every((value: number, at: number): boolean => nclose(value, rotationOf(0.24)[at]!, 1e-12)) &&
    stepped.translation.every((value: number, at: number): boolean => nclose(value, expectedDirection[at]!, 1e-12)));
  const translationNorm: number = Math.hypot(0.8, 0.2, 0.1);
  const translation: [number, number, number] = [0.8 / translationNorm, 0.2 / translationNorm, 0.1 / translationNorm];
  const firstPoints: [number, number][] = [], secondPoints: [number, number][] = [];
  const project: (xyz: readonly number[], camera: typeof view) => [number, number] = (
    xyz: readonly number[], camera: typeof view,
  ): [number, number] => [
    (camera.camera.focalPx[0] * xyz[0]! + camera.camera.skewPx * xyz[1]!) / xyz[2]! + camera.camera.principalPointPx[0],
    camera.camera.focalPx[1] * xyz[1]! / xyz[2]! + camera.camera.principalPointPx[1],
  ];
  for (let at: number = 0; at < 32; at++) {
    const x: number = ((at * 7) % 17 - 8) / 5, y: number = ((at * 11) % 19 - 9) / 7;
    const z: number = 4 + ((at * 13) % 23) / 5;
    firstPoints.push(project([x, y, z], view));
    const pixel: [number, number] = project([
      Math.cos(0.23) * x + Math.sin(0.23) * z + translation[0],
      y + translation[1], -Math.sin(0.23) * x + Math.cos(0.23) * z + translation[2],
    ], secondView);
    secondPoints.push([pixel[0] + 0.03 * Math.sin(at * 2.1), pixel[1] + 0.03 * Math.cos(at * 1.7)]);
  }
  const initial: typeof axisPose = { rotation: rotationOf(0.245), translation: [translation[0], translation[1] + 0.02, translation[2] - 0.015] };
  const norm: number = Math.hypot(...initial.translation);
  initial.translation = [initial.translation[0] / norm, initial.translation[1] / norm, initial.translation[2] / norm];
  const model: ReturnType<typeof createRecoveryPoseModel> = createRecoveryPoseModel(initial, first, second);
  const linear: ReturnType<typeof linearizeRecoveryPoseResiduals> = linearizeRecoveryPoseResiduals(model, firstPoints, secondPoints);
  const epsilon: number = 1e-6;
  for (let parameter: number = 0; parameter < 5; parameter++) {
    const differences: number[][] = [];
    for (const sign of [-1, 1]) {
      const delta: number[] = new Array<number>(5).fill(0); delta[parameter] = sign * epsilon;
      const pose: typeof axisPose = stepRecoveryRelativePose(initial, model.tangent, delta);
      const matrix: number[] = createRecoveryPoseModel(pose, first, second).matrix;
      differences.push(measureRecoveryEpipolarErrors(matrix, firstPoints, secondPoints).map(
        (error: ReturnType<typeof measureRecoveryEpipolarErrors>[number]): number => error!.signedSampsonPx,
      ));
    }
    TestValidator.predicate("analytic Sampson derivative includes both line-normal derivatives",
      linear.jacobian.every((row: number[], at: number): boolean =>
        nclose(row[parameter]!, (differences[1]![at]! - differences[0]![at]!) / (2 * epsilon), 1e-5)));
  }
  const policy: Parameters<typeof refineRecoveryCameraPose>[5] = {
    lossScalePx: 1, minimumDesignRatio: 1e-8, maxIterations: 100, maxSweeps: 64,
  };
  const refined: ReturnType<typeof refineRecoveryCameraPose> = refineRecoveryCameraPose(initial, firstPoints, secondPoints, first, second, policy);
  TestValidator.predicate("actual noisy projections recover the prescribed camera locally and preserve unit gauge",
    refined.converged && refined.acceptedSteps > 0 && refined.finalCost < refined.initialCost / 100 &&
    refined.rotation.every((value: number, at: number): boolean => nclose(value, rotationOf(0.23)[at]!, 0.002)) &&
    refined.translation.every((value: number, at: number): boolean => nclose(value, translation[at]!, 0.01)) &&
    nclose(Math.hypot(...refined.translation), 1, 1e-12));
  const unfinished: ReturnType<typeof refineRecoveryCameraPose> = refineRecoveryCameraPose(initial, firstPoints, secondPoints,
    first, second, { ...policy, maxIterations: 1 });
  TestValidator.predicate("finite iteration exhaustion is distinct from local convergence",
    !unfinished.converged && unfinished.termination === "iteration-budget" && unfinished.iterations === 1);
  TestValidator.predicate("cross-product matrix has the independent Cartesian action",
    AutoMovieMatrix3.apply(AutoMovieMatrix3.skew([2, 3, 4]), [5, 6, 7]).every(
      (value: number, at: number): boolean => nclose(value, [-3, 6, -3][at]!, 0),
    ));
  let refused: boolean = false;
  try { sampleRecoveryCameraIndices(3, 4, 0, 1, 0); } catch (error: unknown) { refused = error instanceof Error; }
  TestValidator.predicate("impossible unique sample refuses before proposal allocation", refused);
}
