import { TestValidator } from "@nestia/e2e";

import { RecoveryFeasibleCapacityError } from "../../../../packages/recovery/src/internal/RecoveryFeasibleCapacityError";
import { admitRecoveryCameraScene } from "../../../../packages/recovery/src/internal/admitRecoveryCameraScene";
import { completeRecoverySceneCheckpoint } from "../../../../packages/recovery/src/internal/completeRecoverySceneCheckpoint";
import type { linkRecoveryCameraTracks } from "../../../../packages/recovery/src/internal/linkRecoveryCameraTracks";
import type { IAutoMovieRecoveryMapJointFit } from "../../../../packages/recovery/src/structures/image/IAutoMovieRecoveryMapJointFit";
import type { IAutoMovieRecoveryMapLandmark } from "../../../../packages/recovery/src/structures/image/IAutoMovieRecoveryMapLandmark";
import type { IAutoMovieRecoveryMapPose } from "../../../../packages/recovery/src/structures/image/IAutoMovieRecoveryMapPose";
import type { IAutoMovieRecoverySceneWork } from "../../../../packages/recovery/src/structures/image/IAutoMovieRecoverySceneWork";
import { createRecoverySceneNumericalFixture } from "../internal/createRecoverySceneNumericalFixture";

/**
 * Explicit accepted-agreement closure discards a later capacity-refused proposal.
 *
 * Scenarios:
 * 1. Eight authored nonplanar points have two seed observations each and a third registered camera. The latter cameras look at depth2 from centers1/2. A prescribed depth perturbation0.012 gives seed error730e/(5+2e)<2 and third-camera error760e/(4+e)>2.
 * 2. Growth initially retains23 observations. The explicitly selected adaptive method must perform supported accepted-increment reactions and reach original physical normal before strict closure proposes24 observations. SQP and lagged curvature remain absent.
 * 3. The independently calculated23-row population direction bound984 admits the first fit; the next bound1015 exceeds it, preserving all input geometry and consumed work rather than returning the intermediate result.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the actual detached completion owner through growth, an explicitly adaptive feasible fit and the next population's capacity admission. Requires original normal, supported selected-increment reactions, explicit capacity identity and unchanged borrowed arrays. A bounded failure label preserves the observed branch without rerunning it.
 * @evidence contracts/testing.md#independent-expectations Authored look-at rotations, centers0/1/2, pinhole K and eight nonplanar points supply coordinates independently. The first four points have nonzero determinant0.336. Perturbation0.012 lies between8/758 and10/726. For C11,L8,n35,E23, Zw357 and m24 give2Zw+3m+2n+128=984; E24 gives1015. No returned geometry is used as its own expected answer.
 * @evidence contracts/testing.md#distinguishing-cases Distinguishes a supported adaptive reaction and intermediate normal fit from complete strict-growth transaction success. This does not promise finite100 convergence for the separate pure fixed-damping method or prove adaptive causality. Seed and first candidate capacity, aggregate exhaustion, default orchestration and callback failures are covered by adjacent workflow entries.
 * @evidence contracts/testing.md#execution-ownership The portable test_recovery_scene_feasible_closure entry uses resident authored geometry, source callbacks and scalar snapshots; no host, filesystem, process, installation, compiler, browser, GPU or photograph starts.
 */
export function test_recovery_scene_feasible_closure(): void {
  const fixture: ReturnType<typeof createRecoverySceneNumericalFixture> =
    createRecoverySceneNumericalFixture();
  const charts: ReturnType<typeof admitRecoveryCameraScene> =
    admitRecoveryCameraScene(fixture.input).slice(0, 3);
  const c: number = 2 / Math.sqrt(5);
  const s: number = 1 / Math.sqrt(5);
  const q: number = 1 / Math.sqrt(2);
  const perturbation: number = 0.012;
  const poses: IAutoMovieRecoveryMapPose[] = [
    { rotation: [1, 0, 0, 0, 1, 0, 0, 0, 1], translation: [0, 0, 0] },
    { rotation: [c, 0, s, 0, 1, 0, -s, 0, c], translation: [-c, 0, s] },
    { rotation: [q, 0, q, 0, 1, 0, -q, 0, q], translation: [-2 * q, 0, 2 * q] },
  ];
  const points: [number, number, number][] = [
    [0, 0, 2],
    [-0.3, -0.2, 2.5],
    [0.4, -0.2, 3.2],
    [-0.2, 0.35, 2.8],
    [0.3, 0.25, 3.5],
    [-0.4, 0.1, 3.8],
    [0.2, -0.35, 2.3],
    [0.05, 0.4, 3.1],
  ];
  const tracks: ReturnType<typeof linkRecoveryCameraTracks>["tracks"] =
    points.map(
      (
        point: [number, number, number],
        id: number,
      ): ReturnType<typeof linkRecoveryCameraTracks>["tracks"][number] => ({
        id,
        observations: poses.map(
          (
            pose: IAutoMovieRecoveryMapPose,
            viewIndex: number,
          ): IAutoMovieRecoveryMapLandmark["observations"][number] => {
            const camera: (typeof fixture.input.views)[number]["camera"] =
              fixture.input.views[viewIndex]!.camera;
            const x: number =
              pose.rotation[0] * point[0] +
              pose.rotation[1] * point[1] +
              pose.rotation[2] * point[2] +
              pose.translation[0];
            const y: number =
              pose.rotation[3] * point[0] +
              pose.rotation[4] * point[1] +
              pose.rotation[5] * point[2] +
              pose.translation[1];
            const z: number =
              pose.rotation[6] * point[0] +
              pose.rotation[7] * point[1] +
              pose.rotation[8] * point[2] +
              pose.translation[2];
            return {
              viewIndex,
              featureIndex: id,
              pixel: [
                (camera.focalPx[0] * x + camera.skewPx * y) / z +
                  camera.principalPointPx[0],
                (camera.focalPx[1] * y) / z + camera.principalPointPx[1],
              ],
            };
          },
        ),
      }),
    );
  const initial: IAutoMovieRecoveryMapLandmark[] = points.map(
    (
      point: [number, number, number],
      id: number,
    ): IAutoMovieRecoveryMapLandmark => ({
      id,
      point: [point[0], point[1], point[2] + (id === 0 ? perturbation : 0)],
      observations: structuredClone(tracks[id]!.observations.slice(0, 2)),
    }),
  );
  const before: string = JSON.stringify({ poses, initial, tracks });
  const work: IAutoMovieRecoverySceneWork = {
    cameraAttempts: 0,
    resectionTrials: 0,
    triangulations: 0,
    triangulationRefusals: 0,
    jointFits: 0,
    jointIterationAttempts: 0,
    linearWork: 0,
  };
  let firstCompleted: IAutoMovieRecoveryMapJointFit | null = null;
  let lastCount: number = 0;
  let returned: ReturnType<typeof completeRecoverySceneCheckpoint> | null =
    null;
  let caught: unknown = null;
  try {
    returned = completeRecoverySceneCheckpoint(
      poses,
      initial,
      tracks,
      charts,
      fixture.input.policy,
      fixture.input.budget,
      work,
      (): void => {},
      (
        _: number,
        count: number,
        report: IAutoMovieRecoveryMapJointFit | null,
      ): void => {
        lastCount = count;
        if (report !== null && firstCompleted === null)
          firstCompleted = structuredClone(report);
      },
      undefined,
      {
        directionBudget: {
          maxIterations: 10000,
          maxEntries: 984,
          maxWork: 10000000000,
        },
        maxResidentLinearEntries: 250000,
        adaptiveRegularization: true,
      },
    );
  } catch (error: unknown) {
    caught = error;
  }
  const diagnostic: string = JSON.stringify({
    firstCompleted,
    lastCount,
    work,
    returned:
      returned === null
        ? null
        : {
            accepted: returned.accepted,
            reasons: returned.reasons,
            observations: returned.proposedObservations,
          },
    caught:
      caught === null
        ? null
        : {
            name: caught instanceof Error ? caught.name : null,
            message: caught instanceof Error ? caught.message : String(caught),
            capacityReason:
              caught instanceof RecoveryFeasibleCapacityError
                ? caught.reason
                : null,
          },
    inputUnchanged: before === JSON.stringify({ poses, initial, tracks }),
  });
  TestValidator.predicate(
    "authored perturbation separates seed and missing-view pixel gates",
    perturbation > 8 / 758 &&
      perturbation < 10 / 726 &&
      (730 * perturbation) / (5 + 2 * perturbation) < 2 &&
      (760 * perturbation) / (4 + perturbation) > 2,
  );
  TestValidator.predicate(
    `the first admitted population completes its original physical normal: ${diagnostic}`,
    firstCompleted !== null &&
      (firstCompleted as IAutoMovieRecoveryMapJointFit).converged &&
      (firstCompleted as IAutoMovieRecoveryMapJointFit).termination ===
        "pixel-kkt" &&
      (firstCompleted as IAutoMovieRecoveryMapJointFit).observationCount === 23,
  );
  TestValidator.predicate(
    `the explicit accepted-agreement owner supports selected increments: ${diagnostic}`,
    firstCompleted !== null &&
      (firstCompleted as IAutoMovieRecoveryMapJointFit).acceptedSteps! > 0 &&
      (firstCompleted as IAutoMovieRecoveryMapJointFit).regularization !==
        undefined &&
      (firstCompleted as IAutoMovieRecoveryMapJointFit).regularization!
        .initialDamping === 0.001 &&
      Number.isFinite(
        (firstCompleted as IAutoMovieRecoveryMapJointFit).regularization!
          .finalDamping,
      ) &&
      (firstCompleted as IAutoMovieRecoveryMapJointFit).regularization!
        .finalDamping > 0 &&
      (firstCompleted as IAutoMovieRecoveryMapJointFit).regularization!
        .supportedUpdates > 0 &&
      (firstCompleted as IAutoMovieRecoveryMapJointFit).regularization!
        .supportedUpdates +
        (firstCompleted as IAutoMovieRecoveryMapJointFit).regularization!
          .unsupportedUpdates ===
        (firstCompleted as IAutoMovieRecoveryMapJointFit).acceptedSteps &&
      (firstCompleted as IAutoMovieRecoveryMapJointFit).regularization!
        .lastUpdate !== null,
  );
  const first: IAutoMovieRecoveryMapJointFit =
    firstCompleted as unknown as IAutoMovieRecoveryMapJointFit;
  const coherent: IAutoMovieRecoveryMapJointFit["feasible"] = first.feasible;
  const paths: unknown[] =
    coherent === undefined
      ? []
      : [
          coherent.trials.baseline,
          coherent.trials.nominal,
          coherent.trials.numerical,
          coherent.trials.corrected,
          coherent.trials.half,
        ];
  const outcomes: unknown[] =
    coherent === undefined
      ? []
      : [
          coherent.trials.qualifiedUnselected,
          coherent.trials.infeasible,
          coherent.trials.nondecreasing,
          coherent.trials.armijo,
        ];
  const total: (values: readonly unknown[]) => number = (
    values: readonly unknown[],
  ): number =>
    values.reduce<number>(
      (sum: number, value: unknown): number =>
        typeof value === "number" && Number.isSafeInteger(value) && value >= 0
          ? sum + value
          : NaN,
      0,
    );
  TestValidator.predicate(
    `completed diagnostics preserve normal and separate nonzero trial marginals: ${diagnostic}`,
    coherent?.normalKktQualified === true &&
      coherent.lastDirection?.certified === true &&
      paths.length === 5 &&
      outcomes.length === 4 &&
      total(paths) === first.iterations &&
      total(outcomes) + first.acceptedSteps === first.iterations,
  );
  TestValidator.predicate(
    `strict closure grows to the independently bounded next population: ${diagnostic}`,
    lastCount === 24 && work.jointFits === 2,
  );
  TestValidator.predicate(
    `later closure capacity cannot return an intermediate accepted proposal: ${diagnostic}`,
    caught instanceof RecoveryFeasibleCapacityError &&
      caught.reason === "direction-entries" &&
      returned === null,
  );
  TestValidator.predicate(
    `the admitted fit retains its consumed original iteration and linear work: ${diagnostic}`,
    work.jointIterationAttempts > 0 &&
      work.jointIterationAttempts <= 100 &&
      work.linearWork > 0,
  );
  TestValidator.predicate(
    "the old checkpoint and source observations survive every private pass",
    before === JSON.stringify({ poses, initial, tracks }),
  );
}
