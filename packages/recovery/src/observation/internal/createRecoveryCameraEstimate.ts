import { AutoMovieEngineMath } from "@automovie/engine";
import type {
  IAutoMovieRecoveryCameraEstimateCreationOperation,
  IAutoMovieRecoveryCameraPairEstimate,
  IAutoMovieRecoveryCameraPoseSelectionOperation,
  IAutoMovieRecoveryCameraResidualsScoreOperation,
  IAutoMovieRecoveryEpipolarConsensusFittingOperation,
  IAutoMovieRecoveryEpipolarErrorsMeasurementOperation,
  IAutoMovieRecoveryHomographyConsensusFittingOperation,
  IAutoMovieVector3,
} from "@automovie/interface";

import { fitRecoveryEpipolarConsensus } from "../../geometry/internal/fitRecoveryEpipolarConsensus";
import { fitRecoveryEpipolarMatrix } from "../../geometry/internal/fitRecoveryEpipolarMatrix";
import { fitRecoveryHomographyConsensus } from "../../geometry/internal/fitRecoveryHomographyConsensus";
import { measureRecoveryEpipolarErrors } from "../../geometry/internal/measureRecoveryEpipolarErrors";
import { scoreRecoveryCameraResiduals } from "../../geometry/internal/scoreRecoveryCameraResiduals";
import { selectRecoveryCameraPose } from "../../geometry/internal/selectRecoveryCameraPose";
import { isRecoveryCameraNumericalRefusal } from "./isRecoveryCameraNumericalRefusal";

/*
 * Qualify completed automatic observations and assemble owned camera evidence.
 * Every independent final gate runs when its required observations exist. A
 * completed observation artifact may refuse its camera; only a candidate
 * passing all gates exposes a relative transform. No shape reconstruction is
 * performed.
 */
export function createRecoveryCameraEstimate(
  input: Parameters<IAutoMovieRecoveryCameraEstimateCreationOperation.Operation>[0],
  features: Parameters<IAutoMovieRecoveryCameraEstimateCreationOperation.Operation>[1],
  matches: Parameters<IAutoMovieRecoveryCameraEstimateCreationOperation.Operation>[2],
  charts: Parameters<IAutoMovieRecoveryCameraEstimateCreationOperation.Operation>[3],
  checkpoint: Parameters<IAutoMovieRecoveryCameraEstimateCreationOperation.Operation>[4],
): ReturnType<IAutoMovieRecoveryCameraEstimateCreationOperation.Operation> {
  const identity: Pick<
    IAutoMovieRecoveryCameraPairEstimate.IObservations,
    "schema" | "objectId" | "cohort"
  > = {
    schema: "automovie-recovery-camera-pair-estimate-v1",
    objectId: input.objectId,
    cohort: input.cohort,
  };
  const observations: Omit<
    IAutoMovieRecoveryCameraPairEstimate.IObservations,
    keyof typeof identity
  > = {
    policy: { ...input.policy },
    budget: { ...input.budget },
    sources: input.views.map(
      (
        view: (typeof input.views)[number],
      ): IAutoMovieRecoveryCameraPairEstimate["sources"][number] => ({
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
    features: features.map(
      (
        feature: (typeof features)[number],
        at: number,
      ): IAutoMovieRecoveryCameraPairEstimate["features"][number] => ({
        viewId: input.views[at]!.id,
        rawCorners: feature.rawCorners,
        validCandidates: feature.validCandidates,
        selectedBeforeDescriptor: feature.selectedBeforeDescriptor,
        observedDescriptors: feature.points.length,
        zeroDescriptors: feature.zeroDescriptors,
        invalidSupportDescriptors: feature.invalidSupportDescriptors,
      }),
    ),
    matches: matches.map(
      (
        match: (typeof matches)[number],
      ): IAutoMovieRecoveryCameraPairEstimate["matches"][number] => ({
        firstFeatureIndex: match.firstIndex,
        secondFeatureIndex: match.secondIndex,
        firstPx: [...match.first],
        secondPx: [...match.second],
        descriptorDistanceRatio: match.descriptorDistanceRatio,
        squaredDescriptorDistance: match.squaredDescriptorDistance,
        epipolarInlier: false,
        homographyInlier: false,
      }),
    ),
  };
  if (matches.length < 8)
    return {
      ...identity,
      status: "refused",
      refusalReasons: ["insufficient-appearance-matches"],
      ...observations,
      consensus: null,
      pose: null,
    };
  const refusalReasons: string[] = [];
  const first: [number, number][] = matches.map(
    (match: (typeof matches)[number]): [number, number] => match.first,
  );
  const second: [number, number][] = matches.map(
    (match: (typeof matches)[number]): [number, number] => match.second,
  );
  const p: typeof input.policy = input.policy,
    b: typeof input.budget = input.budget;
  const epipolar: ReturnType<IAutoMovieRecoveryEpipolarConsensusFittingOperation.Operation> =
    fitRecoveryEpipolarConsensus(
      first,
      second,
      charts[0],
      charts[1],
      p,
      b,
      (completed: number, total: number): void =>
        checkpoint("epipolar-consensus", completed, total),
    );
  const indices: number[] = epipolar.score.indices;
  for (const at of indices) observations.matches[at]!.epipolarInlier = true;
  const consensus: NonNullable<
    IAutoMovieRecoveryCameraPairEstimate["consensus"]
  > = {
    trials: epipolar.trials,
    requiredTrialsAtFinalSupport: epipolar.requiredTrialsAtFinalSupport,
    conditionalTrialTargetMet: epipolar.conditionalTrialTargetMet,
    numericalRefusals: epipolar.numericalRefusals,
    localRefinements: epipolar.localRefinements,
    localRefinementRefusals: epipolar.localRefinementRefusals,
    finalReestimations: epipolar.finalReestimations,
    finalRefinementConverged: epipolar.finalRefinement?.converged === true,
    optimizerFits: (epipolar.finalRefinement?.fits ?? []).map(
      (
        fit: NonNullable<typeof epipolar.finalRefinement>["fits"][number],
      ): NonNullable<
        IAutoMovieRecoveryCameraPairEstimate["consensus"]
      >["optimizerFits"][number] => ({
        iterations: fit.iterations,
        acceptedSteps: fit.acceptedSteps,
        termination: fit.termination,
        converged: fit.converged,
        initialCost: fit.initialCost,
        finalCost: fit.finalCost,
        minimumLocalDesignRatio: fit.minimumLocalDesignRatio,
      }),
    ),
    finalDesignSingularRatio: null,
    inliers: indices.length,
    inlierFraction: indices.length / matches.length,
    medianSymmetricPointLinePx: null,
    p90SymmetricPointLinePx: null,
    inlierImageHullFractions: null,
    positiveDepthFraction: null,
    medianParallaxRadians: null,
    allPositiveDepthCounts: [],
    homography: null,
  };
  if (!epipolar.conditionalTrialTargetMet)
    refusalReasons.push("epipolar-search-budget");
  if (!epipolar.finalRefinement?.converged)
    refusalReasons.push(
      epipolar.finalRefinement?.refusal ?? "unresolved-final-refinement",
    );
  if (indices.length < p.minimumInliers) refusalReasons.push("inlier-count");
  if (consensus.inlierFraction < p.minimumInlierFraction)
    refusalReasons.push("inlier-fraction");
  const inlierFirst: [number, number][] = indices.map(
    (at: number): [number, number] => first[at]!,
  );
  const inlierSecond: [number, number][] = indices.map(
    (at: number): [number, number] => second[at]!,
  );
  let pose: ReturnType<IAutoMovieRecoveryCameraPoseSelectionOperation.Operation> | null =
    null;
  checkpoint("camera-qualification", 0, 1);
  if (epipolar.matrix !== null && indices.length >= 8) {
    try {
      consensus.finalDesignSingularRatio = fitRecoveryEpipolarMatrix(
        inlierFirst,
        inlierSecond,
        p.minimumDesignSingularRatio,
        b.maxSingularSweeps,
      ).designSingularRatio;
    } catch (error: unknown) {
      if (!isRecoveryCameraNumericalRefusal(error)) throw error;
      refusalReasons.push("final-design-degeneracy");
    }
    try {
      pose = selectRecoveryCameraPose(
        epipolar.matrix,
        inlierFirst,
        inlierSecond,
        charts[0],
        charts[1],
        p.minimumDesignSingularRatio,
        b.maxSingularSweeps,
      );
      consensus.positiveDepthFraction = pose.positiveDepthFraction;
      consensus.medianParallaxRadians = pose.medianParallaxRadians;
      consensus.allPositiveDepthCounts = pose.allPositiveDepthCounts.slice();
      if (!pose.uniqueWinner) refusalReasons.push("pose-ambiguity");
      if (pose.positiveDepthFraction < p.minimumPositiveDepthFraction)
        refusalReasons.push("cheirality");
      if (
        pose.medianParallaxRadians === null ||
        pose.medianParallaxRadians < p.minimumParallaxRadians
      )
        refusalReasons.push("low-parallax");
      const allErrors: ReturnType<IAutoMovieRecoveryEpipolarErrorsMeasurementOperation.Operation> =
        measureRecoveryEpipolarErrors(pose.fundamental, first, second);
      const actualScore: ReturnType<IAutoMovieRecoveryCameraResidualsScoreOperation.Operation> =
        scoreRecoveryCameraResiduals(
          allErrors.map(
            (error: (typeof allErrors)[number]): number | null =>
              error?.signedSampsonPx ?? null,
          ),
          p.maximumSampsonErrorPx,
        );
      if (
        actualScore.indices.length !== indices.length ||
        !actualScore.indices.every(
          (at: number, index: number): boolean => at === indices[index],
        )
      ) {
        refusalReasons.push("final-essential-support-changed");
        consensus.finalRefinementConverged = false;
      }
      if (indices.some((at: number): boolean => allErrors[at] === null))
        refusalReasons.push("undefined-final-epipolar-lines");
      // Retain every finite final inlier error, including errors above the policy
      // limits. Applying those limits here would conceal the failing tail.
      const statistics: ReturnType<IAutoMovieRecoveryCameraResidualsScoreOperation.Operation> =
        scoreRecoveryCameraResiduals(
          indices.map(
            (at: number): number | null =>
              allErrors[at]?.symmetricPointLinePx ?? null,
          ),
          Number.MAX_VALUE,
        );
      consensus.medianSymmetricPointLinePx = statistics.medianPx;
      consensus.p90SymmetricPointLinePx = statistics.p90Px;
      if (
        statistics.medianPx === null ||
        statistics.p90Px === null ||
        statistics.medianPx > p.maximumMedianErrorPx ||
        statistics.p90Px > p.maximumP90ErrorPx
      )
        refusalReasons.push("calibrated-pixel-residual");
    } catch (error: unknown) {
      if (!isRecoveryCameraNumericalRefusal(error)) throw error;
      refusalReasons.push("unresolved-final-pose");
      pose = null;
    }
    const fractions: number[] = [];
    for (const [at, points] of [inlierFirst, inlierSecond].entries()) {
      const view: (typeof input.views)[number] = input.views[at]!;
      const hull: IAutoMovieVector3[] = AutoMovieEngineMath.convexHull2D(
        points.map(
          (point: [number, number]): IAutoMovieVector3 => ({
            x: point[0] / view.width,
            y: 0,
            z: point[1] / view.height,
          }),
        ),
      );
      let twiceArea: number = 0;
      for (let edge: number = 0; edge < hull.length; edge++) {
        const a: IAutoMovieVector3 = hull[edge]!,
          next: IAutoMovieVector3 = hull[(edge + 1) % hull.length]!;
        twiceArea += a.x * next.z - a.z * next.x;
      }
      const fraction: number = Math.abs(twiceArea) / 2;
      fractions.push(fraction);
    }
    consensus.inlierImageHullFractions = [fractions[0]!, fractions[1]!];
  } else refusalReasons.push("insufficient-calibrated-support");
  if (indices.length >= 4) {
    const homography: ReturnType<IAutoMovieRecoveryHomographyConsensusFittingOperation.Operation> =
      fitRecoveryHomographyConsensus(
        inlierFirst,
        inlierSecond,
        p,
        b,
        (completed: number, total: number): void =>
          checkpoint("homography-consensus", completed, total),
      );
    consensus.homography = {
      population: homography.population,
      support: homography.score.indices.length,
      forbiddenSupport: homography.forbiddenSupport,
      trials: homography.trials,
      requiredTrialsAtForbiddenSupport:
        homography.requiredTrialsAtForbiddenSupport,
      conditionalTrialTargetMet: homography.conditionalTrialTargetMet,
      forbiddenOverlapFound: homography.forbiddenOverlapFound,
      numericalRefusals: homography.numericalRefusals,
      refitRefusals: homography.refitRefusals,
    };
    for (const local of homography.score.indices)
      observations.matches[indices[local]!]!.homographyInlier = true;
    if (homography.forbiddenOverlapFound)
      refusalReasons.push("homography-ambiguity");
    else if (!homography.conditionalTrialTargetMet)
      refusalReasons.push("homography-search-budget");
  }
  const [firstRefusal, ...otherRefusals] = refusalReasons;
  let result: IAutoMovieRecoveryCameraPairEstimate;
  if (firstRefusal === undefined && pose !== null)
    result = {
      ...identity,
      status: "accepted-relative-pose",
      refusalReasons: [],
      ...observations,
      consensus,
      pose: {
        gauge: "first-camera-unit-baseline",
        metricScale: "unknown",
        rotation: pose.rotation.slice(),
        translation: [...pose.translation],
        essentialProjectionDiscrepancy: pose.relativeProjectionDiscrepancy,
      },
    };
  else
    result = {
      ...identity,
      status: "refused",
      refusalReasons: [
        firstRefusal ?? "unresolved-final-pose",
        ...otherRefusals,
      ],
      ...observations,
      consensus,
      pose: null,
    };
  checkpoint("camera-qualification", 1, 1);
  return result;
}
