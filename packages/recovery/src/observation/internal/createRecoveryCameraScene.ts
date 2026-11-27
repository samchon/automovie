import type {
  IAutoMovieRecoveryCameraSceneCreationOperation,
  IAutoMovieRecoveryCameraSceneEstimate,
  IAutoMovieRecoveryCameraTracksLinkageOperation,
  IAutoMovieRecoveryMapPose,
  IAutoMovieRecoveryResectionConsensusFittingOperation,
  IAutoMovieRecoverySceneAttempt,
  IAutoMovieRecoverySceneCandidate,
  IAutoMovieRecoverySceneCheckpointCompletionOperation,
  IAutoMovieRecoverySceneFeasibleRouting,
  IAutoMovieRecoverySceneQueue,
  IAutoMovieRecoverySceneSeedInitializationOperation,
  IAutoMovieRecoverySceneWork,
} from "@automovie/interface";

import { RecoveryFeasibleCapacityError } from "../../internal/RecoveryFeasibleCapacityError";
import { assertRecoverySceneLinearRetention } from "./assertRecoverySceneLinearRetention";
import { collectRecoverySceneSupport } from "./collectRecoverySceneSupport";
import { completeRecoverySceneCheckpoint } from "./completeRecoverySceneCheckpoint";
import { createRecoverySceneSeedReportObserver } from "./createRecoverySceneSeedReportObserver";
import { describeRecoverySceneRegistration } from "./describeRecoverySceneRegistration";
import { fitRecoveryResectionConsensus } from "../../geometry/internal/fitRecoveryResectionConsensus";
import { initializeRecoverySceneSeed } from "./initializeRecoverySceneSeed";
import { linkRecoveryCameraTracks } from "./linkRecoveryCameraTracks";
import { prepareRecoverySceneFeasibleRouting } from "./prepareRecoverySceneFeasibleRouting";
import { prepareRecoverySceneReportCapacity } from "./prepareRecoverySceneReportCapacity";
import { spendRecoverySceneWork } from "./spendRecoverySceneWork";

/**
 * Register a bounded calibrated image set into one qualified sparse component.
 * Global conflicting tracks are withheld before even seed geometry. Each new
 * camera uses only existing points, then proposes registered-view point growth
 * and common-gauge joint refinement. Only a complete transaction is committed.
 * Explicit internal feasible options are copied before callbacks and reach both
 * seed and candidate closure fits; public callers continue omitting them. A
 * refused seed retains its last completed fit report separately from the
 * accepted-only joint report, without retaining failed geometry.
 */
export function createRecoveryCameraScene(
  input: Parameters<IAutoMovieRecoveryCameraSceneCreationOperation.Operation>[0],
  features: Parameters<IAutoMovieRecoveryCameraSceneCreationOperation.Operation>[1],
  charts: Parameters<IAutoMovieRecoveryCameraSceneCreationOperation.Operation>[2],
  pairs: Parameters<IAutoMovieRecoveryCameraSceneCreationOperation.Operation>[3],
  descriptorComparisons: Parameters<IAutoMovieRecoveryCameraSceneCreationOperation.Operation>[4],
  checkpoint: Parameters<IAutoMovieRecoveryCameraSceneCreationOperation.Operation>[5],
  feasible?: Parameters<IAutoMovieRecoveryCameraSceneCreationOperation.Operation>[6],
): ReturnType<IAutoMovieRecoveryCameraSceneCreationOperation.Operation> {
  // An absent request keeps the original post-seed ledger allocation. An
  // explicit request owns the same single ledger before its setup charge.
  const routingWork: IAutoMovieRecoverySceneWork | null =
    feasible === undefined
      ? null
      : {
          cameraAttempts: 0,
          resectionTrials: 0,
          triangulations: 0,
          triangulationRefusals: 0,
          jointFits: 0,
          jointIterationAttempts: 0,
          linearWork: 0,
        };
  const routing: IAutoMovieRecoverySceneFeasibleRouting | null =
    routingWork === null
      ? null
      : prepareRecoverySceneFeasibleRouting(
          input.budget,
          feasible!,
          routingWork,
        );
  let callbackFailed: boolean = false;
  const notify: typeof checkpoint =
    routing === null
      ? checkpoint
      : (phase: string, completed: number, total: number): void => {
          spendRecoverySceneWork(
            routingWork!,
            routing.execution,
            "linearWork",
            32,
          );
          try {
            checkpoint(phase, completed, total);
          } catch (error: unknown) {
            callbackFailed = true;
            throw error;
          }
        };
  const linked: ReturnType<IAutoMovieRecoveryCameraTracksLinkageOperation.Operation> =
    linkRecoveryCameraTracks(
      features,
      pairs,
      routing?.execution ?? input.budget,
    );
  const trackById: Map<number, (typeof linked.tracks)[number]> = new Map(
    linked.tracks.map(
      (
        track: (typeof linked.tracks)[number],
      ): [number, (typeof linked.tracks)[number]] => [track.id, track],
    ),
  );
  const seed: ReturnType<IAutoMovieRecoverySceneSeedInitializationOperation.Operation> =
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
    budget: routing?.declared ?? { ...input.budget },
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
    work: routingWork ?? {
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
    proposal: ReturnType<IAutoMovieRecoverySceneCheckpointCompletionOperation.Operation>,
  ) => void = (
    proposal: ReturnType<IAutoMovieRecoverySceneCheckpointCompletionOperation.Operation>,
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
    if (routing !== null)
      prepareRecoverySceneReportCapacity(routing, result.work);
    const initial: ReturnType<IAutoMovieRecoverySceneCheckpointCompletionOperation.Operation> =
      completeRecoverySceneCheckpoint(
        initialPoses,
        [],
        linked.tracks,
        charts,
        input.policy,
        routing?.execution ?? input.budget,
        result.work,
        (): void => notify("scene-seed-component", 0, 1),
        createRecoverySceneSeedReportObserver(
          result,
          result.work,
          routing?.execution ?? input.budget,
        ),
        undefined,
        routing?.feasible,
        routing?.reporting,
      );
    if (!initial.accepted) {
      result.refusalReasons.push(...initial.reasons);
      return finish();
    }
    delete result.refusedSeedJoint;
    commit(initial);
  } catch (error: unknown) {
    if (callbackFailed) throw error;
    if (
      !numerical(error) &&
      !budgetError(error) &&
      !(error instanceof RecoveryFeasibleCapacityError)
    )
      throw error;
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
        spendRecoverySceneWork(
          result.work,
          routing?.execution ?? input.budget,
          "cameraAttempts",
          1,
        );
        result.attempts.push(attempt);
        // Normalized twelve-column DLT, its factors and six-coordinate
        // resection scratch are bounded before candidate coordinate arrays.
        assertRecoverySceneLinearRetention(
          routing?.execution ?? input.budget,
          result.registeredViews.length,
          result.landmarks.reduce(
            (
              sum: number,
              landmark: (typeof result.landmarks)[number],
            ): number => sum + landmark.observations.length,
            0,
          ),
          result.landmarks.length,
          128 * item.candidates.length + 2048,
        );
        const resection: ReturnType<IAutoMovieRecoveryResectionConsensusFittingOperation.Operation> =
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
            routing?.execution ?? input.budget,
            (): void =>
              notify(
                "scene-resection",
                result.work.resectionTrials,
                (routing?.execution ?? input.budget).maxTotalResectionTrials,
              ),
            (): void => {
              spendRecoverySceneWork(
                result.work,
                routing?.execution ?? input.budget,
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
        const proposal: ReturnType<IAutoMovieRecoverySceneCheckpointCompletionOperation.Operation> =
          completeRecoverySceneCheckpoint(
            proposedPoses,
            result.landmarks,
            linked.tracks,
            charts,
            input.policy,
            routing?.execution ?? input.budget,
            result.work,
            (): void =>
              notify(
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
            undefined,
            routing?.feasible,
            routing?.reporting,
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
        if (callbackFailed) throw error;
        if (
          !numerical(error) &&
          !budgetError(error) &&
          !(error instanceof RecoveryFeasibleCapacityError)
        )
          throw error;
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
