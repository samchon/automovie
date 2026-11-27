import type {
  IAutoMovieRecoveryMapPointProjectionOperation,
  IAutoMovieRecoveryMapPose,
  IAutoMovieRecoveryResectionConsensusFittingOperation,
  IAutoMovieRecoveryResectionDesignTrace,
  IAutoMovieRecoveryResectionRefinementOperation,
  IAutoMovieRecoveryResectionScore,
  IAutoMovieRecoveryResectionTrace,
} from "@automovie/interface";

import { fitRecoveryResectionDesign } from "./fitRecoveryResectionDesign";
import { projectRecoveryMapPoint } from "../../observation/internal/projectRecoveryMapPoint";
import { refineRecoveryResection } from "./refineRecoveryResection";
import { requiredRecoveryCameraTrials } from "./requiredRecoveryCameraTrials";
import { sampleRecoveryCameraIndices } from "./sampleRecoveryCameraIndices";

/*
 * Robustly register one calibrated image against distinct existing landmarks.
 * Six unique-index samples initialize nonplanar DLT poses before pixel scoring;
 * eligible proposals receive bounded local refinement in draw order. Final
 * support must stabilize and satisfy its recomputed conditional trial target.
 * onProposal runs exactly once before each six-point draw; checkpoint also runs
 * around refinement and therefore does not count proposals. Optional diagnostic
 * events snapshot actual intermediate results outside the numerical catches;
 * observer errors propagate and no event history is retained.
 */
export function fitRecoveryResectionConsensus(
  points: Parameters<IAutoMovieRecoveryResectionConsensusFittingOperation.Operation>[0],
  pixels: Parameters<IAutoMovieRecoveryResectionConsensusFittingOperation.Operation>[1],
  intrinsic: Parameters<IAutoMovieRecoveryResectionConsensusFittingOperation.Operation>[2],
  inverse: Parameters<IAutoMovieRecoveryResectionConsensusFittingOperation.Operation>[3],
  policy: Parameters<IAutoMovieRecoveryResectionConsensusFittingOperation.Operation>[4],
  budget: Parameters<IAutoMovieRecoveryResectionConsensusFittingOperation.Operation>[5],
  checkpoint: Parameters<IAutoMovieRecoveryResectionConsensusFittingOperation.Operation>[6],
  onProposal: Parameters<IAutoMovieRecoveryResectionConsensusFittingOperation.Operation>[7] = (): void => {},
  onTrace?: Parameters<IAutoMovieRecoveryResectionConsensusFittingOperation.Operation>[8],
): ReturnType<IAutoMovieRecoveryResectionConsensusFittingOperation.Operation> {
  if (points.length !== pixels.length)
    throw new Error("camera-map: paired resection population required");
  const emit: ((event: IAutoMovieRecoveryResectionTrace) => void) | undefined =
    onTrace
      ? (event: IAutoMovieRecoveryResectionTrace): void =>
          onTrace(structuredClone(event))
      : undefined;
  const score: (
    pose: IAutoMovieRecoveryMapPose,
  ) => IAutoMovieRecoveryResectionScore = (
    pose: IAutoMovieRecoveryMapPose,
  ): IAutoMovieRecoveryResectionScore => {
    const indices: number[] = [];
    let cost: number = 0;
    for (let at: number = 0; at < points.length; at++) {
      const projection: ReturnType<IAutoMovieRecoveryMapPointProjectionOperation.Operation> =
        projectRecoveryMapPoint(pose, points[at]!, intrinsic);
      const error: number =
        projection === null
          ? Infinity
          : Math.hypot(
              projection.pixel[0] - pixels[at]![0],
              projection.pixel[1] - pixels[at]![1],
            );
      if (error <= policy.maximumReprojectionErrorPx) indices.push(at);
      cost += Math.min(error, policy.maximumReprojectionErrorPx) ** 2;
    }
    return { indices, cost };
  };
  const numerical: (error: unknown) => boolean = (error: unknown): boolean =>
    error instanceof Error &&
    error.name === "Error" &&
    /^(camera-(resection|map):|singular-matrix:|matrix3:)/.test(error.message);
  let pose: IAutoMovieRecoveryMapPose | null = null;
  let best: ReturnType<typeof score> = { indices: [], cost: Infinity };
  let trials: number = 0,
    localRefinements: number = 0,
    numericalRefusals: number = 0,
    finalRefits: number = 0,
    required: number = Infinity;
  let stable: boolean = false;
  let refinement: ReturnType<IAutoMovieRecoveryResectionRefinementOperation.Operation> | null =
    null;
  while (
    points.length >= 6 &&
    trials < budget.maxResectionTrials &&
    (trials < budget.minimumResectionTrials || trials < required)
  ) {
    checkpoint();
    onProposal();
    const sample: number[] = sampleRecoveryCameraIndices(
      points.length,
      6,
      policy.samplingSeed,
      0x504e5052,
      trials++,
    );
    const diagnostic: IAutoMovieRecoveryResectionDesignTrace | undefined =
      onTrace ? { stage: "admission" } : undefined;
    let designError: string | null = null;
    let candidate: IAutoMovieRecoveryMapPose | null = null;
    try {
      candidate = fitRecoveryResectionDesign(
        sample.map(
          (at: number): readonly [number, number, number] => points[at]!,
        ),
        sample.map((at: number): readonly [number, number] => pixels[at]!),
        inverse,
        policy,
        budget,
        diagnostic,
      ).pose;
    } catch (error: unknown) {
      if (!numerical(error)) throw error;
      numericalRefusals++;
      designError = error instanceof Error ? error.message : String(error);
    }
    if (candidate === null) {
      emit?.({
        phase: "proposal",
        index: trials - 1,
        sample,
        design: diagnostic!,
        error: designError,
        beforePose: null,
        before: null,
        refinementAttempted: false,
        refinement: null,
        afterPose: null,
        after: null,
        stable: null,
      });
      continue;
    }
    let measured: ReturnType<typeof score> = score(candidate);
    const beforePose: IAutoMovieRecoveryMapPose = candidate;
    const before: IAutoMovieRecoveryResectionScore = measured;
    let local: ReturnType<IAutoMovieRecoveryResectionRefinementOperation.Operation> | null =
      null;
    let localError: string | null = null;
    let refinementAttempted: boolean = false;
    if (
      measured.indices.length >= 6 &&
      localRefinements < budget.maxLocalRefinements
    ) {
      localRefinements++;
      refinementAttempted = true;
      // Checkpoints stay outside speculative numerical catches.
      try {
        local = refineRecoveryResection(
          candidate,
          measured.indices.map(
            (at: number): readonly [number, number, number] => points[at]!,
          ),
          measured.indices.map(
            (at: number): readonly [number, number] => pixels[at]!,
          ),
          intrinsic,
          policy,
          budget,
          (): void => {},
        );
      } catch (error: unknown) {
        if (!numerical(error)) throw error;
        numericalRefusals++;
        localError = error instanceof Error ? error.message : String(error);
      }
      checkpoint();
      if (local?.converged) {
        const fitted: ReturnType<typeof score> = score(local.pose);
        if (
          fitted.indices.length > measured.indices.length ||
          (fitted.indices.length === measured.indices.length &&
            fitted.cost < measured.cost)
        ) {
          candidate = local.pose;
          measured = fitted;
        }
      }
    }
    emit?.({
      phase: "proposal",
      index: trials - 1,
      sample,
      design: diagnostic!,
      error: localError,
      beforePose,
      before,
      refinementAttempted,
      refinement: local,
      afterPose: candidate,
      after: measured,
      stable: null,
    });
    if (
      measured.indices.length > best.indices.length ||
      (measured.indices.length === best.indices.length &&
        measured.cost < best.cost)
    ) {
      pose = candidate;
      best = measured;
      required = requiredRecoveryCameraTrials(
        points.length,
        best.indices.length,
        6,
        policy.samplingConfidence,
      );
    }
  }
  while (pose !== null && best.indices.length >= 6 && finalRefits < 3) {
    checkpoint();
    finalRefits++;
    const beforePose: IAutoMovieRecoveryMapPose = pose;
    const before: IAutoMovieRecoveryResectionScore = best;
    let finalError: string | null = null;
    let finalFit: ReturnType<IAutoMovieRecoveryResectionRefinementOperation.Operation> | null =
      null;
    try {
      finalFit = refineRecoveryResection(
        pose,
        best.indices.map(
          (at: number): readonly [number, number, number] => points[at]!,
        ),
        best.indices.map(
          (at: number): readonly [number, number] => pixels[at]!,
        ),
        intrinsic,
        policy,
        budget,
        (): void => {},
      );
    } catch (error: unknown) {
      if (!numerical(error)) throw error;
      numericalRefusals++;
      finalError = error instanceof Error ? error.message : String(error);
    }
    if (finalError !== null) {
      emit?.({
        phase: "final-refit",
        index: finalRefits - 1,
        sample: before.indices,
        design: null,
        error: finalError,
        beforePose,
        before,
        refinementAttempted: true,
        refinement: null,
        afterPose: null,
        after: null,
        stable: null,
      });
      break;
    }
    refinement = finalFit!;
    checkpoint();
    if (!refinement.converged) {
      emit?.({
        phase: "final-refit",
        index: finalRefits - 1,
        sample: before.indices,
        design: null,
        error: null,
        beforePose,
        before,
        refinementAttempted: true,
        refinement,
        afterPose: null,
        after: null,
        stable: null,
      });
      break;
    }
    const next: ReturnType<typeof score> = score(refinement.pose);
    stable =
      next.indices.length === best.indices.length &&
      next.indices.every(
        (at: number, offset: number): boolean => at === best.indices[offset],
      );
    pose = refinement.pose;
    best = next;
    emit?.({
      phase: "final-refit",
      index: finalRefits - 1,
      sample: before.indices,
      design: null,
      error: null,
      beforePose,
      before,
      refinementAttempted: true,
      refinement,
      afterPose: pose,
      after: best,
      stable,
    });
    if (stable) break;
  }
  required = requiredRecoveryCameraTrials(
    points.length,
    best.indices.length,
    6,
    policy.samplingConfidence,
  );
  const refusalReasons: string[] = [];
  if (
    best.indices.length < policy.minimumResectionInliers ||
    best.indices.length / points.length < policy.minimumResectionInlierFraction
  )
    refusalReasons.push("insufficient-resection-support");
  if (pose === null) refusalReasons.push("no-resection-initializer");
  if (!stable) refusalReasons.push("unstable-resection-support");
  if (!refinement?.converged) refusalReasons.push("resection-not-converged");
  if (
    required === Infinity ||
    trials < Math.max(required, budget.minimumResectionTrials)
  )
    refusalReasons.push("resection-trial-target-not-met");
  return {
    pose: refusalReasons.length === 0 ? pose : null,
    indices: best.indices,
    trials,
    requiredTrials: required !== Infinity ? required : null,
    localRefinements,
    numericalRefusals,
    finalRefits,
    stable,
    refusalReasons,
    refinement,
  };
}
