import type {
  IAutoMovieRecoveryCameraMapBudget,
  IAutoMovieRecoveryCameraMapPolicy,
} from "@automovie/interface/recovery";

import type { IAutoMovieRecoveryMapPose } from "../structures/image/IAutoMovieRecoveryMapPose";
import { fitRecoveryResectionDesign } from "./fitRecoveryResectionDesign";
import { projectRecoveryMapPoint } from "./projectRecoveryMapPoint";
import { refineRecoveryResection } from "./refineRecoveryResection";
import { requiredRecoveryCameraTrials } from "./requiredRecoveryCameraTrials";
import { sampleRecoveryCameraIndices } from "./sampleRecoveryCameraIndices";

/**
 * Robustly register one calibrated image against distinct existing landmarks.
 * Six unique-index samples initialize nonplanar DLT poses before pixel scoring;
 * eligible proposals receive bounded local refinement in draw order. Final
 * support must stabilize and satisfy its recomputed conditional trial target.
 * onProposal runs exactly once before each six-point draw; checkpoint also runs
 * around refinement and therefore does not count proposals.
 *
 * @evidence contracts/common.md#principled-implementation Deterministic unique-six sampling, proper DLT projection, positive-depth Euclidean pixel support and fixed-subset SO3 refinement implement calibrated 3D-to-2D consensus. Complete scores compare inlier count then squared clipped residual; final refits and ideal finite-population confidence are separate qualification gates.
 * @evidence contracts/common.md#clear-and-simple-design This owner chooses robust support and a conditional camera; point generation, track uniqueness admission and joint map refinement remain with callers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No raw winner suppresses an eligible refinement inside its explicit budget, no truth/filename camera is consulted, and no changed final support inherits an older trial target. Only declared numerical proposal errors are counted; checkpoints and unexpected errors propagate.
 * @evidence contracts/common.md#meaningful-documentation States distinct-track caller premise, six-point nonplanar initializer, pixel scoring, local-attempt budget, stable support and conditional confidence versus physical correctness.
 * @evidence contracts/performance.md#efficient-algorithms T proposals over N landmarks use bounded twelve-column DLT plus O(N) scoring. At most L proposals and three final refits receive bounded six-coordinate refinement. O(N) current/best evidence is retained.
 * @evidence contracts/performance.md#reuse-equivalent-work Fixed 3D/pixel observations serve all proposals; unchanged final index support ends refitting. No descriptors, pixels or triangulations are recomputed.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One owned accepted pose or null, index list and scalar counters return; proposal scratch and callbacks expire without cache, file or external process.
 */
export function fitRecoveryResectionConsensus(
  points: readonly (readonly [number, number, number])[],
  pixels: readonly (readonly [number, number])[],
  intrinsic: readonly number[],
  inverse: readonly number[],
  policy: IAutoMovieRecoveryCameraMapPolicy,
  budget: IAutoMovieRecoveryCameraMapBudget,
  checkpoint: () => void,
  onProposal: () => void = (): void => {},
): {
  pose: IAutoMovieRecoveryMapPose | null;
  indices: number[];
  trials: number;
  requiredTrials: number | null;
  localRefinements: number;
  numericalRefusals: number;
  finalRefits: number;
  stable: boolean;
  refusalReasons: string[];
  refinement: ReturnType<typeof refineRecoveryResection> | null;
} {
  if (points.length !== pixels.length)
    throw new Error("camera-map: paired resection population required");
  const score: (pose: IAutoMovieRecoveryMapPose) => {
    indices: number[];
    cost: number;
  } = (
    pose: IAutoMovieRecoveryMapPose,
  ): { indices: number[]; cost: number } => {
    const indices: number[] = [];
    let cost: number = 0;
    for (let at: number = 0; at < points.length; at++) {
      const projection: ReturnType<typeof projectRecoveryMapPoint> =
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
  let refinement: ReturnType<typeof refineRecoveryResection> | null = null;
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
    let candidate: IAutoMovieRecoveryMapPose;
    try {
      candidate = fitRecoveryResectionDesign(
        sample.map(
          (at: number): readonly [number, number, number] => points[at]!,
        ),
        sample.map((at: number): readonly [number, number] => pixels[at]!),
        inverse,
        policy,
        budget,
      ).pose;
    } catch (error: unknown) {
      if (!numerical(error)) throw error;
      numericalRefusals++;
      continue;
    }
    let measured: ReturnType<typeof score> = score(candidate);
    if (
      measured.indices.length >= 6 &&
      localRefinements < budget.maxLocalRefinements
    ) {
      localRefinements++;
      let local: ReturnType<typeof refineRecoveryResection> | null = null;
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
    try {
      refinement = refineRecoveryResection(
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
      break;
    }
    checkpoint();
    if (!refinement.converged) break;
    const next: ReturnType<typeof score> = score(refinement.pose);
    stable =
      next.indices.length === best.indices.length &&
      next.indices.every(
        (at: number, offset: number): boolean => at === best.indices[offset],
      );
    pose = refinement.pose;
    best = next;
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
    !Number.isFinite(required) ||
    trials < Math.max(required, budget.minimumResectionTrials)
  )
    refusalReasons.push("resection-trial-target-not-met");
  return {
    pose: refusalReasons.length === 0 ? pose : null,
    indices: best.indices,
    trials,
    requiredTrials: Number.isFinite(required) ? required : null,
    localRefinements,
    numericalRefusals,
    finalRefits,
    stable,
    refusalReasons,
    refinement,
  };
}
