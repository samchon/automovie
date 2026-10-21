import { TestValidator } from "@nestia/e2e";

import { createRecoveryCameraChart } from "../../../../packages/recovery/src/internal/createRecoveryCameraChart";
import { predictRecoveryMapDecrease } from "../../../../packages/recovery/src/internal/predictRecoveryMapDecrease";
import { refineRecoveryCameraMap } from "../../../../packages/recovery/src/internal/refineRecoveryCameraMap";
import type { IAutoMovieRecoveryMapJointBlock } from "../../../../packages/recovery/src/structures/internal/IAutoMovieRecoveryMapJointBlock";
import type { IAutoMovieRecoveryMapLandmark } from "../../../../packages/recovery/src/structures/image/IAutoMovieRecoveryMapLandmark";
import { createRecoveryMapNumericalFixture } from "../internal/createRecoveryMapNumericalFixture";
import { nclose } from "../internal/nclose";

/**
 * Undamped robust prediction consumes actual physical camera/point increments.
 *
 * Scenarios:
 * 1. Two nonsymmetric point blocks with unequal vector soft-L1 weights distinguish camera/point order, one weight per residual vector, cross terms and omission of damping.
 * 2. Malformed physical widths, row shape and nonfinite source inputs throw; finite arithmetic overflow returns unsupported null and zero increment predicts zero.
 * 3. A small nonzero perturbation of the independent nonplanar camera fixture exercises actual accepted-step prediction and fit-local report delivery while keeping the original gauge/population and all point gates.
 * 4. Additional adaptive retention alone can refuse before copying while the fixed exact-map path remains valid without a regularization report. A prediction-owner charge error propagates after real trials.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the source original-design action and actual feasible camera owner, observing computed prediction, immutable inputs, selected-update reactions, admission and original error identity. This reaches nonzero robust residuals rather than only an already normal map.
 * @evidence contracts/testing.md#independent-expectations Explicit authored unweighted rows give four J*u expressions and g=J^T*r/hypot(1,norm/2); their squared weighted sum determines prediction independently. A deliberately added damping penalty differs. Scalar-projected fixture geometry supplies preserved observation identities and a known feasible exact map, without using fitted outputs as expected poses.
 * @evidence contracts/testing.md#distinguishing-cases Covers unequal weights, both point blocks, zero and nonfinite prediction arithmetic, malformed input, adaptive on/off, no initial selected step, extra-retention refusal and a real accepted-path work error. Generic poor-agreement reactions, original normal cases and half/SOC increment ownership have separate entries.
 * @evidence contracts/testing.md#execution-ownership The portable test_recovery_feasible_model_prediction entry uses resident numerical arrays and source fitting without filesystem, native compiler, processes, images read from disk, browser or GPU.
 */
export function test_recovery_feasible_model_prediction(): void {
  const firstScale: number = Math.hypot(1, 2.5), secondScale: number = 1.5;
  const firstWeight: number = 1 / Math.sqrt(firstScale), secondWeight: number = 1 / Math.sqrt(secondScale);
  const blocks: IAutoMovieRecoveryMapJointBlock[] = [
    { cameraRows: [[2, -1], [0.5, 3]].map((row: number[]): number[] => row.map((value: number): number => value * firstWeight)),
      pointRows: [[1, 0.5, -0.25], [-0.5, 2, 1]].map((row: number[]): number[] => row.map((value: number): number => value * firstWeight)),
      right: [-3 * firstWeight, -4 * firstWeight] },
    { cameraRows: [[-1, 2], [3, 0.25]].map((row: number[]): number[] => row.map((value: number): number => value * secondWeight)),
      pointRows: [[0.75, -1, 2], [1.5, 0.25, -0.5]].map((row: number[]): number[] => row.map((value: number): number => value * secondWeight)),
      right: [secondWeight, -2 * secondWeight] },
  ];
  const gradient: number[] = [8 / firstScale + 7 / secondScale, 9 / firstScale - 1.5 / secondScale,
    1 / firstScale, 9.5 / firstScale, 3.25 / firstScale,
    2.25 / secondScale, 1.5 / secondScale, -3 / secondScale];
  const u: number[] = [0.01, -0.02, 0.03, -0.01, 0.005, -0.01, 0.015, -0.005];
  const first: number = 2 * u[0]! - u[1]! + u[2]! + 0.5 * u[3]! - 0.25 * u[4]!;
  const second: number = 0.5 * u[0]! + 3 * u[1]! - 0.5 * u[2]! + 2 * u[3]! + u[4]!;
  const third: number = -u[0]! + 2 * u[1]! + 0.75 * u[5]! - u[6]! + 2 * u[7]!;
  const fourth: number = 3 * u[0]! + 0.25 * u[1]! + 1.5 * u[5]! + 0.25 * u[6]! - 0.5 * u[7]!;
  const expected: number = -(3 * first + 4 * second) / firstScale - (-third + 2 * fourth) / secondScale -
    0.5 * ((first * first + second * second) / firstScale + (third * third + fourth * fourth) / secondScale);
  const inputBefore: string = JSON.stringify({ blocks, gradient, u });
  const actual: number | null = predictRecoveryMapDecrease(blocks, gradient, u);
  const damped: number = expected - 0.9 * u.reduce((sum: number, value: number): number => sum + value * value, 0);
  TestValidator.predicate("original weighted robust design without damping or permutation",
    actual !== null && nclose(actual, expected, 1e-12) && !nclose(actual, damped, 1e-6) &&
    JSON.stringify({ blocks, gradient, u }) === inputBefore &&
    nclose(predictRecoveryMapDecrease(blocks, gradient, new Array<number>(8).fill(0))!, 0, 1e-15));
  const huge: IAutoMovieRecoveryMapJointBlock[] = [{ cameraRows: [[1e200]], pointRows: [[0, 0, 0]], right: [0] }];
  TestValidator.predicate("finite design arithmetic can be unsupported without an input defect",
    predictRecoveryMapDecrease(huge, [0, 0, 0, 0], [1e200, 0, 0, 0]) === null);
  let coreErrors: number = 0;
  try { predictRecoveryMapDecrease(blocks, gradient, []); } catch { coreErrors++; }
  try { predictRecoveryMapDecrease([{ ...blocks[0]!, cameraRows: [[]] }], [0, 0, 0, 0], [0, 0, 0, 0]); } catch { coreErrors++; }
  try { predictRecoveryMapDecrease([{ cameraRows: [[Number.NaN]], pointRows: [[0, 0, 0]], right: [0] }], [0, 0, 0, 0], [0, 0, 0, 0]); } catch { coreErrors++; }
  TestValidator.predicate("model layout and nonfinite input remain core errors", coreErrors === 3);

  const fixture: ReturnType<typeof createRecoveryMapNumericalFixture> = createRecoveryMapNumericalFixture();
  const intrinsics: number[][] = fixture.input.views.map(
    (view: (typeof fixture.input.views)[number]): number[] => createRecoveryCameraChart(view).matrix,
  );
  const exact: IAutoMovieRecoveryMapLandmark[] = fixture.points.map(
    (point: [number, number, number], at: number): IAutoMovieRecoveryMapLandmark => ({
      id: at, point: [...point], observations: [0, 1, 2].map(
        (viewIndex: number): IAutoMovieRecoveryMapLandmark["observations"][number] => ({
          viewIndex, featureIndex: at, pixel: [...fixture.pixels[viewIndex]![at]!],
        }),
      ),
    }),
  );
  const perturbed: IAutoMovieRecoveryMapLandmark[] = exact.map(
    (landmark: IAutoMovieRecoveryMapLandmark, at: number): IAutoMovieRecoveryMapLandmark => ({
      ...landmark, point: [landmark.point[0] + 0.001 * (at % 3 - 1), landmark.point[1], landmark.point[2]],
    }),
  );
  const before: string = JSON.stringify({ poses: fixture.poses, exact, perturbed, intrinsics,
    policy: fixture.input.policy, budget: fixture.input.budget });
  const adaptive: ReturnType<typeof refineRecoveryCameraMap> = refineRecoveryCameraMap(fixture.poses, perturbed,
    intrinsics, fixture.input.policy, fixture.input.budget, (): void => {}, (): void => {}, {
      directionBudget: { maxIterations: 1000, maxEntries: 100000, maxWork: 10000000 },
      maxResidentLinearEntries: 10000000, sqpAcceleration: true, adaptiveRegularization: true,
    });
  const report: NonNullable<(typeof adaptive)["report"]["regularization"]> = adaptive.report.regularization!;
  TestValidator.predicate("actual camera accepted increments drive fit-local regularization",
    adaptive.report.acceptedSteps > 0 && adaptive.report.finalCost < adaptive.report.initialCost &&
    report !== undefined && report.initialDamping === 0.001 && report.finalDamping > 0 && Number.isFinite(report.finalDamping) &&
    report.supportedUpdates > 0 && report.supportedUpdates + report.unsupportedUpdates === adaptive.report.acceptedSteps &&
    report.lastUpdate !== null && adaptive.report.observationCount === 3 * exact.length &&
    adaptive.landmarks.every((landmark: IAutoMovieRecoveryMapLandmark, at: number): boolean =>
      landmark.id === exact[at]!.id && JSON.stringify(landmark.observations) === JSON.stringify(exact[at]!.observations)) &&
    nclose(Math.hypot(...adaptive.poses[1]!.translation), 1, 1e-12));
  const cameras: number = fixture.poses.length, points: number = exact.length, observations: number = 3 * points;
  const cameraWidth: number = 6 * cameras - 7, width: number = cameraWidth + 3 * points;
  const fixedRetained: number = 24 * observations * (cameraWidth + 20) + 24 * cameraWidth * cameraWidth +
    24 * points * (cameraWidth + 4) + 16 * width + 128 + 64 * (observations + points + cameras + 1);
  let refusedBeforeCopy: boolean = false, earlyWork: number = 0, earlyTrials: number = 0;
  try {
    refineRecoveryCameraMap(fixture.poses, exact, intrinsics, fixture.input.policy, fixture.input.budget,
      (): void => { earlyTrials++; }, (amount: number): void => { earlyWork += amount; }, {
        directionBudget: { maxIterations: 1000, maxEntries: 100000, maxWork: 10000000 },
        maxResidentLinearEntries: fixedRetained, adaptiveRegularization: true,
      });
  } catch { refusedBeforeCopy = earlyTrials === 0 && earlyWork === 4 * points; }
  const fixed: ReturnType<typeof refineRecoveryCameraMap> = refineRecoveryCameraMap(fixture.poses, exact,
    intrinsics, fixture.input.policy, fixture.input.budget, (): void => {}, (): void => {}, {
      directionBudget: { maxIterations: 1000, maxEntries: 100000, maxWork: 10000000 },
      maxResidentLinearEntries: fixedRetained, adaptiveRegularization: false,
    });
  const initialAdaptive: ReturnType<typeof refineRecoveryCameraMap> = refineRecoveryCameraMap(fixture.poses, exact,
    intrinsics, fixture.input.policy, fixture.input.budget, (): void => {}, (): void => {}, {
      directionBudget: { maxIterations: 1000, maxEntries: 100000, maxWork: 10000000 },
      maxResidentLinearEntries: 10000000, adaptiveRegularization: true,
    });
  TestValidator.predicate("extra adaptive retention refuses while fixed admission and initial KKT remain",
    refusedBeforeCopy && fixed.report.converged && fixed.report.iterations === 0 && fixed.report.regularization === undefined &&
    initialAdaptive.report.converged && initialAdaptive.report.iterations === 0 &&
    initialAdaptive.report.regularization!.finalDamping === 0.001 &&
    initialAdaptive.report.regularization!.supportedUpdates === 0 && initialAdaptive.report.regularization!.unsupportedUpdates === 0 &&
    initialAdaptive.report.regularization!.lastUpdate === null);
  const predictionWork: number = 32 * (observations * (cameraWidth + 4) + width + points + 1);
  const marker: Error = new Error("accepted-prediction-owner-work");
  let original: boolean = false, trialCount: number = 0;
  try {
    refineRecoveryCameraMap(fixture.poses, perturbed, intrinsics, fixture.input.policy, fixture.input.budget,
      (): void => { trialCount++; }, (amount: number): void => { if (trialCount > 0 && amount === predictionWork) throw marker; }, {
        directionBudget: { maxIterations: 1000, maxEntries: 100000, maxWork: 10000000 },
        maxResidentLinearEntries: 10000000, adaptiveRegularization: true,
      });
  } catch (error: unknown) { original = error === marker; }
  TestValidator.predicate("real accepted-path owner charge error propagates without mutating input",
    original && trialCount > 0 && JSON.stringify({ poses: fixture.poses, exact, perturbed, intrinsics,
      policy: fixture.input.policy, budget: fixture.input.budget }) === before);
}
