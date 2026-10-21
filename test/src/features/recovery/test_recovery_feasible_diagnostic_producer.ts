import { TestValidator } from "@nestia/e2e";

import { admitRecoveryCameraScene } from "../../../../packages/recovery/src/internal/admitRecoveryCameraScene";
import { completeRecoverySceneCheckpoint } from "../../../../packages/recovery/src/internal/completeRecoverySceneCheckpoint";
import { linkRecoveryCameraTracks } from "../../../../packages/recovery/src/internal/linkRecoveryCameraTracks";
import { refineRecoveryCameraMap } from "../../../../packages/recovery/src/internal/refineRecoveryCameraMap";
import type { IAutoMovieRecoveryMapLandmark } from "../../../../packages/recovery/src/structures/image/IAutoMovieRecoveryMapLandmark";
import type { IAutoMovieRecoveryMapPose } from "../../../../packages/recovery/src/structures/image/IAutoMovieRecoveryMapPose";
import type { IAutoMovieRecoverySceneWork } from "../../../../packages/recovery/src/structures/image/IAutoMovieRecoverySceneWork";
import type { IAutoMovieRecoveryFeasibleJointOptions } from "../../../../packages/recovery/src/structures/internal/IAutoMovieRecoveryFeasibleJointOptions";
import type { IAutoMovieRecoverySceneCheckpointTrace } from "../../../../packages/recovery/src/structures/internal/IAutoMovieRecoverySceneCheckpointTrace";
import { createRecoverySceneNumericalFixture } from "../internal/createRecoverySceneNumericalFixture";
import { nclose } from "../internal/nclose";

/**
 * Real generic/camera/checkpoint reports preserve terminal diagnostics and ownership.
 *
 * Scenarios:
 * 1. A prescribed exact two-camera population reaches its original normal without an actual update; all raw terminal checks and zero trial marginals reach the completed checkpoint.
 * 2. Caller method mutation at the first checkpoint cannot change the owned method/capacity; mutating the after-trace clone cannot alter the returned diagnostic block or borrowed input.
 * 3. The ordinary method omits the block, and an original final-evaluation charge error still returns no completed camera report.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs actual generic, camera and checkpoint owners over prescribed projections, checks the normal predicate inputs and independent trace identity, and observes ordinary absence and original late exception identity.
 * @evidence contracts/testing.md#independent-expectations Exact analytic points and their supplied two-view projections define the initial population. Original normal requires finite residuals, objective multiplier at least sqrt(1e-8), certified direction and unchanged physical inequalities. Initial normal has zero actual trials; this is not photographic accuracy or actual curvature-use evidence.
 * @evidence contracts/testing.md#distinguishing-cases Separates authored codec data from real producer output, direct/checkpoint scope ownership, mutable clone versus immutable source/result, ordinary absence and no-value final charge failure. Scene routing/late closure entries own accumulated accepted/candidate reports and rollback.
 * @evidence contracts/testing.md#execution-ownership The portable test_recovery_feasible_diagnostic_producer entry uses resident analytic arrays and actual source fitting; no photograph, matching acquisition, foreign override, host, process, compiler, filesystem or GPU starts.
 */
export function test_recovery_feasible_diagnostic_producer(): void {
  const fixture: ReturnType<typeof createRecoverySceneNumericalFixture> =
    createRecoverySceneNumericalFixture();
  const charts: ReturnType<typeof admitRecoveryCameraScene> =
    admitRecoveryCameraScene(fixture.input);
  const initial: IAutoMovieRecoveryMapLandmark[] = fixture.points
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
  const poses: (IAutoMovieRecoveryMapPose | null)[] = fixture.poses.map(
    (
      pose: IAutoMovieRecoveryMapPose,
      at: number,
    ): IAutoMovieRecoveryMapPose | null =>
      at < 2 ? structuredClone(pose) : null,
  );
  const tracks: ReturnType<typeof linkRecoveryCameraTracks>["tracks"] =
    linkRecoveryCameraTracks(
      fixture.features,
      fixture.pairs,
      fixture.input.budget,
    ).tracks;
  const before: string = JSON.stringify({ poses, initial, tracks });
  const options: IAutoMovieRecoveryFeasibleJointOptions = {
    directionBudget: {
      maxIterations: 10000,
      maxEntries: 25000,
      maxWork: 10000000000,
    },
    maxResidentLinearEntries: 250000,
  };
  const originalOptions: IAutoMovieRecoveryFeasibleJointOptions =
    structuredClone(options);
  let mutated: boolean = false;
  const work: IAutoMovieRecoverySceneWork = {
    cameraAttempts: 0,
    resectionTrials: 0,
    triangulations: 0,
    triangulationRefusals: 0,
    jointFits: 0,
    jointIterationAttempts: 0,
    linearWork: 0,
  };
  const events: IAutoMovieRecoverySceneCheckpointTrace[] = [];
  const result: ReturnType<typeof completeRecoverySceneCheckpoint> =
    completeRecoverySceneCheckpoint(
      poses,
      initial,
      tracks,
      charts,
      fixture.input.policy,
      fixture.input.budget,
      work,
      (): void => {
        if (!mutated) {
          mutated = true;
          options.maxResidentLinearEntries = 90000;
          options.directionBudget.maxEntries = 1;
          options.adaptiveRegularization = true;
        }
      },
      undefined,
      (event: IAutoMovieRecoverySceneCheckpointTrace): void => {
        events.push(event);
        if (event.joint?.feasible !== undefined) {
          event.joint.feasible.normalKktQualified = false;
          event.joint.feasible.lastDirection!.certified = false;
          event.joint.feasible.trials.baseline = 137;
        }
      },
      options,
    );
  const diagnostic:
    | NonNullable<NonNullable<typeof result.joint>["feasible"]>
    | undefined = result.joint?.feasible;
  TestValidator.predicate(
    "actual terminal normal inputs reach one completed checkpoint",
    mutated &&
      result.accepted &&
      result.joint?.converged === true &&
      result.joint.termination === "pixel-kkt" &&
      result.joint.regularization === undefined &&
      result.joint.observationCount === 48 &&
      result.joint.iterations === 0 &&
      result.joint.acceptedSteps === 0 &&
      work.jointFits === 1 &&
      work.jointIterationAttempts === 0 &&
      diagnostic !== undefined &&
      diagnostic.normalKktQualified &&
      nclose(diagnostic.tolerance, 1e-8, 0) &&
      typeof diagnostic.objectiveMultiplier === "number" &&
      diagnostic.objectiveMultiplier >= Math.sqrt(1e-8) &&
      typeof diagnostic.stationarity === "number" &&
      Number.isFinite(diagnostic.stationarity) &&
      typeof diagnostic.stationarityScale === "number" &&
      Number.isFinite(diagnostic.stationarityScale) &&
      diagnostic.stationarity <=
        diagnostic.tolerance * diagnostic.stationarityScale &&
      typeof diagnostic.complementarity === "number" &&
      Number.isFinite(diagnostic.complementarity) &&
      diagnostic.complementarity <= diagnostic.tolerance &&
      diagnostic.lastDirection?.certified === true &&
      diagnostic.lastSqp === null &&
      typeof diagnostic.directionWork === "number" &&
      diagnostic.directionWork > 0 &&
      diagnostic.trials.baseline === 0 &&
      diagnostic.trials.nominal === 0 &&
      diagnostic.trials.numerical === 0 &&
      diagnostic.trials.corrected === 0 &&
      diagnostic.trials.half === 0 &&
      diagnostic.trials.qualifiedUnselected === 0 &&
      diagnostic.trials.infeasible === 0 &&
      diagnostic.trials.nondecreasing === 0 &&
      diagnostic.trials.armijo === 0 &&
      diagnostic.trials.lastFailure === null &&
      diagnostic.trials.work === 0,
  );
  TestValidator.predicate(
    "owned trace mutation cannot change current reports or borrowed geometry",
    events.length === 2 &&
      events[0]!.joint === null &&
      events[1]!.joint?.feasible?.normalKktQualified === false &&
      events[1]!.joint?.feasible?.trials.baseline === 137 &&
      events[1]!.joint !== result.joint &&
      events[1]!.joint?.feasible !== diagnostic &&
      diagnostic?.normalKktQualified === true &&
      diagnostic.trials.baseline === 0 &&
      before === JSON.stringify({ poses, initial, tracks }),
  );
  const compactPoses: IAutoMovieRecoveryMapPose[] = [poses[0]!, poses[1]!];
  const intrinsics: number[][] = charts
    .slice(0, 2)
    .map((chart: (typeof charts)[number]): number[] => chart.matrix);
  const ordinary: ReturnType<typeof refineRecoveryCameraMap> =
    refineRecoveryCameraMap(
      compactPoses,
      initial,
      intrinsics,
      fixture.input.policy,
      fixture.input.budget,
      (): void => {},
    );
  TestValidator.predicate(
    "ordinary reporting has no hidden feasible method or diagnostic block",
    !Object.hasOwn(ordinary.report, "feasible"),
  );
  const marker: Error = new Error("camera-map: final reporting charge marker");
  let evaluations: number = 0;
  let caught: unknown = null;
  let completed: ReturnType<typeof refineRecoveryCameraMap> | null = null;
  try {
    completed = refineRecoveryCameraMap(
      compactPoses,
      initial,
      intrinsics,
      fixture.input.policy,
      fixture.input.budget,
      (): void => {},
      (amount: number): void => {
        // C5/E48 and24 points with2 observations give8*48*9+32*24*4.
        if (amount === 6528 && ++evaluations === 2) throw marker;
      },
      originalOptions,
    );
  } catch (error: unknown) {
    caught = error;
  }
  TestValidator.predicate(
    "a generic return cannot synthesize a camera report after original late charge failure",
    caught === marker &&
      completed === null &&
      evaluations === 2 &&
      before === JSON.stringify({ poses, initial, tracks }),
  );
}
