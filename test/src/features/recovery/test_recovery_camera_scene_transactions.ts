import { TestValidator } from "@nestia/e2e";

import { admitRecoveryCameraScene } from "../../../../packages/recovery/src/internal/admitRecoveryCameraScene";
import { completeRecoverySceneCheckpoint } from "../../../../packages/recovery/src/internal/completeRecoverySceneCheckpoint";
import { createRecoveryCameraScene } from "../../../../packages/recovery/src/internal/createRecoveryCameraScene";
import { linkRecoveryCameraTracks } from "../../../../packages/recovery/src/internal/linkRecoveryCameraTracks";
import type { IAutoMovieRecoveryMapLandmark } from "../../../../packages/recovery/src/structures/image/IAutoMovieRecoveryMapLandmark";
import type { IAutoMovieRecoveryMapPose } from "../../../../packages/recovery/src/structures/image/IAutoMovieRecoveryMapPose";
import type { IAutoMovieRecoverySceneWork } from "../../../../packages/recovery/src/structures/image/IAutoMovieRecoverySceneWork";
import { createRecoverySceneNumericalFixture } from "../internal/createRecoverySceneNumericalFixture";
import { nclose } from "../internal/nclose";

/**
 * Refused extension preserves the complete accepted camera/point checkpoint.
 *
 * Scenarios:
 * 1. The initial seed qualifies but a later fit budget expires after proposed new points; poses, points and observations all retain the old checkpoint while consumed work survives.
 * 2. A perturbed candidate undergoes a one-iteration joint fit without convergence; the detached transaction refuses and cannot mutate its input component.
 * 3. Unregistered views retain distinct necessary support and same-revision refusal states rather than becoming accepted poses.
 * 4. An aggregate proposal ceiling equal to the per-fit minimum admits the full three-view transaction; refinement checkpoints consume no extra proposals.
 * 5. A resident ceiling below the first point design refuses before triangulation or linear work starts.
 *
 * @evidence contracts/testing.md#behavioral-verification Exercises the actual scene budget path and detached completion owner, asserting atomic geometric rollback, attempted-work accounting, null candidate pose and explicit nonconvergence after a numerical step.
 * @evidence contracts/testing.md#independent-expectations Analytic source poses/points define the seed checkpoint independently; a deliberately perturbed pose and strict one-step budget must not be called converged merely because cost descends. Serialized inputs prove ownership, not geometry accuracy.
 * @evidence contracts/testing.md#distinguishing-cases Covers seed success versus extension budget failure, proposed point growth, preserved seed baseline, changed candidate pose, nonconverged joint report, current source statuses and all original arrays. Global conflict and public cancellation have separate entries.
 * @evidence contracts/testing.md#execution-ownership The portable test_recovery_camera_scene_transactions entry uses resident arrays and starts no host, process, installation, compiler, browser or GPU.
 */
export function test_recovery_camera_scene_transactions(): void {
  const fixture: ReturnType<typeof createRecoverySceneNumericalFixture> =
    createRecoverySceneNumericalFixture();
  const charts: ReturnType<typeof admitRecoveryCameraScene> =
    admitRecoveryCameraScene(fixture.input);
  const limited: typeof fixture.input = {
    ...fixture.input,
    budget: { ...fixture.input.budget, maxJointFits: 1 },
  };
  const result: ReturnType<typeof createRecoveryCameraScene> =
    createRecoveryCameraScene(
      limited,
      fixture.features,
      charts,
      fixture.pairs,
      fixture.comparisons,
      (): void => {},
    );
  TestValidator.predicate(
    "extension budget preserves the complete qualified seed",
    result.status === "seed-only" &&
      result.stopReason === "budget-exhausted" &&
      result.registeredViews.join(",") === "0,1" &&
      result.landmarks.length === 24 &&
      result.poses
        .slice(2)
        .every(
          (pose: (typeof result.poses)[number]): boolean => pose === null,
        ) &&
      result.landmarks.every(
        (landmark: (typeof result.landmarks)[number]): boolean =>
          landmark.observations.length === 2,
      ),
  );
  TestValidator.predicate(
    "proposed work does not roll back",
    result.work.jointFits === 1 &&
      result.work.triangulations >= 48 &&
      result.work.cameraAttempts === 1 &&
      result.work.resectionTrials === result.attempts[0]!.resection!.trials &&
      result.attempts[0]!.outcome === "budget-exhausted",
  );
  TestValidator.predicate(
    "current remaining support and refusal are separate",
    result.registration[2]!.status === "refused" &&
      result.registration[2]!.candidates === 24 &&
      result.registration[3]!.status === "insufficient-support",
  );
  TestValidator.predicate(
    "original seed coordinates survive proposal failure",
    result.landmarks.every(
      (landmark: (typeof result.landmarks)[number]): boolean => {
        const observation: (typeof landmark.observations)[number] =
          landmark.observations[0]!;
        const identity: number =
          fixture.identities[observation.viewIndex]![observation.featureIndex]!;
        return landmark.point.every((value: number, axis: number): boolean =>
          nclose(value, fixture.points[identity]![axis]!, 1e-4),
        );
      },
    ),
  );
  const poses: (IAutoMovieRecoveryMapPose | null)[] = fixture.poses.map(
    (
      pose: IAutoMovieRecoveryMapPose,
      at: number,
    ): IAutoMovieRecoveryMapPose | null =>
      at >= 3
        ? null
        : {
            rotation: pose.rotation.slice(),
            translation: [...pose.translation],
          },
  );
  poses[2]!.translation[0] += 0.02;
  const seedLandmarks: IAutoMovieRecoveryMapLandmark[] = result.landmarks.map(
    (
      landmark: (typeof result.landmarks)[number],
    ): IAutoMovieRecoveryMapLandmark => ({
      ...landmark,
      point: [...landmark.point],
      observations: landmark.observations.map(
        (
          observation: (typeof landmark.observations)[number],
        ): typeof observation => ({
          ...observation,
          pixel: [...observation.pixel],
        }),
      ),
    }),
  );
  const before: string = JSON.stringify({ poses, seedLandmarks });
  const work: IAutoMovieRecoverySceneWork = {
    cameraAttempts: 0,
    resectionTrials: 0,
    triangulations: 0,
    triangulationRefusals: 0,
    jointFits: 0,
    jointIterationAttempts: 0,
    linearWork: 0,
  };
  const proposal: ReturnType<typeof completeRecoverySceneCheckpoint> =
    completeRecoverySceneCheckpoint(
      poses,
      seedLandmarks,
      linkRecoveryCameraTracks(
        fixture.features,
        fixture.pairs,
        fixture.input.budget,
      ).tracks,
      charts,
      fixture.input.policy,
      { ...fixture.input.budget, maxRefinementIterations: 1 },
      work,
      (): void => {},
    );
  TestValidator.predicate(
    "a changed but nonconverged proposal is not a checkpoint",
    !proposal.accepted &&
      proposal.reasons.includes("joint-not-converged") &&
      proposal.poses.length === 0 &&
      proposal.landmarks.length === 0 &&
      proposal.joint !== null &&
      !proposal.joint.converged &&
      proposal.joint.iterations === 1,
  );
  TestValidator.predicate(
    "failed numerical transaction owns all changes",
    before === JSON.stringify({ poses, seedLandmarks }) &&
      work.jointFits === 1 &&
      work.jointIterationAttempts === 1,
  );
  const triad: typeof fixture.input = {
    ...fixture.input,
    views: fixture.input.views.slice(0, 3),
    budget: {
      ...fixture.input.budget,
      maxTotalResectionTrials: fixture.input.budget.minimumResectionTrials,
    },
  };
  const exact: ReturnType<typeof createRecoveryCameraScene> =
    createRecoveryCameraScene(
      triad,
      fixture.features.slice(0, 3),
      charts.slice(0, 3),
      fixture.pairs.filter(
        (pair: (typeof fixture.pairs)[number]): boolean => pair.second < 3,
      ),
      fixture.comparisons,
      (): void => {},
    );
  TestValidator.predicate(
    "refinement checkpoints do not exhaust an exact proposal allowance",
    exact.stopReason === "all-registered" &&
      exact.attempts.length === 1 &&
      exact.attempts[0]!.resection!.localRefinements > 0 &&
      exact.attempts[0]!.resection!.finalRefits > 0 &&
      exact.work.resectionTrials === triad.budget.minimumResectionTrials &&
      exact.work.resectionTrials === exact.attempts[0]!.resection!.trials,
  );
  const bounded: ReturnType<typeof createRecoveryCameraScene> =
    createRecoveryCameraScene(
      { ...triad, budget: { ...triad.budget, maxResidentLinearEntries: 1 } },
      fixture.features.slice(0, 3),
      charts.slice(0, 3),
      fixture.pairs.filter(
        (pair: (typeof fixture.pairs)[number]): boolean => pair.second < 3,
      ),
      fixture.comparisons,
      (): void => {},
    );
  TestValidator.predicate(
    "resident refusal precedes every point design and factorization",
    bounded.stopReason === "budget-exhausted" &&
      bounded.landmarks.length === 0 &&
      bounded.work.triangulations === 0 &&
      bounded.work.linearWork === 0 &&
      bounded.work.jointFits === 0,
  );
}
