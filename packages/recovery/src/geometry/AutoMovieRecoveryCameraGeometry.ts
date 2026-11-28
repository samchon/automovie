import { triangulateRecoveryCameraPoint as triangulateRecoveryCameraPointImplementation } from "./internal/triangulateRecoveryCameraPoint";

import { normalizeRecoveryImagePoints as normalizeRecoveryImagePointsImplementation } from "./internal/normalizeRecoveryImagePoints";

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

import { type IAutoMovieRecoveryCameraResidualsScoreOperation, type IAutoMovieRecoveryEpipolarErrorsMeasurementOperation, type IAutoMovieRecoveryEpipolarMatrixFittingOperation, type IAutoMovieRecoveryHomographyErrorsMeasurementOperation, type IAutoMovieRecoveryHomographyFittingOperation, type IAutoMovieRecoveryEpipolarModelRefinementOperation, type IAutoMovieRecoveryCameraPoseSelectionOperation, type IAutoMovieRecoveryEpipolarMatrixCalibrateOperation, type IAutoMovieRecoveryEpipolarConsensusFittingOperation, type IAutoMovieRecoveryHomographyConsensusFittingOperation, type IAutoMovieRecoveryResectionConsensusFittingOperation, type IAutoMovieRecoveryResectionDesign, type IAutoMovieRecoveryCameraMapPolicy, type IAutoMovieRecoveryCameraMapBudget, type IAutoMovieRecoveryResectionDesignTrace, type IAutoMovieRecoveryResectionRefinementOperation, type IAutoMovieRecoveryCameraPoseRefinementOperation, type IAutoMovieRecoveryImagePointsNormalizationOperation, type IAutoMovieRecoveryCameraPointTriangulationOperation } from "@automovie/interface";

import { fitRecoveryEpipolarMatrix as fitRecoveryEpipolarMatrixInternal } from "./internal/fitRecoveryEpipolarMatrix";
import { fitRecoveryHomography as fitRecoveryHomographyInternal } from "./internal/fitRecoveryHomography";
import { measureRecoveryEpipolarErrors as measureRecoveryEpipolarErrorsInternal } from "./internal/measureRecoveryEpipolarErrors";
import { measureRecoveryHomographyErrors as measureRecoveryHomographyErrorsInternal } from "./internal/measureRecoveryHomographyErrors";
import { scoreRecoveryCameraResiduals as scoreRecoveryCameraResidualsInternal } from "./internal/scoreRecoveryCameraResiduals";

/** Public camera-model fitting and residual measurement operations. */
export namespace AutoMovieRecoveryCameraGeometry {
  /**
   * Fit a normalized algebraic fundamental matrix from at least eight paired
   * image points in pixel-centre coordinates. Return a rank-two row-major
   * matrix and the original normalized design ratio. Mismatched pairs,
   * unresolved rank and nonrepresentable scale throw.
   */
  export function fitEpipolarMatrix(
    ...args: Parameters<IAutoMovieRecoveryEpipolarMatrixFittingOperation.Operation>
  ): ReturnType<IAutoMovieRecoveryEpipolarMatrixFittingOperation.Operation> {
    return fitRecoveryEpipolarMatrixInternal(...args);
  }

  /**
   * Fit a normalized homography from at least four paired pixel-centre
   * observations. Return its forward and inverse row-major matrices and
   * original-design singular ratio. Mismatched pairs, degenerate design and an
   * unresolved inverse throw.
   */
  export function fitHomography(
    ...args: Parameters<IAutoMovieRecoveryHomographyFittingOperation.Operation>
  ): ReturnType<IAutoMovieRecoveryHomographyFittingOperation.Operation> {
    return fitRecoveryHomographyInternal(...args);
  }

  /**
   * Measure signed Sampson residual and mean two-sided point-to-line distance
   * in pixels for each pair of observations. The result keeps input order. A
   * missing or unrepresentable line or residual returns null. Mismatched
   * observations and algebra shape failures throw.
   */
  export function measureEpipolarErrors(
    ...args: Parameters<IAutoMovieRecoveryEpipolarErrorsMeasurementOperation.Operation>
  ): ReturnType<IAutoMovieRecoveryEpipolarErrorsMeasurementOperation.Operation> {
    return measureRecoveryEpipolarErrorsInternal(...args);
  }

  /**
   * Measure the RMS of forward and backward pixel transfer distances for
   * corresponding observations. Each result uses the original pair's index. An
   * undefined projective transfer returns null. Different point counts throw.
   */
  export function measureHomographyErrors(
    ...args: Parameters<IAutoMovieRecoveryHomographyErrorsMeasurementOperation.Operation>
  ): ReturnType<IAutoMovieRecoveryHomographyErrorsMeasurementOperation.Operation> {
    return measureRecoveryHomographyErrorsInternal(...args);
  }

  /**
   * Keep finite residuals whose magnitude is at most the supplied positive
   * finite pixel threshold. Return their original indices, median and 90th
   * percentile. Empty support has null quantiles. An invalid threshold throws.
   */
  export function scoreCameraResiduals(
    ...args: Parameters<IAutoMovieRecoveryCameraResidualsScoreOperation.Operation>
  ): ReturnType<IAutoMovieRecoveryCameraResidualsScoreOperation.Operation> {
    return scoreRecoveryCameraResidualsInternal(...args);
  }

  /**
   * Return the conditional RANSAC trial count for a uniform unique-index
   * sample at confidence strictly between zero and one. Supply safe integer
   * population, inlier and sample counts. A full-inlier population may need
   * one trial. Impossible support or an unrepresentable count returns
   * infinity.
   */
  export function requiredCameraTrials(population: number, inliers: number, sampleSize: number, confidence: number): number {
    return requiredRecoveryCameraTrialsImplementation(population, inliers, sampleSize, confidence);
  }

  /**
   * Refine a calibrated epipolar candidate under its pixel support policy. Run
   * at most three fixed-inlier refits. Report qualified convergence only after
   * the inlier population stabilizes and its local fit terminates.
   */
  export function refineEpipolarModel(matrix: Parameters<IAutoMovieRecoveryEpipolarModelRefinementOperation.Operation>[0], initialScore: Parameters<IAutoMovieRecoveryEpipolarModelRefinementOperation.Operation>[1], firstPoints: Parameters<IAutoMovieRecoveryEpipolarModelRefinementOperation.Operation>[2], secondPoints: Parameters<IAutoMovieRecoveryEpipolarModelRefinementOperation.Operation>[3], first: Parameters<IAutoMovieRecoveryEpipolarModelRefinementOperation.Operation>[4], second: Parameters<IAutoMovieRecoveryEpipolarModelRefinementOperation.Operation>[5], policy: Parameters<IAutoMovieRecoveryEpipolarModelRefinementOperation.Operation>[6], budget: Parameters<IAutoMovieRecoveryEpipolarModelRefinementOperation.Operation>[7]): ReturnType<IAutoMovieRecoveryEpipolarModelRefinementOperation.Operation> {
    return refineRecoveryEpipolarModelImplementation(matrix, initialScore, firstPoints, secondPoints, first, second, policy, budget);
  }

  /**
   * Draw a reproducible ordered subset without replacement from a discrete
   * population. Supply its positive size, a supported sample size, a 32-bit
   * unsigned seed, an integer model domain and a nonnegative integer trial
   * identity. Malformed sample identities throw.
   */
  export function sampleCameraIndices(population: number, sampleSize: number, seed: number, domain: number, trial: number): number[] {
    return sampleRecoveryCameraIndicesImplementation(population, sampleSize, seed, domain, trial);
  }

  /**
   * Evaluate all four calibrated relative-pose branches on the same nonempty
   * image correspondence set. Return the branch with most positive-depth
   * points, its support and parallax in radians. Equal highest counts leave an
   * explicit ambiguity. Empty or mismatched pairs throw.
   */
  export function selectCameraPose(fundamental: Parameters<IAutoMovieRecoveryCameraPoseSelectionOperation.Operation>[0], firstPoints: Parameters<IAutoMovieRecoveryCameraPoseSelectionOperation.Operation>[1], secondPoints: Parameters<IAutoMovieRecoveryCameraPoseSelectionOperation.Operation>[2], first: Parameters<IAutoMovieRecoveryCameraPoseSelectionOperation.Operation>[3], second: Parameters<IAutoMovieRecoveryCameraPoseSelectionOperation.Operation>[4], minimumDesignRatio: Parameters<IAutoMovieRecoveryCameraPoseSelectionOperation.Operation>[5], maxSweeps: Parameters<IAutoMovieRecoveryCameraPoseSelectionOperation.Operation>[6]): ReturnType<IAutoMovieRecoveryCameraPoseSelectionOperation.Operation> {
    return selectRecoveryCameraPoseImplementation(fundamental, firstPoints, secondPoints, first, second, minimumDesignRatio, maxSweeps);
  }

  /**
   * Project a pixel fundamental matrix onto the essential manifold of the
   * supplied pinhole charts. Return the pixel-space projection and four
   * relative poses from the first camera to the second. Translations use a
   * unit baseline. Unresolved singular directions throw.
   */
  export function calibrateEpipolarMatrix(fundamental: Parameters<IAutoMovieRecoveryEpipolarMatrixCalibrateOperation.Operation>[0], first: Parameters<IAutoMovieRecoveryEpipolarMatrixCalibrateOperation.Operation>[1], second: Parameters<IAutoMovieRecoveryEpipolarMatrixCalibrateOperation.Operation>[2], maxSweeps: Parameters<IAutoMovieRecoveryEpipolarMatrixCalibrateOperation.Operation>[3]): ReturnType<IAutoMovieRecoveryEpipolarMatrixCalibrateOperation.Operation> {
    return calibrateRecoveryEpipolarMatrixImplementation(fundamental, first, second, maxSweeps);
  }

  /**
   * Fit calibrated epipolar support from at least eight tentative pixel pairs
   * under the supplied calibrated charts, trial limits and pixel gate. Report
   * finite support, numerical refusals and whether the conditional trial
   * target was met. The result remains conditional on the observations.
   */
  export function fitEpipolarConsensus(firstPoints: Parameters<IAutoMovieRecoveryEpipolarConsensusFittingOperation.Operation>[0], secondPoints: Parameters<IAutoMovieRecoveryEpipolarConsensusFittingOperation.Operation>[1], first: Parameters<IAutoMovieRecoveryEpipolarConsensusFittingOperation.Operation>[2], second: Parameters<IAutoMovieRecoveryEpipolarConsensusFittingOperation.Operation>[3], policy: Parameters<IAutoMovieRecoveryEpipolarConsensusFittingOperation.Operation>[4], budget: Parameters<IAutoMovieRecoveryEpipolarConsensusFittingOperation.Operation>[5], checkpoint: Parameters<IAutoMovieRecoveryEpipolarConsensusFittingOperation.Operation>[6]): ReturnType<IAutoMovieRecoveryEpipolarConsensusFittingOperation.Operation> {
    return fitRecoveryEpipolarConsensusImplementation(firstPoints, secondPoints, first, second, policy, budget, checkpoint);
  }

  /**
   * Test a homography explanation over the existing epipolar inlier
   * population. Transfer residuals use pixels. Report whether the forbidden
   * overlap was found and whether search met its conditional trial target. At
   * least four paired observations are required.
   */
  export function fitHomographyConsensus(first: Parameters<IAutoMovieRecoveryHomographyConsensusFittingOperation.Operation>[0], second: Parameters<IAutoMovieRecoveryHomographyConsensusFittingOperation.Operation>[1], policy: Parameters<IAutoMovieRecoveryHomographyConsensusFittingOperation.Operation>[2], budget: Parameters<IAutoMovieRecoveryHomographyConsensusFittingOperation.Operation>[3], checkpoint: Parameters<IAutoMovieRecoveryHomographyConsensusFittingOperation.Operation>[4]): ReturnType<IAutoMovieRecoveryHomographyConsensusFittingOperation.Operation> {
    return fitRecoveryHomographyConsensusImplementation(first, second, policy, budget, checkpoint);
  }

  /**
   * Register one calibrated view against distinct existing landmarks in their
   * map gauge. Pixel residuals use the supplied threshold and intrinsics.
   * Return a candidate pose and reasons if the support, local fit or
   * conditional trial target fails. The optional proposal observer runs once
   * per draw; observer exceptions propagate.
   */
  export function fitResectionConsensus(points: Parameters<IAutoMovieRecoveryResectionConsensusFittingOperation.Operation>[0], pixels: Parameters<IAutoMovieRecoveryResectionConsensusFittingOperation.Operation>[1], intrinsic: Parameters<IAutoMovieRecoveryResectionConsensusFittingOperation.Operation>[2], inverse: Parameters<IAutoMovieRecoveryResectionConsensusFittingOperation.Operation>[3], policy: Parameters<IAutoMovieRecoveryResectionConsensusFittingOperation.Operation>[4], budget: Parameters<IAutoMovieRecoveryResectionConsensusFittingOperation.Operation>[5], checkpoint: Parameters<IAutoMovieRecoveryResectionConsensusFittingOperation.Operation>[6], onProposal?: Parameters<IAutoMovieRecoveryResectionConsensusFittingOperation.Operation>[7], onTrace?: Parameters<IAutoMovieRecoveryResectionConsensusFittingOperation.Operation>[8]): ReturnType<IAutoMovieRecoveryResectionConsensusFittingOperation.Operation> {
    return fitRecoveryResectionConsensusImplementation(points, pixels, intrinsic, inverse, policy, budget, checkpoint, onProposal, onTrace);
  }

  /**
   * Initialize a calibrated camera from at least six nonplanar world points
   * and paired pixel observations. The pose uses the supplied world gauge. An
   * optional trace receives completed normalization and factorization
   * evidence. Planar or unresolved designs throw.
   */
  export function fitResectionDesign(points: readonly (readonly [number, number, number])[], pixels: readonly (readonly [number, number])[], inverse: readonly number[], policy: IAutoMovieRecoveryCameraMapPolicy, budget: IAutoMovieRecoveryCameraMapBudget, trace?: IAutoMovieRecoveryResectionDesignTrace): IAutoMovieRecoveryResectionDesign {
    return fitRecoveryResectionDesignImplementation(points, pixels, inverse, policy, budget, trace);
  }

  /**
   * Refine one calibrated camera against fixed world landmarks and paired
   * pixel observations. Angular increments are in radians and translation is
   * additive in the map gauge. Use the supplied pixel-error scales and work
   * limits. Invalid inputs or a nonpositive initial depth throw.
   */
  export function refineResection(initial: Parameters<IAutoMovieRecoveryResectionRefinementOperation.Operation>[0], points: Parameters<IAutoMovieRecoveryResectionRefinementOperation.Operation>[1], pixels: Parameters<IAutoMovieRecoveryResectionRefinementOperation.Operation>[2], intrinsic: Parameters<IAutoMovieRecoveryResectionRefinementOperation.Operation>[3], policy: Parameters<IAutoMovieRecoveryResectionRefinementOperation.Operation>[4], budget: Parameters<IAutoMovieRecoveryResectionRefinementOperation.Operation>[5], checkpoint: Parameters<IAutoMovieRecoveryResectionRefinementOperation.Operation>[6]): ReturnType<IAutoMovieRecoveryResectionRefinementOperation.Operation> {
    return refineRecoveryResectionImplementation(initial, points, pixels, intrinsic, policy, budget, checkpoint);
  }

  /**
   * Refine one calibrated relative pose on an unchanged paired pixel subset.
   * The soft-L1 scale uses pixels, rotation increments use radians, and
   * translation stays on the unit sphere. Return the accepted local pose and
   * termination. Unresolved original rank or invalid chart data throws.
   */
  export function refineCameraPose(initial: Parameters<IAutoMovieRecoveryCameraPoseRefinementOperation.Operation>[0], firstPoints: Parameters<IAutoMovieRecoveryCameraPoseRefinementOperation.Operation>[1], secondPoints: Parameters<IAutoMovieRecoveryCameraPoseRefinementOperation.Operation>[2], first: Parameters<IAutoMovieRecoveryCameraPoseRefinementOperation.Operation>[3], second: Parameters<IAutoMovieRecoveryCameraPoseRefinementOperation.Operation>[4], policy: Parameters<IAutoMovieRecoveryCameraPoseRefinementOperation.Operation>[5]): ReturnType<IAutoMovieRecoveryCameraPoseRefinementOperation.Operation> {
    return refineRecoveryCameraPoseImplementation(initial, firstPoints, secondPoints, first, second, policy);
  }

  /**
   * Centre a nonempty pixel-point population and scale its mean Euclidean
   * distance to sqrt(2). Return normalized coordinates and a row-major
   * similarity transform. Coincident or unrepresentable charts throw.
   */
  export function normalizeImagePoints(points: Parameters<IAutoMovieRecoveryImagePointsNormalizationOperation.Operation>[0]): ReturnType<IAutoMovieRecoveryImagePointsNormalizationOperation.Operation> {
    return normalizeRecoveryImagePointsImplementation(points);
  }

  /**
   * Triangulate a calibrated observation pair in the first camera's
   * unit-baseline gauge. Return coordinates, depths, parallax in radians and
   * pixel reprojection error for a representable point. Finite points behind a
   * camera remain marked nonpositive. Unresolved rays, rank, homogeneous
   * weight or measured error return null.
   */
  export function triangulateCameraPoint(firstPoint: Parameters<IAutoMovieRecoveryCameraPointTriangulationOperation.Operation>[0], secondPoint: Parameters<IAutoMovieRecoveryCameraPointTriangulationOperation.Operation>[1], first: Parameters<IAutoMovieRecoveryCameraPointTriangulationOperation.Operation>[2], second: Parameters<IAutoMovieRecoveryCameraPointTriangulationOperation.Operation>[3], pose: Parameters<IAutoMovieRecoveryCameraPointTriangulationOperation.Operation>[4], minimumDesignRatio: Parameters<IAutoMovieRecoveryCameraPointTriangulationOperation.Operation>[5], maxSweeps: Parameters<IAutoMovieRecoveryCameraPointTriangulationOperation.Operation>[6]): ReturnType<IAutoMovieRecoveryCameraPointTriangulationOperation.Operation> {
    return triangulateRecoveryCameraPointImplementation(firstPoint, secondPoint, first, second, pose, minimumDesignRatio, maxSweeps);
  }
}
