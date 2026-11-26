import { requiredRecoveryCameraTrials as requiredRecoveryCameraTrialsImplementation } from "./internal/requiredRecoveryCameraTrials";
import { refineRecoveryEpipolarModel as refineRecoveryEpipolarModelImplementation } from "./internal/refineRecoveryEpipolarModel";
import { sampleRecoveryCameraIndices as sampleRecoveryCameraIndicesImplementation } from "./internal/sampleRecoveryCameraIndices";
import { selectRecoveryCameraPose as selectRecoveryCameraPoseImplementation } from "./internal/selectRecoveryCameraPose";
import { calibrateRecoveryEpipolarMatrix as calibrateRecoveryEpipolarMatrixImplementation } from "./internal/calibrateRecoveryEpipolarMatrix";
import { fitRecoveryEpipolarConsensus as fitRecoveryEpipolarConsensusImplementation } from "./internal/fitRecoveryEpipolarConsensus";
import { fitRecoveryHomographyConsensus as fitRecoveryHomographyConsensusImplementation } from "./internal/fitRecoveryHomographyConsensus";
import { fitRecoveryResectionConsensus as fitRecoveryResectionConsensusImplementation } from "./internal/fitRecoveryResectionConsensus";
import { fitRecoveryResectionDesign as fitRecoveryResectionDesignImplementation } from "./internal/fitRecoveryResectionDesign";
import { refineRecoveryResection as refineRecoveryResectionImplementation } from "./internal/refineRecoveryResection";
import { refineRecoveryCameraPose as refineRecoveryCameraPoseImplementation } from "./internal/refineRecoveryCameraPose";

import { type IAutoMovieRecoveryCameraResidualsScoreOperation, type IAutoMovieRecoveryEpipolarErrorsMeasurementOperation, type IAutoMovieRecoveryEpipolarMatrixFittingOperation, type IAutoMovieRecoveryHomographyErrorsMeasurementOperation, type IAutoMovieRecoveryHomographyFittingOperation, type IAutoMovieRecoveryEpipolarModelRefinementOperation, type IAutoMovieRecoveryCameraPoseSelectionOperation, type IAutoMovieRecoveryEpipolarMatrixCalibrateOperation, type IAutoMovieRecoveryEpipolarConsensusFittingOperation, type IAutoMovieRecoveryHomographyConsensusFittingOperation, type IAutoMovieRecoveryResectionConsensusFittingOperation, type IAutoMovieRecoveryResectionDesign, type IAutoMovieRecoveryCameraMapPolicy, type IAutoMovieRecoveryCameraMapBudget, type IAutoMovieRecoveryResectionDesignTrace, type IAutoMovieRecoveryResectionRefinementOperation, type IAutoMovieRecoveryCameraPoseRefinementOperation } from "@automovie/interface";

import {
  fitRecoveryEpipolarMatrix as fitRecoveryEpipolarMatrixInternal,
  fitRecoveryHomography as fitRecoveryHomographyInternal,
  measureRecoveryEpipolarErrors as measureRecoveryEpipolarErrorsInternal,
  measureRecoveryHomographyErrors as measureRecoveryHomographyErrorsInternal,
  scoreRecoveryCameraResiduals as scoreRecoveryCameraResidualsInternal,
} from "./internal";

/** Public camera-model fitting and residual measurement operations. */
export namespace AutoMovieRecoveryCameraGeometry {
  /** Fit an epipolar matrix from paired image points. */
  export function fitEpipolarMatrix(
    ...args: Parameters<IAutoMovieRecoveryEpipolarMatrixFittingOperation.Operation>
  ): ReturnType<IAutoMovieRecoveryEpipolarMatrixFittingOperation.Operation> {
    return fitRecoveryEpipolarMatrixInternal(...args);
  }

  /** Fit a homography from paired image points. */
  export function fitHomography(
    ...args: Parameters<IAutoMovieRecoveryHomographyFittingOperation.Operation>
  ): ReturnType<IAutoMovieRecoveryHomographyFittingOperation.Operation> {
    return fitRecoveryHomographyInternal(...args);
  }

  /** Measure epipolar residuals for paired image points. */
  export function measureEpipolarErrors(
    ...args: Parameters<IAutoMovieRecoveryEpipolarErrorsMeasurementOperation.Operation>
  ): ReturnType<IAutoMovieRecoveryEpipolarErrorsMeasurementOperation.Operation> {
    return measureRecoveryEpipolarErrorsInternal(...args);
  }

  /** Measure symmetric homography transfer errors for paired image points. */
  export function measureHomographyErrors(
    ...args: Parameters<IAutoMovieRecoveryHomographyErrorsMeasurementOperation.Operation>
  ): ReturnType<IAutoMovieRecoveryHomographyErrorsMeasurementOperation.Operation> {
    return measureRecoveryHomographyErrorsInternal(...args);
  }

  /** Score finite camera residuals against an inclusive pixel threshold. */
  export function scoreCameraResiduals(
    ...args: Parameters<IAutoMovieRecoveryCameraResidualsScoreOperation.Operation>
  ): ReturnType<IAutoMovieRecoveryCameraResidualsScoreOperation.Operation> {
    return scoreRecoveryCameraResidualsInternal(...args);
  }

  /**
   * Trials for an all-inlier, unique-index sample under the ideal independent
   * uniform-trial RANSAC model. Within a trial, sampling is without replacement;
   * across trials, a subset may recur. Deterministic pseudorandom proposals do
   * not turn this conditional stopping calculation into a probability of pose
   * truth.
   */
  export function requiredCameraTrials(population: number, inliers: number, sampleSize: number, confidence: number): number {
    return requiredRecoveryCameraTrialsImplementation(population, inliers, sampleSize, confidence);
  }

  /**
   * Refine a calibrated consensus candidate with at most three inlier refits.
   * Each fixed-subset optimizer must terminate, and the final inlier population
   * must stabilize within this declared refit budget. A changed subset never
   * inherits a previous local convergence claim.
   */
  export function refineEpipolarModel(matrix: Parameters<IAutoMovieRecoveryEpipolarModelRefinementOperation.Operation>[0], initialScore: Parameters<IAutoMovieRecoveryEpipolarModelRefinementOperation.Operation>[1], firstPoints: Parameters<IAutoMovieRecoveryEpipolarModelRefinementOperation.Operation>[2], secondPoints: Parameters<IAutoMovieRecoveryEpipolarModelRefinementOperation.Operation>[3], first: Parameters<IAutoMovieRecoveryEpipolarModelRefinementOperation.Operation>[4], second: Parameters<IAutoMovieRecoveryEpipolarModelRefinementOperation.Operation>[5], policy: Parameters<IAutoMovieRecoveryEpipolarModelRefinementOperation.Operation>[6], budget: Parameters<IAutoMovieRecoveryEpipolarModelRefinementOperation.Operation>[7]): ReturnType<IAutoMovieRecoveryEpipolarModelRefinementOperation.Operation> {
    return refineRecoveryEpipolarModelImplementation(matrix, initialScore, firstPoints, secondPoints, first, second, policy, budget);
  }

  /**
   * Draw a reproducible ordered subset without replacement for one proposal. The
   * declared seed, distinct model domain and trial number identify every sample
   * independently of previous invocations. Sampling models the entire
   * tentative-match population, with no location, object or expected-pose prior.
   */
  export function sampleCameraIndices(population: number, sampleSize: number, seed: number, domain: number, trial: number): number[] {
    return sampleRecoveryCameraIndicesImplementation(population, sampleSize, seed, domain, trial);
  }

  /**
   * Measure all four calibrated pose branches on one fixed correspondence set.
   * The largest positive-depth count supplies a candidate; equal winning counts
   * remain explicitly ambiguous even though deterministic order names a
   * candidate. Parallax is summarized only for finite points positive in both
   * cameras.
   */
  export function selectCameraPose(fundamental: Parameters<IAutoMovieRecoveryCameraPoseSelectionOperation.Operation>[0], firstPoints: Parameters<IAutoMovieRecoveryCameraPoseSelectionOperation.Operation>[1], secondPoints: Parameters<IAutoMovieRecoveryCameraPoseSelectionOperation.Operation>[2], first: Parameters<IAutoMovieRecoveryCameraPoseSelectionOperation.Operation>[3], second: Parameters<IAutoMovieRecoveryCameraPoseSelectionOperation.Operation>[4], minimumDesignRatio: Parameters<IAutoMovieRecoveryCameraPoseSelectionOperation.Operation>[5], maxSweeps: Parameters<IAutoMovieRecoveryCameraPoseSelectionOperation.Operation>[6]): ReturnType<IAutoMovieRecoveryCameraPoseSelectionOperation.Operation> {
    return selectRecoveryCameraPoseImplementation(fundamental, firstPoints, secondPoints, first, second, minimumDesignRatio, maxSweeps);
  }

  /**
   * Project a pixel fundamental matrix onto the supplied-calibration essential
   * manifold and return all four relative-pose candidates. Arrays are row-major;
   * each candidate maps first-camera coordinates to second-camera coordinates.
   * Translation has unit norm and carries no physical length measurement. The
   * equal-singular projection and four-pose ambiguity follow HZ chapter 9:
   * https://www.robots.ox.ac.uk/~vgg/hzbook/hzbook2/HZepipolar.pdf
   */
  export function calibrateEpipolarMatrix(fundamental: Parameters<IAutoMovieRecoveryEpipolarMatrixCalibrateOperation.Operation>[0], first: Parameters<IAutoMovieRecoveryEpipolarMatrixCalibrateOperation.Operation>[1], second: Parameters<IAutoMovieRecoveryEpipolarMatrixCalibrateOperation.Operation>[2], maxSweeps: Parameters<IAutoMovieRecoveryEpipolarMatrixCalibrateOperation.Operation>[3]): ReturnType<IAutoMovieRecoveryEpipolarMatrixCalibrateOperation.Operation> {
    return calibrateRecoveryEpipolarMatrixImplementation(fundamental, first, second, maxSweeps);
  }

  /**
   * Estimate a calibrated pixel epipolar consensus with bounded local refinement.
   * Every proposal is projected to the supplied-calibration essential manifold
   * before scoring. The first bounded proposals with at least eight calibrated
   * inliers receive local refinement before comparison with the current winner; a
   * raw score cannot bound the result of local optimization. Final re-estimation
   * invalidates an older sampling target; any larger target resumes proposals
   * within the same total trial budget.
   */
  export function fitEpipolarConsensus(firstPoints: Parameters<IAutoMovieRecoveryEpipolarConsensusFittingOperation.Operation>[0], secondPoints: Parameters<IAutoMovieRecoveryEpipolarConsensusFittingOperation.Operation>[1], first: Parameters<IAutoMovieRecoveryEpipolarConsensusFittingOperation.Operation>[2], second: Parameters<IAutoMovieRecoveryEpipolarConsensusFittingOperation.Operation>[3], policy: Parameters<IAutoMovieRecoveryEpipolarConsensusFittingOperation.Operation>[4], budget: Parameters<IAutoMovieRecoveryEpipolarConsensusFittingOperation.Operation>[5], checkpoint: Parameters<IAutoMovieRecoveryEpipolarConsensusFittingOperation.Operation>[6]): ReturnType<IAutoMovieRecoveryEpipolarConsensusFittingOperation.Operation> {
    return fitRecoveryEpipolarConsensusImplementation(firstPoints, secondPoints, first, second, policy, budget, checkpoint);
  }

  /**
   * Search a planar explanation of the final fixed epipolar-inlier population.
   * Four-point homographies compete with symmetric pixel transfer. Absence of a
   * dominant model requires the conditional trial target for the forbidden
   * overlap fraction, not the much weaker best homography's own support ratio. A
   * found forbidden overlap is sufficient refusal evidence and ends the search.
   */
  export function fitHomographyConsensus(first: Parameters<IAutoMovieRecoveryHomographyConsensusFittingOperation.Operation>[0], second: Parameters<IAutoMovieRecoveryHomographyConsensusFittingOperation.Operation>[1], policy: Parameters<IAutoMovieRecoveryHomographyConsensusFittingOperation.Operation>[2], budget: Parameters<IAutoMovieRecoveryHomographyConsensusFittingOperation.Operation>[3], checkpoint: Parameters<IAutoMovieRecoveryHomographyConsensusFittingOperation.Operation>[4]): ReturnType<IAutoMovieRecoveryHomographyConsensusFittingOperation.Operation> {
    return fitRecoveryHomographyConsensusImplementation(first, second, policy, budget, checkpoint);
  }

  /**
   * Robustly register one calibrated image against distinct existing landmarks.
   * Six unique-index samples initialize nonplanar DLT poses before pixel scoring;
   * eligible proposals receive bounded local refinement in draw order. Final
   * support must stabilize and satisfy its recomputed conditional trial target.
   * onProposal runs exactly once before each six-point draw; checkpoint also runs
   * around refinement and therefore does not count proposals. Optional diagnostic
   * events snapshot actual intermediate results outside the numerical catches;
   * observer errors propagate and no event history is retained.
   */
  export function fitResectionConsensus(points: Parameters<IAutoMovieRecoveryResectionConsensusFittingOperation.Operation>[0], pixels: Parameters<IAutoMovieRecoveryResectionConsensusFittingOperation.Operation>[1], intrinsic: Parameters<IAutoMovieRecoveryResectionConsensusFittingOperation.Operation>[2], inverse: Parameters<IAutoMovieRecoveryResectionConsensusFittingOperation.Operation>[3], policy: Parameters<IAutoMovieRecoveryResectionConsensusFittingOperation.Operation>[4], budget: Parameters<IAutoMovieRecoveryResectionConsensusFittingOperation.Operation>[5], checkpoint: Parameters<IAutoMovieRecoveryResectionConsensusFittingOperation.Operation>[6], onProposal?: Parameters<IAutoMovieRecoveryResectionConsensusFittingOperation.Operation>[7], onTrace?: Parameters<IAutoMovieRecoveryResectionConsensusFittingOperation.Operation>[8]): ReturnType<IAutoMovieRecoveryResectionConsensusFittingOperation.Operation> {
    return fitRecoveryResectionConsensusImplementation(points, pixels, intrinsic, inverse, policy, budget, checkpoint, onProposal, onTrace);
  }

  /**
   * Initialize a calibrated nonplanar resection from at least six 3D/pixel pairs.
   * Isotropic centroid/RMS normalization in both charts conditions the original
   * 2N-by-12 DLT. The proper rotation is projected from its calibrated block,
   * then that same rotation reverses world centering in the translation. This
   * preserves origin/unit covariance even when the noisy block is not rigid. This
   * nonminimal initializer does not support planar or rank-unresolved designs.
   * The DLT/nonplanar distinction is described by OpenCV's official solvePnP
   * guide: https://docs.opencv.org/4.x/d5/d1f/calib3d_solvePnP.html An optional
   * fresh caller-owned trace receives computed stage evidence only; diagnostic
   * projective or pre-gate rigid coefficients never imply acceptance.
   */
  export function fitResectionDesign(points: readonly (readonly [number, number, number])[], pixels: readonly (readonly [number, number])[], inverse: readonly number[], policy: IAutoMovieRecoveryCameraMapPolicy, budget: IAutoMovieRecoveryCameraMapBudget, trace?: IAutoMovieRecoveryResectionDesignTrace): IAutoMovieRecoveryResectionDesign {
    return fitRecoveryResectionDesignImplementation(points, pixels, inverse, policy, budget, trace);
  }

  /**
   * Refine one camera against a fixed existing 3D landmark population. Supplied
   * intrinsics and noisy triangulated points remain fixed, so this is a
   * conditional estimate before joint refinement. Soft-L1 weights use a complete
   * two-coordinate residual norm, with analytic SO3/additive-t derivatives.
   */
  export function refineResection(initial: Parameters<IAutoMovieRecoveryResectionRefinementOperation.Operation>[0], points: Parameters<IAutoMovieRecoveryResectionRefinementOperation.Operation>[1], pixels: Parameters<IAutoMovieRecoveryResectionRefinementOperation.Operation>[2], intrinsic: Parameters<IAutoMovieRecoveryResectionRefinementOperation.Operation>[3], policy: Parameters<IAutoMovieRecoveryResectionRefinementOperation.Operation>[4], budget: Parameters<IAutoMovieRecoveryResectionRefinementOperation.Operation>[5], checkpoint: Parameters<IAutoMovieRecoveryResectionRefinementOperation.Operation>[6]): ReturnType<IAutoMovieRecoveryResectionRefinementOperation.Operation> {
    return refineRecoveryResectionImplementation(initial, points, pixels, intrinsic, policy, budget, checkpoint);
  }

  /**
   * Bounded local calibrated-pose least squares on a fixed correspondence subset.
   * Soft-L1 loss has caller-supplied pixel scale. A column-scaled original
   * Jacobian is rank-checked before a damped augmented least-squares step is
   * solved by SVD; damping cannot repair an unobservable local parameter
   * direction. Accepted steps update SO3 and the unit translation sphere.
   * Termination is local only.
   */
  export function refineCameraPose(initial: Parameters<IAutoMovieRecoveryCameraPoseRefinementOperation.Operation>[0], firstPoints: Parameters<IAutoMovieRecoveryCameraPoseRefinementOperation.Operation>[1], secondPoints: Parameters<IAutoMovieRecoveryCameraPoseRefinementOperation.Operation>[2], first: Parameters<IAutoMovieRecoveryCameraPoseRefinementOperation.Operation>[3], second: Parameters<IAutoMovieRecoveryCameraPoseRefinementOperation.Operation>[4], policy: Parameters<IAutoMovieRecoveryCameraPoseRefinementOperation.Operation>[5]): ReturnType<IAutoMovieRecoveryCameraPoseRefinementOperation.Operation> {
    return refineRecoveryCameraPoseImplementation(initial, firstPoints, secondPoints, first, second, policy);
  }
}
