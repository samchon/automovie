import type { IAutoMovieRecoveryCameraSceneBudget } from "@automovie/interface/recovery";
import { TestValidator } from "@nestia/e2e";

import { createRecoverySceneSeedReportObserver } from "../../../../packages/recovery/src/internal/createRecoverySceneSeedReportObserver";
import type { IAutoMovieRecoveryCameraSceneEstimate } from "../../../../packages/recovery/src/structures/image/IAutoMovieRecoveryCameraSceneEstimate";
import type { IAutoMovieRecoveryMapJointFit } from "../../../../packages/recovery/src/structures/image/IAutoMovieRecoveryMapJointFit";
import type { IAutoMovieRecoverySceneWork } from "../../../../packages/recovery/src/structures/image/IAutoMovieRecoverySceneWork";

/**
 * A completed seed report survives later reporting-budget refusal.
 *
 * Scenarios:
 * 1. Setup needs32 visits and a before/after pair needs64, paid before any completed report is transferred.
 * 2. The after phase transfers a frozen report at the exact exhausted cap without another charge, while the next precharge preserves that report on refusal.
 * 3. A second closure before phase receives a nonnull previous report and still prepays; its after phase replaces one reference without mutating either report.
 * 4. Insufficient setup or first-pair work creates no target field or fictitious completed report.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the actual report observer and aggregate ledger with before/after notifications, inspecting report identity, distinct phase work and preserved refusal prefixes. It starts no numerical fit.
 * @evidence contracts/testing.md#independent-expectations Authored fixed reports supply distinct populations and nonconverged/converged outcomes. Declared32+64=96 and32+2*64=160 boundaries independently distinguish prepayment from a post-fit charge; frozen inputs detect mutation.
 * @evidence contracts/testing.md#distinguishing-cases Covers absent reports, exact-cap post transfer, later nonnull before phase, previous-report preservation, replacement, insufficient constructor/pair capacity and the original distinguished budget error. Scene transaction tests and the fixed seed experiment own producer integration rather than this state-transfer unit.
 * @evidence contracts/testing.md#execution-ownership The portable test_recovery_scene_seed_report entry uses plain records and the real metadata observer, with no foreign replacement, fit, file, process, compiler, browser or GPU.
 */
export function test_recovery_scene_seed_report(): void {
  const budget: IAutoMovieRecoveryCameraSceneBudget = {
    maxPixels: 1,
    maxDescriptorPairs: 1,
    maxTracks: 1,
    maxObservations: 1,
    maxResectionTrials: 1,
    minimumResectionTrials: 1,
    maxLocalRefinements: 1,
    maxRefinementIterations: 100,
    maxLinearEntries: 1,
    maxSingularSweeps: 1,
    maxViews: 3,
    maxCameraAttempts: 1,
    maxTotalResectionTrials: 1,
    maxTriangulations: 1,
    maxJointFits: 1,
    maxLinearWork: 96,
    maxResidentLinearEntries: 1,
  };
  const makeWork: () => IAutoMovieRecoverySceneWork =
    (): IAutoMovieRecoverySceneWork => ({
      cameraAttempts: 0,
      resectionTrials: 0,
      triangulations: 0,
      triangulationRefusals: 0,
      jointFits: 0,
      jointIterationAttempts: 0,
      linearWork: 0,
    });
  const first: IAutoMovieRecoveryMapJointFit = Object.freeze({
    converged: false,
    termination: "iteration-budget",
    iterations: 1,
    acceptedSteps: 1,
    observationCount: 48,
    initialCost: 1,
    finalCost: 0.5,
    initialSquaredError: 2,
    finalSquaredError: 1,
    minimumCameraDesignRatio: 0.1,
    minimumPointDesignRatio: 0.2,
  });
  const second: IAutoMovieRecoveryMapJointFit = Object.freeze({
    ...first,
    converged: true,
    termination: "pixel-kkt",
    observationCount: 50,
    iterations: 2,
    acceptedSteps: 2,
    finalCost: 0.25,
  });
  const before: string = JSON.stringify({ first, second });
  const target: Pick<
    IAutoMovieRecoveryCameraSceneEstimate,
    "refusedSeedJoint"
  > = {};
  const work: IAutoMovieRecoverySceneWork = makeWork();
  const observer: ReturnType<typeof createRecoverySceneSeedReportObserver> =
    createRecoverySceneSeedReportObserver(target, work, budget);
  TestValidator.predicate(
    "setup precedes any report or paired observation",
    work.linearWork === 32 && !Object.hasOwn(target, "refusedSeedJoint"),
  );
  observer(24, 48, null);
  TestValidator.predicate(
    "before-fit prepayment cannot fabricate a completed report",
    work.linearWork === 96 && !Object.hasOwn(target, "refusedSeedJoint"),
  );
  observer(24, 48, first);
  TestValidator.predicate(
    "post-fit reference transfer needs no remaining budget",
    target.refusedSeedJoint === first && work.linearWork === 96,
  );
  let caught: unknown = null;
  try {
    observer(25, 50, first);
  } catch (error: unknown) {
    caught = error;
  }
  TestValidator.predicate(
    "next precharge refusal preserves the earlier completed report",
    caught instanceof Error &&
      caught.name === "RecoverySceneBudget" &&
      target.refusedSeedJoint === first &&
      work.linearWork === 96,
  );
  const repeated: Pick<
    IAutoMovieRecoveryCameraSceneEstimate,
    "refusedSeedJoint"
  > = {};
  const repeatedWork: IAutoMovieRecoverySceneWork = makeWork();
  const repeatedObserver: ReturnType<
    typeof createRecoverySceneSeedReportObserver
  > = createRecoverySceneSeedReportObserver(repeated, repeatedWork, {
    ...budget,
    maxLinearWork: 160,
  });
  repeatedObserver(24, 48, null);
  repeatedObserver(24, 48, first);
  repeatedObserver(25, 50, first);
  TestValidator.predicate(
    "a nonnull previous report still enters the before phase",
    repeatedWork.linearWork === 160 && repeated.refusedSeedJoint === first,
  );
  repeatedObserver(25, 50, second);
  TestValidator.predicate(
    "only the latest completed reference transfers without input mutation",
    repeated.refusedSeedJoint === second &&
      Object.keys(repeated).join(",") === "refusedSeedJoint" &&
      repeatedWork.linearWork === 160 &&
      before === JSON.stringify({ first, second }),
  );
  const setupTarget: Pick<
    IAutoMovieRecoveryCameraSceneEstimate,
    "refusedSeedJoint"
  > = {};
  const setupWork: IAutoMovieRecoverySceneWork = makeWork();
  caught = null;
  try {
    createRecoverySceneSeedReportObserver(setupTarget, setupWork, {
      ...budget,
      maxLinearWork: 31,
    });
  } catch (error: unknown) {
    caught = error;
  }
  TestValidator.predicate(
    "failed setup acquires neither report nor consumed work",
    caught instanceof Error &&
      caught.name === "RecoverySceneBudget" &&
      setupWork.linearWork === 0 &&
      !Object.hasOwn(setupTarget, "refusedSeedJoint"),
  );
  const pairTarget: Pick<
    IAutoMovieRecoveryCameraSceneEstimate,
    "refusedSeedJoint"
  > = {};
  const pairWork: IAutoMovieRecoverySceneWork = makeWork();
  const pairObserver: ReturnType<typeof createRecoverySceneSeedReportObserver> =
    createRecoverySceneSeedReportObserver(pairTarget, pairWork, {
      ...budget,
      maxLinearWork: 95,
    });
  caught = null;
  try {
    pairObserver(24, 48, null);
  } catch (error: unknown) {
    caught = error;
  }
  TestValidator.predicate(
    "failed first-pair admission leaves only the prepaid setup prefix",
    caught instanceof Error &&
      caught.name === "RecoverySceneBudget" &&
      pairWork.linearWork === 32 &&
      !Object.hasOwn(pairTarget, "refusedSeedJoint"),
  );
}
