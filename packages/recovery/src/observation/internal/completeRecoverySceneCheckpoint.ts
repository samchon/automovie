import type {
  IAutoMovieRecoveryCameraMapRefinementOperation,
  IAutoMovieRecoveryCameraSceneBudget,
  IAutoMovieRecoveryCheckpointReporting,
  IAutoMovieRecoveryFeasibleJointOptions,
  IAutoMovieRecoveryFeasibleReportCapacity,
  IAutoMovieRecoveryMapJointFit,
  IAutoMovieRecoveryMapLandmark,
  IAutoMovieRecoveryMapObservation,
  IAutoMovieRecoveryMapPose,
  IAutoMovieRecoverySceneCheckpointCompletionOperation,
  IAutoMovieRecoverySceneLandmark,
  IAutoMovieRecoverySceneLandmarksGrowthOperation,
  IAutoMovieRecoveryScenePointEvaluationOperation,
} from "@automovie/interface";

import { assertRecoverySceneLinearRetention } from "./assertRecoverySceneLinearRetention";
import { evaluateRecoveryScenePoint } from "./evaluateRecoveryScenePoint";
import { growRecoverySceneLandmarks } from "./growRecoverySceneLandmarks";
import { prepareRecoveryCheckpointReportCapacity } from "./prepareRecoveryCheckpointReportCapacity";
import { refineRecoveryCameraMap } from "./refineRecoveryCameraMap";
import { spendRecoverySceneWork } from "./spendRecoverySceneWork";

/**
 * Complete a detached scene transaction through growth and full joint geometry.
 * After each fit, newly admissible points/measurements cause another fit. Only
 * strict finite population growth repeats; every fit and linear action is
 * charged. Failure leaves committing or retaining the old checkpoint to caller.
 * An optional observer receives owned complete compact states before and after
 * each joint fit. Observer errors propagate, and ordinary calls retain no
 * trace.
 */
export function completeRecoverySceneCheckpoint(
  initialPoses: Parameters<IAutoMovieRecoverySceneCheckpointCompletionOperation.Operation>[0],
  initialLandmarks: Parameters<IAutoMovieRecoverySceneCheckpointCompletionOperation.Operation>[1],
  tracks: Parameters<IAutoMovieRecoverySceneCheckpointCompletionOperation.Operation>[2],
  charts: Parameters<IAutoMovieRecoverySceneCheckpointCompletionOperation.Operation>[3],
  policy: Parameters<IAutoMovieRecoverySceneCheckpointCompletionOperation.Operation>[4],
  budget: Parameters<IAutoMovieRecoverySceneCheckpointCompletionOperation.Operation>[5],
  work: Parameters<IAutoMovieRecoverySceneCheckpointCompletionOperation.Operation>[6],
  checkpoint: Parameters<IAutoMovieRecoverySceneCheckpointCompletionOperation.Operation>[7],
  onProposal: Parameters<IAutoMovieRecoverySceneCheckpointCompletionOperation.Operation>[8] = (): void => {},
  onTrace?: Parameters<IAutoMovieRecoverySceneCheckpointCompletionOperation.Operation>[9],
  feasible?: Parameters<IAutoMovieRecoverySceneCheckpointCompletionOperation.Operation>[10],
  reportCapacity?: Parameters<IAutoMovieRecoverySceneCheckpointCompletionOperation.Operation>[11],
): ReturnType<IAutoMovieRecoverySceneCheckpointCompletionOperation.Operation> {
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
  const prepared: IAutoMovieRecoveryCheckpointReporting | undefined =
    feasible === undefined || reportCapacity !== undefined
      ? undefined
      : prepareRecoveryCheckpointReportCapacity(
          poses[0]!,
          budget,
          feasible,
          work,
        );
  const method: IAutoMovieRecoveryFeasibleJointOptions | undefined =
    prepared?.feasible ?? feasible;
  const reporting: IAutoMovieRecoveryFeasibleReportCapacity | undefined =
    method === undefined ? undefined : (reportCapacity ?? prepared!.reporting);
  const execution: IAutoMovieRecoveryCameraSceneBudget =
    reporting === undefined || reportCapacity !== undefined
      ? budget
      : {
          ...budget,
          maxResidentLinearEntries: reporting.sceneEntries,
        };
  let proposal: ReturnType<IAutoMovieRecoverySceneLandmarksGrowthOperation.Operation> =
    growRecoverySceneLandmarks(
      tracks,
      initialLandmarks,
      poses,
      charts,
      policy,
      execution,
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
      execution,
      active.length,
      count,
      proposal.landmarks.length,
    );
    spendRecoverySceneWork(work, execution, "jointFits", 1);
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
    const refined: ReturnType<IAutoMovieRecoveryCameraMapRefinementOperation.Operation> =
      refineRecoveryCameraMap(
        active.map((view: number): IAutoMovieRecoveryMapPose => poses[view]!),
        compact,
        active.map((view: number): number[] => charts[view]!.matrix),
        policy,
        execution,
        (): void => {
          spendRecoverySceneWork(work, execution, "jointIterationAttempts", 1);
          checkpoint();
        },
        (amount: number): void =>
          spendRecoverySceneWork(work, execution, "linearWork", amount),
        method,
        reporting,
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
      const measured: ReturnType<IAutoMovieRecoveryScenePointEvaluationOperation.Operation> =
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
    const completed: ReturnType<IAutoMovieRecoverySceneLandmarksGrowthOperation.Operation> =
      growRecoverySceneLandmarks(
        tracks,
        landmarks,
        nextPoses,
        charts,
        policy,
        execution,
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
