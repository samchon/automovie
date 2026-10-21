import { TestValidator } from "@nestia/e2e";

import { RecoveryFeasibleCapacityError } from "../../../../packages/recovery/src/internal/RecoveryFeasibleCapacityError";
import { admitRecoveryCameraScene } from "../../../../packages/recovery/src/internal/admitRecoveryCameraScene";
import { prepareRecoveryFeasibleMapWork } from "../../../../packages/recovery/src/internal/prepareRecoveryFeasibleMapWork";
import { prepareRecoverySceneFeasibleRouting } from "../../../../packages/recovery/src/internal/prepareRecoverySceneFeasibleRouting";
import type { IAutoMovieRecoveryMapLandmark } from "../../../../packages/recovery/src/structures/image/IAutoMovieRecoveryMapLandmark";
import type { IAutoMovieRecoverySceneWork } from "../../../../packages/recovery/src/structures/image/IAutoMovieRecoverySceneWork";
import type { IAutoMovieRecoveryFeasibleJointOptions } from "../../../../packages/recovery/src/structures/internal/IAutoMovieRecoveryFeasibleJointOptions";
import { createRecoverySceneNumericalFixture } from "../internal/createRecoverySceneNumericalFixture";

/**
 * Fixed scene method ownership and narrow camera capacity classification.
 *
 * Scenarios:
 * 1. Two owned budget records and nested options survive caller mutation, charge256 once and partition64 slots without changing reported ceilings.
 * 2. Unsafe, malformed, above-scene and lagged-without-SQP requests propagate; aggregate setup exhaustion is its original budget error.
 * 3. The prescribed two-camera24-point48-observation population admits exact independently calculated boundaries, with each adjacent insufficient capacity classified separately.
 * 4. Invalid identity gauge, sparse gauge coefficients and charge markers remain core errors even when a resource bound is also too small.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the real routing snapshot and camera work owners, observing ownership, charged work, exact boundary admission and concrete error identity.
 * @evidence contracts/testing.md#independent-expectations The fixed record has17 budget fields; reserving64 from250000 leaves249936. C5,L24,E48 gives n77,Zw461, direction entries1351, minimum work196184 and base retention40744 by the published camera formulas, independently of helper outputs.
 * @evidence contracts/testing.md#distinguishing-cases Covers accepted equality and each one-below bound, caller mutation, null/nested malformed records, unsafe numbers/flags, upper scene caps, invalid SQP combination, aggregate exhaustion, bad and hole gauge priority and original charge failure. Workflow routing and full proposal rollback are separate entries.
 * @evidence contracts/testing.md#execution-ownership The portable test_recovery_scene_feasible_admission entry uses resident analytic geometry and direct source calls without a host, compiler, filesystem, GPU, installation or photo fit.
 */
export function test_recovery_scene_feasible_admission(): void {
  const fixture: ReturnType<typeof createRecoverySceneNumericalFixture> =
    createRecoverySceneNumericalFixture();
  const options: IAutoMovieRecoveryFeasibleJointOptions = {
    directionBudget: {
      maxIterations: 10000,
      maxEntries: 25000,
      maxWork: 10000000000,
    },
    maxResidentLinearEntries: 250000,
    sqpAcceleration: true,
    adaptiveRegularization: true,
    laggedLagrangianMetric: true,
  };
  const ledger: () => IAutoMovieRecoverySceneWork =
    (): IAutoMovieRecoverySceneWork => ({
      cameraAttempts: 0,
      resectionTrials: 0,
      triangulations: 0,
      triangulationRefusals: 0,
      jointFits: 0,
      jointIterationAttempts: 0,
      linearWork: 0,
    });
  const work: IAutoMovieRecoverySceneWork = ledger();
  const budget: typeof fixture.input.budget = { ...fixture.input.budget };
  const owned: ReturnType<typeof prepareRecoverySceneFeasibleRouting> =
    prepareRecoverySceneFeasibleRouting(budget, options, work);
  budget.maxLinearWork = 1;
  budget.maxResidentLinearEntries = 1;
  options.directionBudget.maxEntries = 1;
  options.maxResidentLinearEntries = 1;
  options.laggedLagrangianMetric = false;
  TestValidator.predicate(
    "owned fixed request and original budget survive caller mutation",
    work.linearWork === 256 &&
      owned.declared.maxResidentLinearEntries === 250000 &&
      owned.execution.maxResidentLinearEntries === 249936 &&
      owned.declared.maxLinearWork === 10000000000 &&
      owned.execution.maxLinearWork === 10000000000 &&
      owned.feasible.maxResidentLinearEntries === 249936 &&
      owned.feasible.directionBudget.maxEntries === 25000 &&
      owned.feasible.laggedLagrangianMetric === true,
  );
  const valid: IAutoMovieRecoveryFeasibleJointOptions = {
    directionBudget: {
      maxIterations: 10000,
      maxEntries: 25000,
      maxWork: 10000000000,
    },
    maxResidentLinearEntries: 250000,
  };
  const invalid: unknown[] = [
    null,
    {},
    { directionBudget: null },
    { ...valid, maxResidentLinearEntries: NaN },
    { ...valid, adaptiveRegularization: "true" },
    { ...valid, laggedLagrangianMetric: true },
    { ...valid, maxResidentLinearEntries: 250001 },
    {
      ...valid,
      directionBudget: { ...valid.directionBudget, maxEntries: 25001 },
    },
    {
      ...valid,
      directionBudget: { ...valid.directionBudget, maxWork: 10000000001 },
    },
    {
      ...valid,
      directionBudget: {
        ...valid.directionBudget,
        maxIterations: Number.MAX_SAFE_INTEGER + 1,
      },
    },
  ];
  let rejected: number = 0;
  for (const request of invalid)
    try {
      prepareRecoverySceneFeasibleRouting(
        fixture.input.budget,
        request as IAutoMovieRecoveryFeasibleJointOptions,
        ledger(),
      );
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        !(error instanceof RecoveryFeasibleCapacityError)
      )
        rejected++;
    }
  TestValidator.predicate(
    "invalid method requests cannot become capacity or ordinary fallback",
    rejected === invalid.length,
  );
  let exhausted: unknown = null;
  const emptyWork: IAutoMovieRecoverySceneWork = ledger();
  try {
    prepareRecoverySceneFeasibleRouting(
      { ...fixture.input.budget, maxLinearWork: 255 },
      valid,
      emptyWork,
    );
  } catch (error: unknown) {
    exhausted = error;
  }
  TestValidator.predicate(
    "setup aggregate exhaustion preserves the original error and unspent ledger",
    exhausted instanceof Error &&
      exhausted.name === "RecoverySceneBudget" &&
      emptyWork.linearWork === 0,
  );
  const landmarks: IAutoMovieRecoveryMapLandmark[] = fixture.points
    .slice(0, 24)
    .map(
      (
        point: [number, number, number],
        id: number,
      ): IAutoMovieRecoveryMapLandmark => ({
        id,
        point: [...point],
        observations: [0, 1].map(
          (
            viewIndex: number,
          ): IAutoMovieRecoveryMapLandmark["observations"][number] => ({
            viewIndex,
            featureIndex: id,
            pixel: [...fixture.features[viewIndex]!.points[id]!.point],
          }),
        ),
      }),
    );
  const poses: typeof fixture.poses = structuredClone(
    fixture.poses.slice(0, 2),
  );
  const intrinsics: number[][] = admitRecoveryCameraScene(fixture.input)
    .slice(0, 2)
    .map(
      (chart: ReturnType<typeof admitRecoveryCameraScene>[number]): number[] =>
        chart.matrix,
    );
  const exact: IAutoMovieRecoveryFeasibleJointOptions = {
    directionBudget: { maxIterations: 1, maxEntries: 1351, maxWork: 196184 },
    maxResidentLinearEntries: 40744,
  };
  let charged: number = 0;
  const accepted: ReturnType<typeof prepareRecoveryFeasibleMapWork> =
    prepareRecoveryFeasibleMapWork(
      poses,
      landmarks,
      intrinsics,
      fixture.input.budget,
      exact,
      (amount: number): void => {
        charged += amount;
      },
    );
  TestValidator.predicate(
    "independent exact minimum capacity admits before any state clone",
    charged === 96 &&
      accepted.retained === 40744 &&
      accepted.observations === 48 &&
      accepted.width === 77,
  );
  const small: IAutoMovieRecoveryFeasibleJointOptions[] = [
    { ...exact, maxResidentLinearEntries: 40743 },
    {
      ...exact,
      directionBudget: { ...exact.directionBudget, maxEntries: 1350 },
    },
    {
      ...exact,
      directionBudget: { ...exact.directionBudget, maxWork: 196183 },
    },
  ];
  const reasons: string[] = [];
  for (const request of small)
    try {
      prepareRecoveryFeasibleMapWork(
        poses,
        landmarks,
        intrinsics,
        fixture.input.budget,
        request,
        (): void => {},
      );
    } catch (error: unknown) {
      if (error instanceof RecoveryFeasibleCapacityError)
        reasons.push(error.reason);
    }
  TestValidator.predicate(
    "three adjacent valid insufficiencies have explicit ownership",
    reasons.join(",") === "resident,direction-entries,direction-work",
  );
  const marker: Error = new Error("camera-map: charge marker must escape");
  let chargeError: unknown = null;
  try {
    prepareRecoveryFeasibleMapWork(
      poses,
      landmarks,
      intrinsics,
      fixture.input.budget,
      small[0]!,
      (): void => {
        throw marker;
      },
    );
  } catch (error: unknown) {
    chargeError = error;
  }
  const badGauges: (typeof poses)[] = [
    structuredClone(poses),
    structuredClone(poses),
    structuredClone(poses),
  ];
  badGauges[0]![0]!.translation[0] = 1;
  badGauges[1]![0]!.rotation = new Array<number>(9);
  badGauges[2]![0]!.translation = new Array<number>(3) as [
    number,
    number,
    number,
  ];
  let coreErrors: number = 0;
  for (const bad of badGauges)
    try {
      prepareRecoveryFeasibleMapWork(
        bad,
        landmarks,
        intrinsics,
        fixture.input.budget,
        small[0]!,
        (): void => {},
      );
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        !(error instanceof RecoveryFeasibleCapacityError)
      )
        coreErrors++;
    }
  TestValidator.predicate(
    "core gauge and charge failures take priority over capacity",
    coreErrors === 3 && chargeError === marker,
  );
}
