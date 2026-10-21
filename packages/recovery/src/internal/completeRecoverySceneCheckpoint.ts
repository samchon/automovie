import type {
  IAutoMovieRecoveryCameraMapPolicy,
  IAutoMovieRecoveryCameraSceneBudget,
} from "@automovie/interface/recovery";

import type { IAutoMovieRecoveryMapJointFit } from "../structures/image/IAutoMovieRecoveryMapJointFit";
import type { IAutoMovieRecoveryMapLandmark } from "../structures/image/IAutoMovieRecoveryMapLandmark";
import type { IAutoMovieRecoveryMapObservation } from "../structures/image/IAutoMovieRecoveryMapObservation";
import type { IAutoMovieRecoveryMapPose } from "../structures/image/IAutoMovieRecoveryMapPose";
import type { IAutoMovieRecoverySceneLandmark } from "../structures/image/IAutoMovieRecoverySceneLandmark";
import type { IAutoMovieRecoverySceneWork } from "../structures/image/IAutoMovieRecoverySceneWork";
import type { IAutoMovieRecoveryFeasibleJointOptions } from "../structures/internal/IAutoMovieRecoveryFeasibleJointOptions";
import type { IAutoMovieRecoverySceneCheckpoint } from "../structures/internal/IAutoMovieRecoverySceneCheckpoint";
import type { IAutoMovieRecoverySceneCheckpointTrace } from "../structures/internal/IAutoMovieRecoverySceneCheckpointTrace";
import { assertRecoverySceneLinearRetention } from "./assertRecoverySceneLinearRetention";
import type { createRecoveryCameraChart } from "./createRecoveryCameraChart";
import { evaluateRecoveryScenePoint } from "./evaluateRecoveryScenePoint";
import { growRecoverySceneLandmarks } from "./growRecoverySceneLandmarks";
import type { linkRecoveryCameraTracks } from "./linkRecoveryCameraTracks";
import { refineRecoveryCameraMap } from "./refineRecoveryCameraMap";
import { spendRecoverySceneWork } from "./spendRecoverySceneWork";

/**
 * Complete a detached scene transaction through growth and full joint geometry.
 * After each fit, newly admissible points/measurements cause another fit. Only
 * strict finite population growth repeats; every fit and linear action is
 * charged. Failure leaves committing or retaining the old checkpoint to caller.
 * An optional observer receives owned complete compact states before and after
 * each joint fit. Observer errors propagate, and ordinary calls retain no trace.
 *
 * @evidence contracts/common.md#principled-implementation Compact active source indices preserve first-pose and single-baseline gauge while admitting landmarks unseen in the seed. Original undamped ranks, common-population descent, all retained point gates and gauge checks independently qualify each transaction; closure adds no observation without another joint fit.
 * @evidence contracts/common.md#clear-and-simple-design This transaction owner groups proposed poses, points, measurement completion, refinement and final qualification; immutable global tracks and accepted checkpoint ownership remain with the scene coordinator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No point-only deletion is called requalification, no failed fit commits a subset, no zero-weight/damping rank supplies observability, and a changed-population cost is not reported as descent of one objective.
 * @evidence contracts/common.md#meaningful-documentation States compact versus global indices, strict growth closure, last-pass diagnostics, logical retention and rollback. Optional accepted-agreement coefficients and lagged multiplier seeds restart per joint fit, so compacted row/population/gauge identities never inherit a previous fit's seed. LastJoint and trace retain only that fit's plain reports, without combining different-population costs.
 * @evidence contracts/performance.md#efficient-algorithms For E observations, L landmarks and C active camera coordinates, QR/SVD costs O(I*(E*C^2+S*C^3)). Feasible selection adds rows, sparse passes and complete gates. Optional working factors, accepted agreement and lagged local geometry/Schur/Cholesky/whitening each keep their separately prepaid owner costs. Every closure pass invokes a new existing joint fit under original cumulative fit/work/actual-trial ceilings; no curvature attempt is a free geometry pass or a new actual trial.
 * @evidence contracts/performance.md#reuse-equivalent-work Accepted global observations and current numerical estimates seed each fit. No pixel/feature/matching acquisition is repeated; only a changed proposed population requires another joint objective.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a detached qualified proposal or explicit failed diagnostics returns. Internal feasible selection admits four candidates/current/checkpoint/factors, adaptive design and any requested lagged F/S/A envelope before allocating. Its owned seeds expire per fit rather than crossing changed-population closure passes. Observers own O(V+L+E) clones per event/history; absent observers allocate none. Unaccepted factors/candidates/proposals expire, consumed work remains, and no image or external handle is retained.
 */
export function completeRecoverySceneCheckpoint(
  initialPoses: readonly (IAutoMovieRecoveryMapPose | null)[],
  initialLandmarks: readonly IAutoMovieRecoveryMapLandmark[],
  tracks: ReturnType<typeof linkRecoveryCameraTracks>["tracks"],
  charts: readonly ReturnType<typeof createRecoveryCameraChart>[],
  policy: IAutoMovieRecoveryCameraMapPolicy,
  budget: IAutoMovieRecoveryCameraSceneBudget,
  work: IAutoMovieRecoverySceneWork,
  checkpoint: () => void,
  onProposal: (
    points: number,
    observations: number,
    report: IAutoMovieRecoveryMapJointFit | null,
  ) => void = (): void => {},
  onTrace?: (trace: IAutoMovieRecoverySceneCheckpointTrace) => void,
  feasible?: IAutoMovieRecoveryFeasibleJointOptions,
): IAutoMovieRecoverySceneCheckpoint {
  let poses: (IAutoMovieRecoveryMapPose | null)[] = initialPoses.map(
    (
      pose: IAutoMovieRecoveryMapPose | null,
    ): IAutoMovieRecoveryMapPose | null =>
      pose === null
        ? null
        : {
            rotation: pose.rotation.slice(),
            translation: [...pose.translation],
          },
  );
  const active: number[] = poses.flatMap(
    (pose: IAutoMovieRecoveryMapPose | null, at: number): number[] =>
      pose === null ? [] : [at],
  );
  const indices: Map<number, number> = new Map(
    active.map((view: number, at: number): [number, number] => [view, at]),
  );
  if (active[0] !== 0 || active[1] !== 1)
    throw new Error("camera-scene: explicit seed must anchor active component");
  let proposal: ReturnType<typeof growRecoverySceneLandmarks> =
    growRecoverySceneLandmarks(
      tracks,
      initialLandmarks,
      poses,
      charts,
      policy,
      budget,
      work,
      checkpoint,
    );
  let lastJoint: IAutoMovieRecoveryMapJointFit | null = null;
  let pass: number = 0;
  while (true) {
    checkpoint();
    const count: number = proposal.landmarks.reduce(
      (sum: number, landmark: IAutoMovieRecoveryMapLandmark): number =>
        sum + landmark.observations.length,
      0,
    );
    onProposal(proposal.landmarks.length, count, lastJoint);
    assertRecoverySceneLinearRetention(
      budget,
      active.length,
      count,
      proposal.landmarks.length,
    );
    spendRecoverySceneWork(work, budget, "jointFits", 1);
    const compact: IAutoMovieRecoveryMapLandmark[] = proposal.landmarks.map(
      (
        landmark: IAutoMovieRecoveryMapLandmark,
      ): IAutoMovieRecoveryMapLandmark => ({
        id: landmark.id,
        point: [...landmark.point],
        observations: landmark.observations.map(
          (
            observation: IAutoMovieRecoveryMapObservation,
          ): IAutoMovieRecoveryMapObservation => ({
            ...observation,
            pixel: [...observation.pixel],
            viewIndex: indices.get(observation.viewIndex)!,
          }),
        ),
      }),
    );
    onTrace?.(
      structuredClone({
        phase: "before-joint",
        pass,
        activeViews: active,
        poses: active.map(
          (view: number): IAutoMovieRecoveryMapPose => poses[view]!,
        ),
        landmarks: compact,
        joint: null,
      }),
    );
    const refined: ReturnType<typeof refineRecoveryCameraMap> =
      refineRecoveryCameraMap(
        active.map((view: number): IAutoMovieRecoveryMapPose => poses[view]!),
        compact,
        active.map((view: number): number[] => charts[view]!.matrix),
        policy,
        budget,
        (): void => {
          spendRecoverySceneWork(work, budget, "jointIterationAttempts", 1);
          checkpoint();
        },
        (amount: number): void =>
          spendRecoverySceneWork(work, budget, "linearWork", amount),
        feasible,
      );
    lastJoint = refined.report;
    onTrace?.(
      structuredClone({
        phase: "after-joint",
        pass,
        activeViews: active,
        poses: refined.poses,
        landmarks: refined.landmarks,
        joint: lastJoint,
      }),
    );
    onProposal(proposal.landmarks.length, count, lastJoint);
    const nextPoses: (IAutoMovieRecoveryMapPose | null)[] = poses.map(
      (): null => null,
    );
    active.forEach((view: number, at: number): void => {
      nextPoses[view] = refined.poses[at]!;
    });
    const reasons: Set<string> = new Set();
    if (!lastJoint.converged) reasons.add("joint-not-converged");
    if (Math.abs(Math.hypot(...nextPoses[1]!.translation) - 1) > 1e-10)
      reasons.add("seed-gauge-drift");
    let maximumReprojectionErrorPx: number = 0,
      minimumPointParallaxDegrees: number = Infinity;
    const landmarks: IAutoMovieRecoverySceneLandmark[] = [];
    for (const landmark of refined.landmarks) {
      const observations: IAutoMovieRecoveryMapObservation[] =
        landmark.observations.map(
          (
            observation: IAutoMovieRecoveryMapObservation,
          ): IAutoMovieRecoveryMapObservation => ({
            ...observation,
            pixel: [...observation.pixel],
            viewIndex: active[observation.viewIndex]!,
          }),
        );
      const measured: ReturnType<typeof evaluateRecoveryScenePoint> =
        evaluateRecoveryScenePoint(
          landmark.point,
          observations,
          nextPoses,
          charts,
          policy,
        );
      measured.reasons.forEach((reason: string): void => {
        reasons.add(reason);
      });
      if (
        !measured.accepted ||
        measured.supportingViews === null ||
        measured.acuteParallaxDegrees === null ||
        measured.maximumReprojectionPx === null
      )
        continue;
      maximumReprojectionErrorPx = Math.max(
        maximumReprojectionErrorPx,
        measured.maximumReprojectionPx,
      );
      minimumPointParallaxDegrees = Math.min(
        minimumPointParallaxDegrees,
        measured.acuteParallaxDegrees,
      );
      landmarks.push({
        id: landmark.id,
        point: [...landmark.point],
        observations,
        supportingViews: measured.supportingViews,
        acuteParallaxDegrees: measured.acuteParallaxDegrees,
      });
    }
    if (landmarks.length !== refined.landmarks.length)
      reasons.add("final-point-qualification");
    if (reasons.size > 0)
      return {
        accepted: false,
        reasons: [...reasons],
        poses: [],
        landmarks: [],
        joint: lastJoint,
        proposedLandmarks: proposal.landmarks.length,
        proposedObservations: count,
        maximumReprojectionErrorPx: null,
        minimumPointParallaxDegrees: null,
      };
    const completed: ReturnType<typeof growRecoverySceneLandmarks> =
      growRecoverySceneLandmarks(
        tracks,
        landmarks,
        nextPoses,
        charts,
        policy,
        budget,
        work,
        checkpoint,
      );
    if (completed.addedLandmarks === 0 && completed.addedObservations === 0)
      return {
        accepted: true,
        reasons: [],
        poses: nextPoses,
        landmarks,
        joint: lastJoint,
        proposedLandmarks: landmarks.length,
        proposedObservations: count,
        maximumReprojectionErrorPx,
        minimumPointParallaxDegrees,
      };
    poses = nextPoses;
    proposal = completed;
    pass++;
  }
}
