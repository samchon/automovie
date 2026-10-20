import type { IAutoMovieRecoveryCameraSceneInput } from "@automovie/interface/recovery";

import type { IAutoMovieRecoveryCameraSceneEstimate } from "../structures/image/IAutoMovieRecoveryCameraSceneEstimate";
import type { IAutoMovieRecoveryMapPose } from "../structures/image/IAutoMovieRecoveryMapPose";
import type { IAutoMovieRecoverySceneAttempt } from "../structures/image/IAutoMovieRecoverySceneAttempt";
import type { IAutoMovieRecoverySceneCandidate } from "../structures/internal/IAutoMovieRecoverySceneCandidate";
import type { IAutoMovieRecoverySceneQueue } from "../structures/internal/IAutoMovieRecoverySceneQueue";
import { collectRecoverySceneSupport } from "./collectRecoverySceneSupport";
import { assertRecoverySceneLinearRetention } from "./assertRecoverySceneLinearRetention";
import { completeRecoverySceneCheckpoint } from "./completeRecoverySceneCheckpoint";
import type { createRecoveryCameraChart } from "./createRecoveryCameraChart";
import { describeRecoverySceneRegistration } from "./describeRecoverySceneRegistration";
import type { extractRecoveryImageFeatures } from "./extractRecoveryImageFeatures";
import { fitRecoveryResectionConsensus } from "./fitRecoveryResectionConsensus";
import { initializeRecoverySceneSeed } from "./initializeRecoverySceneSeed";
import { linkRecoveryCameraTracks } from "./linkRecoveryCameraTracks";
import { spendRecoverySceneWork } from "./spendRecoverySceneWork";

/**
 * Register a bounded calibrated image set into one qualified sparse component.
 * Global conflicting tracks are withheld before even seed geometry. Each new
 * camera uses only existing points, then proposes registered-view point growth
 * and common-gauge joint refinement. Only a complete transaction is committed.
 *
 * @evidence contracts/common.md#principled-implementation Fixed global bidirectional tracks precede seed consensus, original registered-ray triangulation, distinct existing-map resection and complete original-rank/joint/final geometry checks. The seed component is reconstructed and jointly requalified rather than deleting points from a previous map.
 * @evidence contracts/common.md#clear-and-simple-design The coordinator owns stable candidate ordering, revisions, proposal rollback and termination; geometry, work charging and publication have separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No truth pose, camera-order prior, repeated unchanged-revision attempt, self-generated PnP landmark, partial transaction commit or hidden surface completion supplies success. Callback, cancellation and unexpected exceptions propagate.
 * @evidence contracts/common.md#meaningful-documentation States global identity policy, seed requalification, independent registration before point growth, complete rollback, partial coverage and preserved consumed-work ledger.
 * @evidence contracts/performance.md#efficient-algorithms One bounded global linking pass precedes at most A admitted camera attempts. Each revision collects O(E+L+V) support once and sorts O(V log V); resection, triangulation and variable-width joint work retain separate aggregate ceilings. Failed transactions consume their actual work.
 * @evidence contracts/performance.md#reuse-equivalent-work Frozen features, charts, matches and global components serve every revision. Only accepted geometry changes candidate support; no observation or descriptor comparison is repeated.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Accepted JSON and bounded attempt ledgers transfer to the caller; proposed geometry/factors expire after failure. RGB, descriptors, callbacks and transient factors do not enter the result or any global cache.
 */
export function createRecoveryCameraScene(
  input: IAutoMovieRecoveryCameraSceneInput,
  features: readonly ReturnType<typeof extractRecoveryImageFeatures>[],
  charts: readonly ReturnType<typeof createRecoveryCameraChart>[],
  pairs: Parameters<typeof linkRecoveryCameraTracks>[1],
  descriptorComparisons: number,
  checkpoint: (phase: string, completed: number, total: number) => void,
): IAutoMovieRecoveryCameraSceneEstimate {
  const linked: ReturnType<typeof linkRecoveryCameraTracks> =
    linkRecoveryCameraTracks(features, pairs, input.budget);
  const trackById: Map<number, (typeof linked.tracks)[number]> = new Map(
    linked.tracks.map(
      (
        track: (typeof linked.tracks)[number],
      ): [number, (typeof linked.tracks)[number]] => [track.id, track],
    ),
  );
  const seed: ReturnType<typeof initializeRecoverySceneSeed> =
    initializeRecoverySceneSeed(
      input,
      features,
      charts,
      pairs,
      linked.tracks,
      checkpoint,
    );
  const result: IAutoMovieRecoveryCameraSceneEstimate = {
    schema: "automovie-recovery-camera-scene-estimate-v1",
    objectId: input.objectId,
    cohort: input.cohort,
    status: "refused",
    stopReason: "seed-refused",
    refusalReasons: [],
    sources: input.views.map(
      (
        view: (typeof input.views)[number],
      ): IAutoMovieRecoveryCameraSceneEstimate["sources"][number] => ({
        id: view.id,
        sourceSha256: view.sourceSha256,
        pixelProvenance: view.pixelProvenance,
        width: view.width,
        height: view.height,
        camera: {
          ...view.camera,
          focalPx: [...view.camera.focalPx],
          principalPointPx: [...view.camera.principalPointPx],
        },
      }),
    ),
    seed,
    policy: { ...input.policy },
    budget: { ...input.budget },
    gauge: "first-camera-unit-seed-baseline",
    metricScale: "unknown",
    poses: input.views.map((): null => null),
    registeredViews: [],
    unregisteredViews: input.views.map((_: unknown, at: number): number => at),
    registration: [],
    revision: 0,
    landmarks: [],
    featureCounts: features.map(
      (feature: (typeof features)[number]): number => feature.points.length,
    ),
    descriptorComparisons,
    intersectionMatches: linked.intersectionMatches,
    linkedTracks: linked.components,
    conflictingTracks: linked.conflictingComponents,
    untriangulatedTracks: linked.tracks.length,
    attempts: [],
    work: {
      cameraAttempts: 0,
      resectionTrials: 0,
      triangulations: 0,
      triangulationRefusals: 0,
      jointFits: 0,
      jointIterationAttempts: 0,
      linearWork: 0,
    },
    joint: null,
    maximumReprojectionErrorPx: null,
    minimumPointParallaxDegrees: null,
  };
  const numerical: (error: unknown) => boolean = (error: unknown): boolean =>
    error instanceof Error &&
    error.name === "Error" &&
    /^(camera-map:|singular-matrix:|matrix3:|qr-design:)/.test(error.message);
  const budgetError: (error: unknown) => boolean = (error: unknown): boolean =>
    error instanceof Error && error.name === "RecoverySceneBudget";
  let support: IAutoMovieRecoverySceneCandidate[][] =
    collectRecoverySceneSupport(
      result.landmarks,
      trackById,
      input.views.length,
    );
  const finish: () => IAutoMovieRecoveryCameraSceneEstimate =
    (): IAutoMovieRecoveryCameraSceneEstimate => {
      result.registration = describeRecoverySceneRegistration(result, support);
      return result;
    };
  const commit: (
    proposal: ReturnType<typeof completeRecoverySceneCheckpoint>,
  ) => void = (
    proposal: ReturnType<typeof completeRecoverySceneCheckpoint>,
  ): void => {
    result.poses = proposal.poses;
    result.landmarks = proposal.landmarks;
    result.joint = proposal.joint;
    result.maximumReprojectionErrorPx = proposal.maximumReprojectionErrorPx;
    result.minimumPointParallaxDegrees = proposal.minimumPointParallaxDegrees;
    result.registeredViews = result.poses.flatMap(
      (pose: IAutoMovieRecoveryMapPose | null, at: number): number[] =>
        pose === null ? [] : [at],
    );
    result.unregisteredViews = result.poses.flatMap(
      (pose: IAutoMovieRecoveryMapPose | null, at: number): number[] =>
        pose === null ? [at] : [],
    );
    result.untriangulatedTracks =
      linked.tracks.length - result.landmarks.length;
    result.status =
      result.registeredViews.length > 2
        ? "accepted-sparse-component"
        : "seed-only";
    support = collectRecoverySceneSupport(
      result.landmarks,
      trackById,
      input.views.length,
    );
  };
  if (seed.pose === null) {
    result.refusalReasons.push("seed-pair-refused");
    return finish();
  }
  const initialPoses: (IAutoMovieRecoveryMapPose | null)[] = input.views.map(
    (): null => null,
  );
  initialPoses[0] = {
    rotation: [1, 0, 0, 0, 1, 0, 0, 0, 1],
    translation: [0, 0, 0],
  };
  initialPoses[1] = {
    rotation: seed.pose.rotation.slice(),
    translation: [...seed.pose.translation],
  };
  try {
    const initial: ReturnType<typeof completeRecoverySceneCheckpoint> =
      completeRecoverySceneCheckpoint(
        initialPoses,
        [],
        linked.tracks,
        charts,
        input.policy,
        input.budget,
        result.work,
        (): void => checkpoint("scene-seed-component", 0, 1),
      );
    if (!initial.accepted) {
      result.refusalReasons.push(...initial.reasons);
      return finish();
    }
    commit(initial);
  } catch (error: unknown) {
    if (!numerical(error) && !budgetError(error)) throw error;
    result.stopReason = budgetError(error)
      ? "budget-exhausted"
      : "seed-refused";
    result.refusalReasons.push(
      error instanceof Error ? error.message : String(error),
    );
    return finish();
  }
  let exhausted: boolean = false;
  while (result.unregisteredViews.length > 0 && !exhausted) {
    const queue: IAutoMovieRecoverySceneQueue[] = result.unregisteredViews
      .map(
        (view: number): IAutoMovieRecoverySceneQueue => ({
          view,
          candidates: support[view]!,
        }),
      )
      .filter(
        (item: IAutoMovieRecoverySceneQueue): boolean =>
          item.candidates.length >= input.policy.minimumResectionInliers,
      )
      .sort(
        (
          a: IAutoMovieRecoverySceneQueue,
          b: IAutoMovieRecoverySceneQueue,
        ): number =>
          b.candidates.length - a.candidates.length ||
          (input.views[a.view]!.id < input.views[b.view]!.id
            ? -1
            : input.views[a.view]!.id > input.views[b.view]!.id
              ? 1
              : 0),
      );
    let grew: boolean = false;
    for (const item of queue) {
      checkpoint(
        "scene-camera-attempt",
        result.registeredViews.length,
        input.views.length,
      );
      const attempt: IAutoMovieRecoverySceneAttempt = {
        viewIndex: item.view,
        revision: result.revision,
        candidates: item.candidates.length,
        outcome: "resection-refused",
        reasons: [],
        resection: null,
        joint: null,
        proposedLandmarks: null,
        proposedObservations: null,
      };
      try {
        spendRecoverySceneWork(result.work, input.budget, "cameraAttempts", 1);
        result.attempts.push(attempt);
        // Normalized twelve-column DLT, its factors and six-coordinate
        // resection scratch are bounded before candidate coordinate arrays.
        assertRecoverySceneLinearRetention(
          input.budget,
          result.registeredViews.length,
          result.landmarks.reduce(
            (sum: number, landmark: (typeof result.landmarks)[number]): number =>
              sum + landmark.observations.length,
            0,
          ),
          result.landmarks.length,
          128 * item.candidates.length + 2048,
        );
        const resection: ReturnType<typeof fitRecoveryResectionConsensus> =
          fitRecoveryResectionConsensus(
            item.candidates.map(
              (
                candidate: (typeof item.candidates)[number],
              ): [number, number, number] =>
                result.landmarks[candidate.landmark]!.point,
            ),
            item.candidates.map(
              (candidate: (typeof item.candidates)[number]): [number, number] =>
                candidate.observation.pixel,
            ),
            charts[item.view]!.matrix,
            charts[item.view]!.inverse,
            input.policy,
            input.budget,
            (): void =>
              checkpoint(
                "scene-resection",
                result.work.resectionTrials,
                input.budget.maxTotalResectionTrials,
              ),
            (): void => {
              spendRecoverySceneWork(
                result.work,
                input.budget,
                "resectionTrials",
                1,
              );
            },
          );
        attempt.resection = {
          candidates: item.candidates.length,
          inliers: resection.indices.length,
          trials: resection.trials,
          requiredTrials: resection.requiredTrials,
          localRefinements: resection.localRefinements,
          numericalRefusals: resection.numericalRefusals,
          finalRefits: resection.finalRefits,
          stable: resection.stable,
          converged: resection.refinement?.converged ?? null,
          refusalReasons: resection.refusalReasons.slice(),
        };
        if (resection.pose === null) {
          attempt.reasons = resection.refusalReasons.slice();
          continue;
        }
        const proposedPoses: (IAutoMovieRecoveryMapPose | null)[] =
          result.poses.slice();
        proposedPoses[item.view] = resection.pose;
        attempt.outcome = "joint-refused";
        const proposal: ReturnType<typeof completeRecoverySceneCheckpoint> =
          completeRecoverySceneCheckpoint(
            proposedPoses,
            result.landmarks,
            linked.tracks,
            charts,
            input.policy,
            input.budget,
            result.work,
            (): void =>
              checkpoint(
                "scene-joint-component",
                result.registeredViews.length,
                input.views.length,
              ),
            (
              points: number,
              observations: number,
              report: IAutoMovieRecoverySceneAttempt["joint"],
            ): void => {
              attempt.proposedLandmarks = points;
              attempt.proposedObservations = observations;
              attempt.joint = report;
            },
          );
        attempt.joint = proposal.joint;
        attempt.proposedLandmarks = proposal.proposedLandmarks;
        attempt.proposedObservations = proposal.proposedObservations;
        if (!proposal.accepted) {
          attempt.reasons = proposal.reasons;
          continue;
        }
        commit(proposal);
        result.revision++;
        attempt.outcome = "accepted";
        grew = true;
        break;
      } catch (error: unknown) {
        if (!numerical(error) && !budgetError(error)) throw error;
        attempt.reasons.push(
          error instanceof Error ? error.message : String(error),
        );
        if (budgetError(error)) {
          attempt.outcome = "budget-exhausted";
          exhausted = true;
          result.refusalReasons.push(...attempt.reasons);
          break;
        }
      }
    }
    if (!grew) break;
  }
  result.stopReason =
    result.unregisteredViews.length === 0
      ? "all-registered"
      : exhausted
        ? "budget-exhausted"
        : "no-qualified-growth";
  if (result.stopReason === "no-qualified-growth")
    result.refusalReasons.push("no-further-qualified-camera-transaction");
  return finish();
}
