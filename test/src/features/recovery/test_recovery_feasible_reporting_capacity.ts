import { TestValidator } from "@nestia/e2e";

import { RecoveryFeasibleCapacityError } from "../../../../packages/recovery/src/internal/RecoveryFeasibleCapacityError";
import { admitRecoveryCameraScene } from "../../../../packages/recovery/src/internal/admitRecoveryCameraScene";
import { prepareRecoveryCheckpointReportCapacity } from "../../../../packages/recovery/src/internal/prepareRecoveryCheckpointReportCapacity";
import { prepareRecoveryFeasibleMapReporting } from "../../../../packages/recovery/src/internal/prepareRecoveryFeasibleMapReporting";
import { prepareRecoveryFeasibleReportCapacity } from "../../../../packages/recovery/src/internal/prepareRecoveryFeasibleReportCapacity";
import { prepareRecoverySceneFeasibleRouting } from "../../../../packages/recovery/src/internal/prepareRecoverySceneFeasibleRouting";
import { prepareRecoverySceneReportCapacity } from "../../../../packages/recovery/src/internal/prepareRecoverySceneReportCapacity";
import type { IAutoMovieRecoveryMapLandmark } from "../../../../packages/recovery/src/structures/image/IAutoMovieRecoveryMapLandmark";
import type { IAutoMovieRecoverySceneWork } from "../../../../packages/recovery/src/structures/image/IAutoMovieRecoverySceneWork";
import type { IAutoMovieRecoveryFeasibleJointOptions } from "../../../../packages/recovery/src/structures/internal/IAutoMovieRecoveryFeasibleJointOptions";
import { createRecoverySceneNumericalFixture } from "../internal/createRecoverySceneNumericalFixture";

/**
 * Fixed report retention and prepayment preserve independent numerical budgets.
 *
 * Scenarios:
 * 1. A scene with A20 reserves22*512 reporting slots once after the original64 route partition, while its original declared250000 and narrower fit ceiling remain intact.
 * 2. Direct map numerical40744 plus64 chart slots admits exact report-inclusive41320 but refuses41319; supplied contexts avoid another setup charge while every fit prepays projection.
 * 3. Unsafe scalar configuration remains core; valid insufficient capacity has its concrete identity. Indexed numeric gauge and original charge errors precede report-capacity refusal.
 * 4. Aggregate setup exhaustion leaves the original ledger/prefix and no context, preserving the coordinator catch contract.
 *
 * @evidence contracts/testing.md#behavioral-verification Exercises actual scope, scene and map admission owners, observing exact remaining capacities, precharges, alias reuse and error identities without running a solver.
 * @evidence contracts/testing.md#independent-expectations A20 gives22*512=11264 and250000-64-11264=238672. C5/L24/E48 has original numerical40744/entry1351/work196184, separately admitted chart64 and reporting512 resident slots. Reporting setup256 and projection2048 leave raw QP minima unchanged.
 * @evidence contracts/testing.md#distinguishing-cases Covers equality/adjacent insufficiency, unsafe and tiny caps, narrow independent fit cap, owned budget mutation, supplied-scope reuse, aggregate prefix preservation, sparse/incorrect gauge and original charge marker. Actual producer/trace and serialization have separate entries.
 * @evidence contracts/testing.md#execution-ownership The portable test_recovery_feasible_reporting_capacity entry calls admission over analytic resident data only; no numerical fit, foreign override, host, process, filesystem, compiler, GPU or photo starts.
 */
export function test_recovery_feasible_reporting_capacity(): void {
  const fixture: ReturnType<typeof createRecoverySceneNumericalFixture> =
    createRecoverySceneNumericalFixture();
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
  const options: IAutoMovieRecoveryFeasibleJointOptions = {
    directionBudget: { maxIterations: 1, maxEntries: 1351, maxWork: 196184 },
    maxResidentLinearEntries: 90000,
  };
  const original: typeof fixture.input.budget = { ...fixture.input.budget };
  const sceneWork: IAutoMovieRecoverySceneWork = ledger();
  const routing: ReturnType<typeof prepareRecoverySceneFeasibleRouting> =
    prepareRecoverySceneFeasibleRouting(original, options, sceneWork);
  original.maxCameraAttempts = 1;
  original.maxResidentLinearEntries = 1;
  prepareRecoverySceneReportCapacity(routing, sceneWork);
  TestValidator.predicate(
    "one scene scope partitions owned ceilings after original routing",
    sceneWork.linearWork === 512 &&
      routing.reporting !== undefined &&
      routing.reporting.reservedEntries === 11264 &&
      routing.reporting.sceneEntries === 238672 &&
      routing.reporting.fitEntries === 89488 &&
      routing.execution.maxResidentLinearEntries === 238672 &&
      routing.declared.maxResidentLinearEntries === 250000 &&
      routing.declared.maxCameraAttempts === 20 &&
      options.maxResidentLinearEntries === 90000 &&
      routing.feasible.directionBudget.maxWork === 196184,
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
    ...options,
    maxResidentLinearEntries: 41320,
  };
  let spent: number = 0;
  const accepted: ReturnType<typeof prepareRecoveryFeasibleMapReporting> =
    prepareRecoveryFeasibleMapReporting(
      poses,
      landmarks,
      intrinsics,
      fixture.input.budget,
      exact,
      (amount: number): void => {
        spent += amount;
      },
    );
  TestValidator.predicate(
    "exact report-inclusive direct capacity pays one setup and projection",
    accepted.retained === 40808 &&
      accepted.reporting.fitEntries === 40808 &&
      accepted.reporting.reservedEntries === 512 &&
      spent === 2400 &&
      exact.maxResidentLinearEntries === 41320 &&
      exact.directionBudget.maxWork === 196184,
  );
  spent = 0;
  let adjacent: unknown = null;
  try {
    prepareRecoveryFeasibleMapReporting(
      poses,
      landmarks,
      intrinsics,
      fixture.input.budget,
      { ...exact, maxResidentLinearEntries: 41319 },
      (amount: number): void => {
        spent += amount;
      },
    );
  } catch (error: unknown) {
    adjacent = error;
  }
  TestValidator.predicate(
    "one fewer resident slot refuses before projection or fitting",
    adjacent instanceof RecoveryFeasibleCapacityError &&
      adjacent.reason === "resident" &&
      spent === 416,
  );
  spent = 0;
  const reused: ReturnType<typeof prepareRecoveryFeasibleMapReporting> =
    prepareRecoveryFeasibleMapReporting(
      poses,
      landmarks,
      intrinsics,
      fixture.input.budget,
      options,
      (amount: number): void => {
        spent += amount;
      },
      routing.reporting,
    );
  TestValidator.predicate(
    "borrowed scene context is not reserved or charged again",
    reused.reporting === routing.reporting &&
      spent === 2144 &&
      reused.reporting.fitEntries === 89488 &&
      reused.reporting.reservedEntries === 11264,
  );
  const tiny: ReturnType<typeof prepareRecoveryFeasibleReportCapacity> =
    prepareRecoveryFeasibleReportCapacity(513, 1, 0);
  TestValidator.predicate(
    "a valid narrow fit cap remains representable for post-gauge capacity classification",
    tiny.sceneEntries === 1 &&
      tiny.fitEntries === -511 &&
      tiny.reservedEntries === 512,
  );
  let capacity: unknown = null;
  try {
    prepareRecoveryFeasibleReportCapacity(512, 512, 0);
  } catch (error: unknown) {
    capacity = error;
  }
  let unsafe: unknown = null;
  try {
    prepareRecoveryFeasibleReportCapacity(250000, NaN, 0);
  } catch (error: unknown) {
    unsafe = error;
  }
  TestValidator.predicate(
    "fixed resource insufficiency and unsafe input keep distinct identities",
    capacity instanceof RecoveryFeasibleCapacityError &&
      capacity.reason === "resident" &&
      unsafe instanceof Error &&
      !(unsafe instanceof RecoveryFeasibleCapacityError),
  );
  const bad: typeof poses = structuredClone(poses);
  bad[0]!.rotation = new Array<number>(9);
  const gaugeWork: IAutoMovieRecoverySceneWork = ledger();
  let gauge: unknown = null;
  try {
    prepareRecoveryCheckpointReportCapacity(
      bad[0]!,
      { ...fixture.input.budget, maxResidentLinearEntries: 1 },
      options,
      gaugeWork,
    );
  } catch (error: unknown) {
    gauge = error;
  }
  TestValidator.predicate(
    "indexed gauge wins over a simultaneous fixed capacity shortage",
    gauge instanceof Error &&
      !(gauge instanceof RecoveryFeasibleCapacityError) &&
      gaugeWork.linearWork === 256,
  );
  const marker: Error = new Error("camera-map: reporting charge marker");
  let chargeError: unknown = null;
  try {
    prepareRecoveryFeasibleMapReporting(
      poses,
      landmarks,
      intrinsics,
      fixture.input.budget,
      exact,
      (): void => {
        throw marker;
      },
    );
  } catch (error: unknown) {
    chargeError = error;
  }
  const exhaustedWork: IAutoMovieRecoverySceneWork = ledger();
  const exhausted: ReturnType<typeof prepareRecoverySceneFeasibleRouting> =
    prepareRecoverySceneFeasibleRouting(
      { ...fixture.input.budget, maxLinearWork: 256 },
      {
        ...options,
        directionBudget: { ...options.directionBudget, maxWork: 256 },
      },
      exhaustedWork,
    );
  let exhaustedError: unknown = null;
  try {
    prepareRecoverySceneReportCapacity(exhausted, exhaustedWork);
  } catch (error: unknown) {
    exhaustedError = error;
  }
  TestValidator.predicate(
    "original charge and aggregate setup failures preserve their prefix",
    chargeError === marker &&
      exhaustedError instanceof Error &&
      exhaustedError.name === "RecoverySceneBudget" &&
      exhaustedWork.linearWork === 256 &&
      !Object.hasOwn(exhausted, "reporting") &&
      exhausted.execution.maxResidentLinearEntries === 249936,
  );
}
