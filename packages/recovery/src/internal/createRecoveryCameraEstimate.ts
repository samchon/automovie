import { convexHull2D } from "@automovie/engine/math/convexHull2D";
import type { IAutoMovieVector3 } from "@automovie/interface";
import type { IAutoMovieRecoveryCameraPairInput } from "@automovie/interface/recovery";

import type { IAutoMovieRecoveryCameraPairEstimate } from "../IAutoMovieRecoveryCameraPairEstimate";
import type { createRecoveryCameraChart } from "./createRecoveryCameraChart";
import type { extractRecoveryImageFeatures } from "./extractRecoveryImageFeatures";
import { fitRecoveryEpipolarConsensus } from "./fitRecoveryEpipolarConsensus";
import { fitRecoveryEpipolarMatrix } from "./fitRecoveryEpipolarMatrix";
import { fitRecoveryHomographyConsensus } from "./fitRecoveryHomographyConsensus";
import { isRecoveryCameraNumericalRefusal } from "./isRecoveryCameraNumericalRefusal";
import type { matchRecoveryImageFeatures } from "./matchRecoveryImageFeatures";
import { measureRecoveryEpipolarErrors } from "./measureRecoveryEpipolarErrors";
import { scoreRecoveryCameraResiduals } from "./scoreRecoveryCameraResiduals";
import { selectRecoveryCameraPose } from "./selectRecoveryCameraPose";

/**
 * Qualify completed automatic observations and assemble owned camera evidence.
 * Every independent final gate runs when its required observations exist. A
 * completed observation artifact may refuse its camera; only a candidate passing
 * all gates exposes a relative transform. No shape reconstruction is performed.
 *
 * @evidence contracts/common.md#principled-implementation Calibrated robust fitting is checked against its final all-inlier sampling target, local convergence, complete original-design rank, all retained pixel errors, four-branch cheirality/parallax and a competing planar explanation. Pixel convex-hull fractions describe observed image extent only. Final essential projection must preserve inlier identities before a camera can be exposed.
 * @evidence contracts/common.md#clear-and-simple-design This recovery coordinator owns qualification and JSON evidence, with separate owners for observation, consensus, pose fitting and generic engine hull mathematics. Every failed independent gate remains visible in one refusal list.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No truncated error quantile, hidden numerical exception, truth pose, metric scale, inferred surface or refused transform becomes accepted output. Undefined diagnostics stay null and unexpected/checkpoint exceptions propagate.
 * @evidence contracts/common.md#meaningful-documentation States conditional gates, complete-error population, arithmetic-support consistency, image-versus-surface coverage, refusal effects and absence of reconstructed geometry.
 * @evidence contracts/performance.md#efficient-algorithms Over M tentative matches, delegated bounded consensus dominates work; final rank, four-pose diagnostics and planar competition retain their declared budgets. Hull sorting costs O(M log M), and owned result assembly costs O(M) without RGB or descriptor copies.
 * @evidence contracts/performance.md#reuse-equivalent-work The fixed automatic matches and supplied charts serve every independent gate. One selected branch's triangulations supply depth/parallax, while one complete pixel-error pass supplies both quantiles and support-consistency checks.
 * @evidence contracts/performance.md#bound-retention-and-release-resources O(M) plain evidence records and fixed-size counters transfer to the caller; transient features, proposal factors, triangulations and callbacks expire with the synchronous owner. No image buffer, handle or cache enters the artifact.
 */
export function createRecoveryCameraEstimate(
  input: IAutoMovieRecoveryCameraPairInput,
  features: readonly ReturnType<typeof extractRecoveryImageFeatures>[],
  matches: ReturnType<typeof matchRecoveryImageFeatures>,
  charts: [
    ReturnType<typeof createRecoveryCameraChart>,
    ReturnType<typeof createRecoveryCameraChart>,
  ],
  checkpoint: (phase: string, completed: number, total: number) => void,
): IAutoMovieRecoveryCameraPairEstimate {
  const result: IAutoMovieRecoveryCameraPairEstimate = {
    schema: "automovie-recovery-camera-pair-estimate-v1",
    objectId: input.objectId,
    cohort: input.cohort,
    status: "refused",
    refusalReasons: [],
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
    consensus: null,
    pose: null,
  };
  if (matches.length < 8) {
    result.refusalReasons.push("insufficient-appearance-matches");
    return result;
  }
  const first: [number, number][] = matches.map(
    (match: (typeof matches)[number]): [number, number] => match.first,
  );
  const second: [number, number][] = matches.map(
    (match: (typeof matches)[number]): [number, number] => match.second,
  );
  const p: typeof input.policy = input.policy,
    b: typeof input.budget = input.budget;
  const epipolar: ReturnType<typeof fitRecoveryEpipolarConsensus> =
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
  for (const at of indices) result.matches[at]!.epipolarInlier = true;
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
  result.consensus = consensus;
  if (!epipolar.conditionalTrialTargetMet)
    result.refusalReasons.push("epipolar-search-budget");
  if (!epipolar.finalRefinement?.converged)
    result.refusalReasons.push(
      epipolar.finalRefinement?.refusal ?? "unresolved-final-refinement",
    );
  if (indices.length < p.minimumInliers)
    result.refusalReasons.push("inlier-count");
  if (consensus.inlierFraction < p.minimumInlierFraction)
    result.refusalReasons.push("inlier-fraction");
  const inlierFirst: [number, number][] = indices.map(
    (at: number): [number, number] => first[at]!,
  );
  const inlierSecond: [number, number][] = indices.map(
    (at: number): [number, number] => second[at]!,
  );
  let pose: ReturnType<typeof selectRecoveryCameraPose> | null = null;
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
      result.refusalReasons.push("final-design-degeneracy");
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
      if (!pose.uniqueWinner) result.refusalReasons.push("pose-ambiguity");
      if (pose.positiveDepthFraction < p.minimumPositiveDepthFraction)
        result.refusalReasons.push("cheirality");
      if (
        pose.medianParallaxRadians === null ||
        pose.medianParallaxRadians < p.minimumParallaxRadians
      )
        result.refusalReasons.push("low-parallax");
      const allErrors: ReturnType<typeof measureRecoveryEpipolarErrors> =
        measureRecoveryEpipolarErrors(pose.fundamental, first, second);
      const actualScore: ReturnType<typeof scoreRecoveryCameraResiduals> =
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
        result.refusalReasons.push("final-essential-support-changed");
        consensus.finalRefinementConverged = false;
      }
      if (indices.some((at: number): boolean => allErrors[at] === null))
        result.refusalReasons.push("undefined-final-epipolar-lines");
      // Retain every finite final inlier error, including errors above the policy
      // limits. Applying those limits here would conceal the failing tail.
      const statistics: ReturnType<typeof scoreRecoveryCameraResiduals> =
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
        result.refusalReasons.push("calibrated-pixel-residual");
    } catch (error: unknown) {
      if (!isRecoveryCameraNumericalRefusal(error)) throw error;
      result.refusalReasons.push("unresolved-final-pose");
      pose = null;
    }
    const fractions: number[] = [];
    for (const [at, points] of [inlierFirst, inlierSecond].entries()) {
      const view: (typeof input.views)[number] = input.views[at]!;
      const hull: IAutoMovieVector3[] = convexHull2D(
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
      if (!Number.isFinite(fraction))
        throw new Error("camera-evidence: nonrepresentable image hull area");
      fractions.push(fraction);
    }
    consensus.inlierImageHullFractions = [fractions[0]!, fractions[1]!];
  } else result.refusalReasons.push("insufficient-calibrated-support");
  if (indices.length >= 4) {
    const homography: ReturnType<typeof fitRecoveryHomographyConsensus> =
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
      result.matches[indices[local]!]!.homographyInlier = true;
    if (homography.forbiddenOverlapFound)
      result.refusalReasons.push("homography-ambiguity");
    else if (!homography.conditionalTrialTargetMet)
      result.refusalReasons.push("homography-search-budget");
  }
  if (result.refusalReasons.length === 0 && pose !== null) {
    result.status = "accepted-relative-pose";
    result.pose = {
      gauge: "first-camera-unit-baseline",
      metricScale: "unknown",
      rotation: pose.rotation.slice(),
      translation: [...pose.translation],
      essentialProjectionDiscrepancy: pose.relativeProjectionDiscrepancy,
    };
  }
  checkpoint("camera-qualification", 1, 1);
  return result;
}
