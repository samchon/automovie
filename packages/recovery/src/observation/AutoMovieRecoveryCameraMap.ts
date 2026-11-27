import { admitRecoveryMapCurvature as admitRecoveryMapCurvatureImplementation } from "./internal/admitRecoveryMapCurvature";
import { assembleRecoveryMapCurvature as assembleRecoveryMapCurvatureImplementation } from "./internal/assembleRecoveryMapCurvature";
import { assertRecoverySceneLinearRetention as assertRecoverySceneLinearRetentionImplementation } from "./internal/assertRecoverySceneLinearRetention";
import { createRecoveryFeasibleDiagnostics as createRecoveryFeasibleDiagnosticsImplementation } from "./internal/createRecoveryFeasibleDiagnostics";
import { createRecoveryFeasibleSqpArc as createRecoveryFeasibleSqpArcImplementation } from "./internal/createRecoveryFeasibleSqpArc";
import { createRecoveryMapMetric as createRecoveryMapMetricImplementation } from "./internal/createRecoveryMapMetric";
import { createRecoveryMapTriangularMetric as createRecoveryMapTriangularMetricImplementation } from "./internal/createRecoveryMapTriangularMetric";
import { describeRecoverySceneRegistration as describeRecoverySceneRegistrationImplementation } from "./internal/describeRecoverySceneRegistration";
import { differentiateRecoveryMapProjection as differentiateRecoveryMapProjectionImplementation } from "./internal/differentiateRecoveryMapProjection";
import { factorRecoveryMapCurvature as factorRecoveryMapCurvatureImplementation } from "./internal/factorRecoveryMapCurvature";
import { factorRecoveryMapDesign as factorRecoveryMapDesignImplementation } from "./internal/factorRecoveryMapDesign";
import { isRecoveryMapIdentityGauge as isRecoveryMapIdentityGaugeImplementation } from "./internal/isRecoveryMapIdentityGauge";
import { measureRecoveryFeasibleArithmetic as measureRecoveryFeasibleArithmeticImplementation } from "./internal/measureRecoveryFeasibleArithmetic";
import { predictRecoveryMapDecrease as predictRecoveryMapDecreaseImplementation } from "./internal/predictRecoveryMapDecrease";
import { prepareRecoveryCheckpointReportCapacity as prepareRecoveryCheckpointReportCapacityImplementation } from "./internal/prepareRecoveryCheckpointReportCapacity";
import { prepareRecoveryFeasibleMapReporting as prepareRecoveryFeasibleMapReportingImplementation } from "./internal/prepareRecoveryFeasibleMapReporting";
import { prepareRecoveryFeasibleMapWork as prepareRecoveryFeasibleMapWorkImplementation } from "./internal/prepareRecoveryFeasibleMapWork";
import { prepareRecoveryFeasibleReportCapacity as prepareRecoveryFeasibleReportCapacityImplementation } from "./internal/prepareRecoveryFeasibleReportCapacity";
import { prepareRecoveryMapJointBlocks as prepareRecoveryMapJointBlocksImplementation } from "./internal/prepareRecoveryMapJointBlocks";
import { prepareRecoverySceneFeasibleRouting as prepareRecoverySceneFeasibleRoutingImplementation } from "./internal/prepareRecoverySceneFeasibleRouting";
import { prepareRecoverySceneReportCapacity as prepareRecoverySceneReportCapacityImplementation } from "./internal/prepareRecoverySceneReportCapacity";
import { stepRecoveryMapPose as stepRecoveryMapPoseImplementation } from "./internal/stepRecoveryMapPose";
import { stepRecoveryMapSeedPose as stepRecoveryMapSeedPoseImplementation } from "./internal/stepRecoveryMapSeedPose";
import { updateRecoveryRegularization as updateRecoveryRegularizationImplementation } from "./internal/updateRecoveryRegularization";

import { mixRecoveryFeasibleSqpStep as mixRecoveryFeasibleSqpStepImplementation } from "./internal/mixRecoveryFeasibleSqpStep";

import { collectRecoverySceneSupport as collectRecoverySceneSupportImplementation } from "./internal/collectRecoverySceneSupport";
import { completeRecoverySceneCheckpoint as completeRecoverySceneCheckpointImplementation } from "./internal/completeRecoverySceneCheckpoint";
import { createRecoverySceneSeedReportObserver as createRecoverySceneSeedReportObserverImplementation } from "./internal/createRecoverySceneSeedReportObserver";
import { evaluateRecoveryScenePoint as evaluateRecoveryScenePointImplementation } from "./internal/evaluateRecoveryScenePoint";
import { growRecoverySceneLandmarks as growRecoverySceneLandmarksImplementation } from "./internal/growRecoverySceneLandmarks";
import { factorRecoveryMapMetric as factorRecoveryMapMetricImplementation } from "./internal/factorRecoveryMapMetric";

import { type IAutoMovieRecoveryCameraMapAdmissionOperation, type IAutoMovieRecoveryCameraPairAdmissionOperation, type IAutoMovieRecoveryCameraSceneAdmissionOperation, type IAutoMovieRecoveryCameraChartCreationOperation, type IAutoMovieRecoveryCameraEstimateCreationOperation, type IAutoMovieRecoveryCameraMapCreationOperation, type IAutoMovieRecoveryCameraSceneCreationOperation, type IAutoMovieRecoveryImageDirectionSolverCreationOperation, type IAutoMovieRecoveryPoseModelCreationOperation, type IAutoMovieRecoveryFeasibleMapLinearization, type IAutoMovieRecoveryMapState, type IAutoMovieRecoveryCameraMapPolicy, type IAutoMovieRecoveryPoseResidualsLinearizeOperation, type IAutoMovieRecoveryMapPointProjectionOperation, type IAutoMovieRecoveryCameraMapRefinementOperation, type IAutoMovieRecoveryMapJointResult, type IAutoMovieRecoveryMapPose, type IAutoMovieRecoveryMapLandmark, type IAutoMovieRecoveryCameraMapBudget, type IAutoMovieRecoveryFeasibleJointOptions, type IAutoMovieRecoveryFeasibleReportCapacity, type IAutoMovieRecoveryMapDesignSolutionOperation, type IAutoMovieRecoveryMapJointStepSolutionOperation, type IAutoMovieRecoveryRelativePoseStepOperation, type IAutoMovieRecoverySceneSupportCollectionOperation, type IAutoMovieRecoverySceneCheckpointCompletionOperation, type IAutoMovieRecoverySceneSeedReportObserverCreationOperation, type IAutoMovieRecoveryScenePointEvaluationOperation, type IAutoMovieRecoverySceneLandmarksGrowthOperation, type IAutoMovieRecoveryMapMetricFit, type IAutoMovieRecoveryMapJointBlock, type IAutoMovieRecoveryFeasibleSqpStepMixingOperation, type IAutoMovieRecoveryCurvatureAdmission, type IAutoMovieRecoveryMapCurvatureBlocks, type IAutoMovieRecoveryUntiltedEstimate, type IAutoMovieRecoveryMapMetricScales, type IAutoMovieRecoveryCameraSceneBudget, type IAutoMovieRecoveryFeasibleDiagnostics, type IAutoMovieRecoveryFeasibleFit, type IAutoMovieRecoverySqpArc, type IAutoMovieRecoveryFeasibleModel, type IAutoMovieRecoverySqpOptions, type IAutoMovieRecoveryMapMetric, type IAutoMovieRecoveryMapTriangularMetric, type IAutoMovieRecoverySceneRegistration, type IAutoMovieRecoveryCameraSceneEstimate, type IAutoMovieRecoverySceneCandidate, type IAutoMovieRecoveryMapLocalCurvature, type IAutoMovieRecoveryMapCurvatureFit, type IAutoMovieSimplexAtom, type IAutoMovieRecoveryMapDesignFactor, type IAutoMovieRecoveryFeasibleArithmetic, type IAutoMovieSimplexMinimum, type IAutoMovieRecoveryCheckpointReporting, type IAutoMovieRecoverySceneWork, type IAutoMovieRecoveryFeasibleMapReporting, type IAutoMovieRecoveryFeasibleMapWork, type IAutoMovieRecoveryMapJointPreparation, type IAutoMovieRecoverySceneFeasibleRouting, type IAutoMovieRecoveryRegularizationUpdate } from "@automovie/interface";
import { admitRecoveryCameraMap as admitRecoveryCameraMapImplementation } from "./internal/admitRecoveryCameraMap";
import { admitRecoveryCameraPair as admitRecoveryCameraPairImplementation } from "./internal/admitRecoveryCameraPair";
import { admitRecoveryCameraScene as admitRecoveryCameraSceneImplementation } from "./internal/admitRecoveryCameraScene";
import { createRecoveryCameraChart as createRecoveryCameraChartImplementation } from "./internal/createRecoveryCameraChart";
import { createRecoveryCameraEstimate as createRecoveryCameraEstimateImplementation } from "./internal/createRecoveryCameraEstimate";
import { createRecoveryCameraMap as createRecoveryCameraMapImplementation } from "./internal/createRecoveryCameraMap";
import { createRecoveryCameraScene as createRecoveryCameraSceneImplementation } from "./internal/createRecoveryCameraScene";
import { createRecoveryImageDirectionSolver as createRecoveryImageDirectionSolverImplementation } from "./internal/createRecoveryImageDirectionSolver";
import { createRecoveryPoseModel as createRecoveryPoseModelImplementation } from "./internal/createRecoveryPoseModel";
import { linearizeRecoveryFeasibleMap as linearizeRecoveryFeasibleMapImplementation } from "./internal/linearizeRecoveryFeasibleMap";
import { linearizeRecoveryPoseResiduals as linearizeRecoveryPoseResidualsImplementation } from "./internal/linearizeRecoveryPoseResiduals";
import { projectRecoveryMapPoint as projectRecoveryMapPointImplementation } from "./internal/projectRecoveryMapPoint";
import { refineRecoveryCameraMap as refineRecoveryCameraMapImplementation } from "./internal/refineRecoveryCameraMap";
import { refineRecoveryCameraMapFeasible as refineRecoveryCameraMapFeasibleImplementation } from "./internal/refineRecoveryCameraMapFeasible";
import { solveRecoveryMapDesign as solveRecoveryMapDesignImplementation } from "./internal/solveRecoveryMapDesign";
import { solveRecoveryMapJointStep as solveRecoveryMapJointStepImplementation } from "./internal/solveRecoveryMapJointStep";
import { stepRecoveryRelativePose as stepRecoveryRelativePoseImplementation } from "./internal/stepRecoveryRelativePose";

/** Public operations for Auto Movie Recovery Camera Map. */
export namespace AutoMovieRecoveryCameraMap {
  /**
   * Prepare the three-view map's supplied charts before image allocation. The
   * seed pair is prepared as a pair, and the third view's chart with the map's
   * aggregate pixel ceiling, without fitting a pair; the ceiling then bounds all
   * three views. The declared policy and budgets remain caller assertions.
   */
  export function admitCameraMap(input: Parameters<IAutoMovieRecoveryCameraMapAdmissionOperation.Operation>[0]): ReturnType<IAutoMovieRecoveryCameraMapAdmissionOperation.Operation> {
    return admitRecoveryCameraMapImplementation(input);
  }

  /**
   * Prepare the resident pair before any image-sized allocation: the caller's
   * pixel budget bounds its two views, and their supplied pixel charts are
   * constructed once for the later numerical phases. Calibration, provenance,
   * rigidity and the declared policy and budget remain caller assertions.
   */
  export function admitCameraPair(input: Parameters<IAutoMovieRecoveryCameraPairAdmissionOperation.Operation>[0]): ReturnType<IAutoMovieRecoveryCameraPairAdmissionOperation.Operation> {
    return admitRecoveryCameraPairImplementation(input);
  }

  /**
   * Prepare a bounded calibrated image set's supplied charts before observing any
   * raster: the first three views as the seed map, each later view's chart under
   * the scene's aggregate pixel ceiling, and the caller's view and pixel budgets
   * bounding the whole set. The declared policy and budgets remain caller
   * assertions.
   */
  export function admitCameraScene(input: Parameters<IAutoMovieRecoveryCameraSceneAdmissionOperation.Operation>[0]): ReturnType<IAutoMovieRecoveryCameraSceneAdmissionOperation.Operation> {
    return admitRecoveryCameraSceneImplementation(input);
  }

  /**
   * Build a supplied pinhole K and its analytic inverse in the resident pixel
   * chart. Check pixel-step round trips before any correspondence is normalized.
   * A large principal offset may destroy pixel differences even when each scalar
   * is finite. Such a chart refuses rather than being recentered with unknown
   * provenance.
   */
  export function createCameraChart(view: Parameters<IAutoMovieRecoveryCameraChartCreationOperation.Operation>[0]): ReturnType<IAutoMovieRecoveryCameraChartCreationOperation.Operation> {
    return createRecoveryCameraChartImplementation(view);
  }

  /**
   * Qualify completed automatic observations and assemble owned camera evidence.
   * Every independent final gate runs when its required observations exist. A
   * completed observation artifact may refuse its camera; only a candidate
   * passing all gates exposes a relative transform. No shape reconstruction is
   * performed.
   */
  export function createCameraEstimate(input: Parameters<IAutoMovieRecoveryCameraEstimateCreationOperation.Operation>[0], features: Parameters<IAutoMovieRecoveryCameraEstimateCreationOperation.Operation>[1], matches: Parameters<IAutoMovieRecoveryCameraEstimateCreationOperation.Operation>[2], charts: Parameters<IAutoMovieRecoveryCameraEstimateCreationOperation.Operation>[3], checkpoint: Parameters<IAutoMovieRecoveryCameraEstimateCreationOperation.Operation>[4]): ReturnType<IAutoMovieRecoveryCameraEstimateCreationOperation.Operation> {
    return createRecoveryCameraEstimateImplementation(input, features, matches, charts, checkpoint);
  }

  /**
   * Build one conditional three-camera map from automatic shared observations.
   * Only qualified seed pairs create 3D points. Third-image observations cannot
   * influence those points before resection, preventing circular registration.
   * Joint fitting subsequently uses only seed observations and resection
   * inliers.
   */
  export function createCameraMap(input: Parameters<IAutoMovieRecoveryCameraMapCreationOperation.Operation>[0], features: Parameters<IAutoMovieRecoveryCameraMapCreationOperation.Operation>[1], charts: Parameters<IAutoMovieRecoveryCameraMapCreationOperation.Operation>[2], pairs: Parameters<IAutoMovieRecoveryCameraMapCreationOperation.Operation>[3], descriptorComparisons: Parameters<IAutoMovieRecoveryCameraMapCreationOperation.Operation>[4], checkpoint: Parameters<IAutoMovieRecoveryCameraMapCreationOperation.Operation>[5]): ReturnType<IAutoMovieRecoveryCameraMapCreationOperation.Operation> {
    return createRecoveryCameraMapImplementation(input, features, charts, pairs, descriptorComparisons, checkpoint);
  }

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
  export function createCameraScene(input: Parameters<IAutoMovieRecoveryCameraSceneCreationOperation.Operation>[0], features: Parameters<IAutoMovieRecoveryCameraSceneCreationOperation.Operation>[1], charts: Parameters<IAutoMovieRecoveryCameraSceneCreationOperation.Operation>[2], pairs: Parameters<IAutoMovieRecoveryCameraSceneCreationOperation.Operation>[3], descriptorComparisons: Parameters<IAutoMovieRecoveryCameraSceneCreationOperation.Operation>[4], checkpoint: Parameters<IAutoMovieRecoveryCameraSceneCreationOperation.Operation>[5], feasible?: Parameters<IAutoMovieRecoveryCameraSceneCreationOperation.Operation>[6]): ReturnType<IAutoMovieRecoveryCameraSceneCreationOperation.Operation> {
    return createRecoveryCameraSceneImplementation(input, features, charts, pairs, descriptorComparisons, checkpoint, feasible);
  }

  /**
   * Factor a two-column camera-direction design without normal equations.
   * Reorthogonalized modified Gram-Schmidt supplies the small QR factors; the two
   * singular values of R give the same direction rank as the original design.
   * Their ratio is a binary64 diagnostic under the supplied numeric threshold,
   * not a certified interval bound or uncertainty distribution.
   */
  export function createImageDirectionSolver(directions: Parameters<IAutoMovieRecoveryImageDirectionSolverCreationOperation.Operation>[0], minimumRatio: Parameters<IAutoMovieRecoveryImageDirectionSolverCreationOperation.Operation>[1]): ReturnType<IAutoMovieRecoveryImageDirectionSolverCreationOperation.Operation> {
    return createRecoveryImageDirectionSolverImplementation(directions, minimumRatio);
  }

  /**
   * Pixel epipolar model and its five local calibrated-pose derivatives. Rotation
   * increments act on the left in radians; translation increments use two raw
   * directions of the admitted near-unit translation. The complete signed Sampson
   * quotient cancels the positive translation-normalization scale, so its
   * derivative uses these raw directions even when DN(t)B differs from B. No
   * camera covariance or global optimum follows.
   */
  export function createPoseModel(pose: Parameters<IAutoMovieRecoveryPoseModelCreationOperation.Operation>[0], first: Parameters<IAutoMovieRecoveryPoseModelCreationOperation.Operation>[1], second: Parameters<IAutoMovieRecoveryPoseModelCreationOperation.Operation>[2]): ReturnType<IAutoMovieRecoveryPoseModelCreationOperation.Operation> {
    return createRecoveryPoseModelImplementation(pose, first, second);
  }

  /**
   * Linearize the unchanged robust objective and every unweighted pixel disk.
   * Physical camera coordinates precede three coordinates for each landmark.
   * Constraint g=norm(residual)^2/maximumError^2-1 is dimensionless and smooth
   * even at zero residual; the objective remains in original squared pixels.
   */
  export function linearizeFeasibleMap(state: IAutoMovieRecoveryMapState, intrinsics: readonly (readonly number[])[], policy: IAutoMovieRecoveryCameraMapPolicy): IAutoMovieRecoveryFeasibleMapLinearization {
    return linearizeRecoveryFeasibleMapImplementation(state, intrinsics, policy);
  }

  /**
   * Signed pixel Sampson residuals and analytic five-coordinate local Jacobian.
   * With e=x2-transpose F x1 and d the joint epipolar-normal norm, each
   * derivative is de/d - (e/d)_sum((line/d)_(derivativeLine/d)). This
   * differentiates both the incidence and its pixel normalization; zero/undefined
   * lines refuse the fit.
   */
  export function linearizePoseResiduals(model: Parameters<IAutoMovieRecoveryPoseResidualsLinearizeOperation.Operation>[0], first: Parameters<IAutoMovieRecoveryPoseResidualsLinearizeOperation.Operation>[1], second: Parameters<IAutoMovieRecoveryPoseResidualsLinearizeOperation.Operation>[2]): ReturnType<IAutoMovieRecoveryPoseResidualsLinearizeOperation.Operation> {
    return linearizeRecoveryPoseResidualsImplementation(model, first, second);
  }

  /**
   * Project a finite world point and differentiate the calibrated pixel chart.
   * Rotation increments act on R alone on the left, while t has an independent
   * additive camera-frame increment. Point derivatives are in world coordinates.
   * Nonpositive depth has no supported projection and returns null.
   */
  export function projectMapPoint(pose: Parameters<IAutoMovieRecoveryMapPointProjectionOperation.Operation>[0], point: Parameters<IAutoMovieRecoveryMapPointProjectionOperation.Operation>[1], intrinsic: Parameters<IAutoMovieRecoveryMapPointProjectionOperation.Operation>[2]): ReturnType<IAutoMovieRecoveryMapPointProjectionOperation.Operation> {
    return projectRecoveryMapPointImplementation(pose, point, intrinsic);
  }

  /**
   * Jointly refine calibrated cameras and registered landmarks in one gauge. The
   * first pose must be identity at the origin and stays fixed; the seed
   * translation retains its admitted near-unit current radius, and all later
   * translations have three unrestricted coordinates. Fixed landmark observations
   * retain the same robust objective throughout every trial. Internal feasible
   * options select the separately bounded hard-pixel method; ordinary calls
   * retain this unconstrained local optimizer.
   */
  export function refineCameraMap(initialPoses: Parameters<IAutoMovieRecoveryCameraMapRefinementOperation.Operation>[0], initialLandmarks: Parameters<IAutoMovieRecoveryCameraMapRefinementOperation.Operation>[1], intrinsics: Parameters<IAutoMovieRecoveryCameraMapRefinementOperation.Operation>[2], policy: Parameters<IAutoMovieRecoveryCameraMapRefinementOperation.Operation>[3], budget: Parameters<IAutoMovieRecoveryCameraMapRefinementOperation.Operation>[4], checkpoint: Parameters<IAutoMovieRecoveryCameraMapRefinementOperation.Operation>[5], charge?: Parameters<IAutoMovieRecoveryCameraMapRefinementOperation.Operation>[6], feasible?: Parameters<IAutoMovieRecoveryCameraMapRefinementOperation.Operation>[7], reportCapacity?: Parameters<IAutoMovieRecoveryCameraMapRefinementOperation.Operation>[8]): ReturnType<IAutoMovieRecoveryCameraMapRefinementOperation.Operation> {
    return refineRecoveryCameraMapImplementation(initialPoses, initialLandmarks, intrinsics, policy, budget, checkpoint, charge, feasible, reportCapacity);
  }

  /**
   * Refine a fixed camera map while retaining every hard pixel observation. This
   * internal opt-in method uses the same robust objective, seven-freedom gauge,
   * independent original ranks and actual point qualification. Pixel KKT is
   * claimed only while nonpixel gates remain strictly interior; other gate
   * blockage is incomplete, and the coordinator still owns atomic acceptance.
   * Current-radius models prepay512 extra chart visits and each seed trial256; 64
   * separate numerical slots cover raw/differentiated chart scratch.
   */
  export function refineCameraMapFeasible(initialPoses: readonly IAutoMovieRecoveryMapPose[], initialLandmarks: readonly IAutoMovieRecoveryMapLandmark[], intrinsics: readonly (readonly number[])[], policy: IAutoMovieRecoveryCameraMapPolicy, budget: IAutoMovieRecoveryCameraMapBudget, options: IAutoMovieRecoveryFeasibleJointOptions, checkpoint: () => void, charge: (work: number) => void, reportCapacity?: IAutoMovieRecoveryFeasibleReportCapacity): IAutoMovieRecoveryMapJointResult {
    return refineRecoveryCameraMapFeasibleImplementation(initialPoses, initialLandmarks, intrinsics, policy, budget, options, checkpoint, charge, reportCapacity);
  }

  /**
   * Solve a column-scaled original least-squares design with optional damping.
   * Independent undamped rank is checked first; damping controls a step and never
   * supplies evidence of local observability. The right side is minus residual.
   */
  export function solveMapDesign(design: Parameters<IAutoMovieRecoveryMapDesignSolutionOperation.Operation>[0], right: Parameters<IAutoMovieRecoveryMapDesignSolutionOperation.Operation>[1], minimumRatio: Parameters<IAutoMovieRecoveryMapDesignSolutionOperation.Operation>[2], damping: Parameters<IAutoMovieRecoveryMapDesignSolutionOperation.Operation>[3], budget: Parameters<IAutoMovieRecoveryMapDesignSolutionOperation.Operation>[4]): ReturnType<IAutoMovieRecoveryMapDesignSolutionOperation.Operation> {
    return solveRecoveryMapDesignImplementation(design, right, minimumRatio, damping, budget);
  }

  /**
   * Eliminate independent landmark coordinates from an original bundle design.
   * Point-local Givens QR retains the caller's gauge-fixed camera columns. This
   * is orthogonal variable elimination, avoiding the squared conditioning of a
   * normal-matrix Schur complement. Optional metric retention exposes
   * inverse/transpose actions from the same damped arrowhead design; the caller
   * separately admits and charges its factor.
   */
  export function solveMapJointStep(blocks: Parameters<IAutoMovieRecoveryMapJointStepSolutionOperation.Operation>[0], minimumRatio: Parameters<IAutoMovieRecoveryMapJointStepSolutionOperation.Operation>[1], damping: Parameters<IAutoMovieRecoveryMapJointStepSolutionOperation.Operation>[2], budget: Parameters<IAutoMovieRecoveryMapJointStepSolutionOperation.Operation>[3], retainMetric?: Parameters<IAutoMovieRecoveryMapJointStepSolutionOperation.Operation>[4]): ReturnType<IAutoMovieRecoveryMapJointStepSolutionOperation.Operation> {
    return solveRecoveryMapJointStepImplementation(blocks, minimumRatio, damping, budget, retainMetric);
  }

  /**
   * Apply a five-coordinate local step while retaining a rotation and unit t. The
   * first three coordinates are a left rotation vector in radians; the final two
   * are coordinates in the supplied current translation tangent basis.
   */
  export function stepRelativePose(pose: Parameters<IAutoMovieRecoveryRelativePoseStepOperation.Operation>[0], tangent: Parameters<IAutoMovieRecoveryRelativePoseStepOperation.Operation>[1], step: Parameters<IAutoMovieRecoveryRelativePoseStepOperation.Operation>[2]): ReturnType<IAutoMovieRecoveryRelativePoseStepOperation.Operation> {
    return stepRecoveryRelativePoseImplementation(pose, tangent, step);
  }

  /**
   * Collect each target's distinct existing-map support once per accepted
   * revision.
   */
  export function collectSceneSupport(landmarks: Parameters<IAutoMovieRecoverySceneSupportCollectionOperation.Operation>[0], tracks: Parameters<IAutoMovieRecoverySceneSupportCollectionOperation.Operation>[1], viewCount: Parameters<IAutoMovieRecoverySceneSupportCollectionOperation.Operation>[2]): ReturnType<IAutoMovieRecoverySceneSupportCollectionOperation.Operation> {
    return collectRecoverySceneSupportImplementation(landmarks, tracks, viewCount);
  }

  /**
   * Complete a detached scene transaction through growth and full joint geometry.
   * After each fit, newly admissible points/measurements cause another fit. Only
   * strict finite population growth repeats; every fit and linear action is
   * charged. Failure leaves committing or retaining the old checkpoint to caller.
   * An optional observer receives owned complete compact states before and after
   * each joint fit. Observer errors propagate, and ordinary calls retain no
   * trace.
   */
  export function completeSceneCheckpoint(initialPoses: Parameters<IAutoMovieRecoverySceneCheckpointCompletionOperation.Operation>[0], initialLandmarks: Parameters<IAutoMovieRecoverySceneCheckpointCompletionOperation.Operation>[1], tracks: Parameters<IAutoMovieRecoverySceneCheckpointCompletionOperation.Operation>[2], charts: Parameters<IAutoMovieRecoverySceneCheckpointCompletionOperation.Operation>[3], policy: Parameters<IAutoMovieRecoverySceneCheckpointCompletionOperation.Operation>[4], budget: Parameters<IAutoMovieRecoverySceneCheckpointCompletionOperation.Operation>[5], work: Parameters<IAutoMovieRecoverySceneCheckpointCompletionOperation.Operation>[6], checkpoint: Parameters<IAutoMovieRecoverySceneCheckpointCompletionOperation.Operation>[7], onProposal?: Parameters<IAutoMovieRecoverySceneCheckpointCompletionOperation.Operation>[8], onTrace?: Parameters<IAutoMovieRecoverySceneCheckpointCompletionOperation.Operation>[9], feasible?: Parameters<IAutoMovieRecoverySceneCheckpointCompletionOperation.Operation>[10], reportCapacity?: Parameters<IAutoMovieRecoverySceneCheckpointCompletionOperation.Operation>[11]): ReturnType<IAutoMovieRecoverySceneCheckpointCompletionOperation.Operation> {
    return completeRecoverySceneCheckpointImplementation(initialPoses, initialLandmarks, tracks, charts, policy, budget, work, checkpoint, onProposal, onTrace, feasible, reportCapacity);
  }

  /**
   * Preserve the last completed initial joint report until seed qualification.
   * Completion calls this observer before and after each fit; a later before call
   * carries the preceding report and is distinguished by phase, not nullness. The
   * private target transfers diagnostics only when the seed is refused.
   */
  export function createSceneSeedReportObserver(target: Parameters<IAutoMovieRecoverySceneSeedReportObserverCreationOperation.Operation>[0], work: Parameters<IAutoMovieRecoverySceneSeedReportObserverCreationOperation.Operation>[1], budget: Parameters<IAutoMovieRecoverySceneSeedReportObserverCreationOperation.Operation>[2]): ReturnType<IAutoMovieRecoverySceneSeedReportObserverCreationOperation.Operation> {
    return createRecoverySceneSeedReportObserverImplementation(target, work, budget);
  }

  /**
   * Qualify one point against its actual retained registered measurements. At
   * least one observed camera pair must supply an acute ray angle above the point
   * threshold. A point need not be visible in either original seed image.
   */
  export function evaluateScenePoint(point: Parameters<IAutoMovieRecoveryScenePointEvaluationOperation.Operation>[0], observations: Parameters<IAutoMovieRecoveryScenePointEvaluationOperation.Operation>[1], poses: Parameters<IAutoMovieRecoveryScenePointEvaluationOperation.Operation>[2], charts: Parameters<IAutoMovieRecoveryScenePointEvaluationOperation.Operation>[3], policy: Parameters<IAutoMovieRecoveryScenePointEvaluationOperation.Operation>[4], observe?: Parameters<IAutoMovieRecoveryScenePointEvaluationOperation.Operation>[5]): ReturnType<IAutoMovieRecoveryScenePointEvaluationOperation.Operation> {
    return evaluateRecoveryScenePointImplementation(point, observations, poses, charts, policy, observe);
  }

  /**
   * Propose point and measurement growth using only currently registered poses.
   * Existing points receive only individually positive-depth pixel-qualified
   * measurements; new points must pass every available registered observation.
   */
  export function growSceneLandmarks(tracks: Parameters<IAutoMovieRecoverySceneLandmarksGrowthOperation.Operation>[0], initial: Parameters<IAutoMovieRecoverySceneLandmarksGrowthOperation.Operation>[1], poses: Parameters<IAutoMovieRecoverySceneLandmarksGrowthOperation.Operation>[2], charts: Parameters<IAutoMovieRecoverySceneLandmarksGrowthOperation.Operation>[3], policy: Parameters<IAutoMovieRecoverySceneLandmarksGrowthOperation.Operation>[4], budget: Parameters<IAutoMovieRecoverySceneLandmarksGrowthOperation.Operation>[5], work: Parameters<IAutoMovieRecoverySceneLandmarksGrowthOperation.Operation>[6], checkpoint: Parameters<IAutoMovieRecoverySceneLandmarksGrowthOperation.Operation>[7]): ReturnType<IAutoMovieRecoverySceneLandmarksGrowthOperation.Operation> {
    return growRecoverySceneLandmarksImplementation(tracks, initial, poses, charts, policy, budget, work, checkpoint);
  }

  /**
   * Build only the original-rank-qualified raw metric a feasible model uses. This
   * operation does not request an unconstrained LS answer or scaled gradient.
   */
  export function factorMapMetric(blocks: readonly IAutoMovieRecoveryMapJointBlock[], minimumRatio: number, damping: number, budget: IAutoMovieRecoveryCameraMapBudget): IAutoMovieRecoveryMapMetricFit {
    return factorRecoveryMapMetricImplementation(blocks, minimumRatio, damping, budget);
  }

  /**
   * Try nominal physical mixing, then one original-row-supported coefficient. The
   * numerical branch is not the ideal cubic-rate mixture. Its operation- scaled
   * margin chooses a new vector, never an allowance on that vector's rows.
   */
  export function mixFeasibleSqpStep(rows: Parameters<IAutoMovieRecoveryFeasibleSqpStepMixingOperation.Operation>[0], sqp: Parameters<IAutoMovieRecoveryFeasibleSqpStepMixingOperation.Operation>[1], tilted: Parameters<IAutoMovieRecoveryFeasibleSqpStepMixingOperation.Operation>[2], nominal: Parameters<IAutoMovieRecoveryFeasibleSqpStepMixingOperation.Operation>[3]): ReturnType<IAutoMovieRecoveryFeasibleSqpStepMixingOperation.Operation> {
    return mixRecoveryFeasibleSqpStepImplementation(rows, sqp, tilted, nominal);
  }

  /** Admit requested curvature bookkeeping and conservative simultaneous buffers. */
  export function admitMapCurvature(cameraWidth: number, points: number, observations: number, baseRetained: number, maxResidentEntries: number, maxLinearEntries: number, charge: (work: number) => void): IAutoMovieRecoveryCurvatureAdmission {
    return admitRecoveryMapCurvatureImplementation(cameraWidth, points, observations, baseRetained, maxResidentEntries, maxLinearEntries, charge);
  }

  /** Assemble lagged fixed-dual local curvature in original-design scaled units. */
  export function assembleMapCurvature(state: IAutoMovieRecoveryMapState, intrinsics: readonly (readonly number[])[], policy: IAutoMovieRecoveryCameraMapPolicy, seed: IAutoMovieRecoveryUntiltedEstimate, scales: IAutoMovieRecoveryMapMetricScales, damping: number): IAutoMovieRecoveryMapCurvatureBlocks | null {
    return assembleRecoveryMapCurvatureImplementation(state, intrinsics, policy, seed, scales, damping);
  }

  /**
   * Check logical numerical retention before incremental designs are allocated.
   * The shared joint bound covers copied blocks, reduced factors and landmarks; a
   * caller adds transient point or resection factors retained during growth.
   * These scalar slots exclude JS overhead and the separately bounded seed fit.
   */
  export function assertSceneLinearRetention(budget: IAutoMovieRecoveryCameraSceneBudget, cameras: number, observations: number, landmarks: number, transientEntries?: number): void {
    assertRecoverySceneLinearRetentionImplementation(budget, cameras, observations, landmarks, transientEntries);
  }

  /**
   * Project the completed generic fit's fixed diagnostics into JSON-safe values.
   * Shared camera counts/costs and existing adaptive/curvature reports stay with
   * their original owner. No geometry or raw numeric input is mutated.
   */
  export function createFeasibleDiagnostics(fit: IAutoMovieRecoveryFeasibleFit<unknown>): IAutoMovieRecoveryFeasibleDiagnostics {
    return createRecoveryFeasibleDiagnosticsImplementation(fit);
  }

  /**
   * Try a complete affine-QP direction and one same-base curvature correction.
   * Positive baseline weights only propose a working set. Every original affine
   * row and physical quadratic stationarity still qualify the untilted step. The
   * mixture is not the pure tilted-QP minimizer or a nonlinear certificate.
   */
  export function createFeasibleSqpArc(model: IAutoMovieRecoveryFeasibleModel, weights: readonly number[], tilted: readonly number[], tolerance: number, options: IAutoMovieRecoverySqpOptions, charge: (work: number) => void): IAutoMovieRecoverySqpArc {
    return createRecoveryFeasibleSqpArcImplementation(model, weights, tilted, tolerance, options, charge);
  }

  /**
   * Retain the upper arrowhead of a consistently scaled point-first bundle QR.
   * Physical vectors list camera coordinates before the three coordinates per
   * landmark; elimination internally orders points first. The solve and covector
   * multiplication actions use the same original global column scales.
   */
  export function createMapMetric(triangles: readonly (readonly (readonly number[])[])[], reduced: readonly (readonly number[])[], pointScales: readonly (readonly number[])[], cameraScales: readonly number[], budget: IAutoMovieRecoveryCameraMapBudget): IAutoMovieRecoveryMapMetric {
    return createRecoveryMapMetricImplementation(triangles, reduced, pointScales, cameraScales, budget);
  }

  /** Bind one point-first upper factor and original column scales to its actions. */
  export function createMapTriangularMetric(triangles: readonly (readonly (readonly number[])[])[], camera: readonly (readonly number[])[], pointScales: readonly (readonly number[])[], cameraScales: readonly number[]): IAutoMovieRecoveryMapTriangularMetric {
    return createRecoveryMapTriangularMetricImplementation(triangles, camera, pointScales, cameraScales);
  }

  /** Describe all requested views against the final accepted component revision. */
  export function describeSceneRegistration(result: IAutoMovieRecoveryCameraSceneEstimate, support: readonly (readonly IAutoMovieRecoverySceneCandidate[])[]): IAutoMovieRecoverySceneRegistration[] {
    return describeRecoverySceneRegistrationImplementation(result, support);
  }

  /**
   * Differentiate the map's current-radius pinhole chart at current pixels. A
   * null tangent denotes six ordinary camera coordinates; an empty tangent
   * denotes the fixed camera, and two directions denote the seed sphere chart.
   */
  export function differentiateMapProjection(pose: IAutoMovieRecoveryMapPose, point: readonly [number, number, number], intrinsic: readonly number[], tangent: readonly (readonly [number, number, number])[] | null): IAutoMovieRecoveryMapLocalCurvature | null {
    return differentiateRecoveryMapProjectionImplementation(pose, point, intrinsic, tangent);
  }

  /** Factor one owned scaled arrowhead and preflight all fixed physical rows. */
  export function factorMapCurvature(blocks: IAutoMovieRecoveryMapCurvatureBlocks, cameraScales: readonly number[], pointScales: readonly (readonly number[])[], physicalRows: readonly IAutoMovieSimplexAtom[]): IAutoMovieRecoveryMapCurvatureFit {
    return factorRecoveryMapCurvatureImplementation(blocks, cameraScales, pointScales, physicalRows);
  }

  /** Qualify the original column-normalized design without synthesizing an answer. */
  export function factorMapDesign(design: readonly (readonly number[])[], right: readonly number[], minimumRatio: number, budget: IAutoMovieRecoveryCameraMapBudget): IAutoMovieRecoveryMapDesignFactor {
    return factorRecoveryMapDesignImplementation(design, right, minimumRatio, budget);
  }

  /** Check the original exact first-pose identity gauge with indexed coefficients. */
  export function isMapIdentityGauge(pose: IAutoMovieRecoveryMapPose): boolean {
    return isRecoveryMapIdentityGaugeImplementation(pose);
  }

  /**
   * Bound stored-dual reconstruction separately from actual returned-row error.
   * Stored Float64 inputs are exact here. Sequential multiply/add uses gamma(2m),
   * with an absolute subnormal term, before exact normalization by the weight
   * sum. All positive bounds and minimum-price endpoints are rounded outward.
   */
  export function measureFeasibleArithmetic(rows: readonly IAutoMovieSimplexAtom[], solution: IAutoMovieSimplexMinimum): IAutoMovieRecoveryFeasibleArithmetic {
    return measureRecoveryFeasibleArithmeticImplementation(rows, solution);
  }

  /**
   * Apply the current undamped weighted original design to an actual increment.
   * Camera coordinates precede three coordinates for each landmark. The gradient
   * and blocks use the same current vector soft-L1 weights and physical chart.
   */
  export function predictMapDecrease(blocks: readonly IAutoMovieRecoveryMapJointBlock[], gradient: readonly number[], increment: readonly number[]): number | null {
    return predictRecoveryMapDecreaseImplementation(blocks, gradient, increment);
  }

  /** Acquire a direct checkpoint's report scope after its active-index check. */
  export function prepareCheckpointReportCapacity(pose: IAutoMovieRecoveryMapPose, budget: IAutoMovieRecoveryCameraSceneBudget, options: IAutoMovieRecoveryFeasibleJointOptions, work: IAutoMovieRecoverySceneWork): IAutoMovieRecoveryCheckpointReporting {
    return prepareRecoveryCheckpointReportCapacityImplementation(pose, budget, options, work);
  }

  /** Admit original map work, then prepay its complete fixed diagnostic transfer. */
  export function prepareFeasibleMapReporting(poses: readonly IAutoMovieRecoveryMapPose[], landmarks: readonly IAutoMovieRecoveryMapLandmark[], intrinsics: readonly (readonly number[])[], budget: IAutoMovieRecoveryCameraMapBudget, options: IAutoMovieRecoveryFeasibleJointOptions, charge: (work: number) => void, capacity?: IAutoMovieRecoveryFeasibleReportCapacity): IAutoMovieRecoveryFeasibleMapReporting {
    return prepareRecoveryFeasibleMapReportingImplementation(poses, landmarks, intrinsics, budget, options, charge, capacity);
  }

  /** Admit fixed-population map work and its separately bounded chart scratch. */
  export function prepareFeasibleMapWork(initialPoses: readonly IAutoMovieRecoveryMapPose[], initialLandmarks: readonly IAutoMovieRecoveryMapLandmark[], intrinsics: readonly (readonly number[])[], budget: IAutoMovieRecoveryCameraMapBudget, options: IAutoMovieRecoveryFeasibleJointOptions, charge: (work: number) => void): IAutoMovieRecoveryFeasibleMapWork {
    return prepareRecoveryFeasibleMapWorkImplementation(initialPoses, initialLandmarks, intrinsics, budget, options, charge);
  }

  /** Partition one reporting scope before growth or joint scratch is formed. */
  export function prepareFeasibleReportCapacity(sceneEntries: number, fitEntries: number, persistedReports: number): IAutoMovieRecoveryFeasibleReportCapacity {
    return prepareRecoveryFeasibleReportCapacityImplementation(sceneEntries, fitEntries, persistedReports);
  }

  /** Prepare original point qualification and one current scaled block design. */
  export function prepareMapJointBlocks(blocks: readonly IAutoMovieRecoveryMapJointBlock[], minimumRatio: number, budget: IAutoMovieRecoveryCameraMapBudget, measureGradient: boolean): IAutoMovieRecoveryMapJointPreparation {
    return prepareRecoveryMapJointBlocksImplementation(blocks, minimumRatio, budget, measureGradient);
  }

  /** Own one explicit scene method request before any user checkpoint. */
  export function prepareSceneFeasibleRouting(budget: IAutoMovieRecoveryCameraSceneBudget, options: IAutoMovieRecoveryFeasibleJointOptions, work: IAutoMovieRecoverySceneWork): IAutoMovieRecoverySceneFeasibleRouting {
    return prepareRecoverySceneFeasibleRoutingImplementation(budget, options, work);
  }

  /** Acquire scene diagnostic retention inside the existing seed transaction try. */
  export function prepareSceneReportCapacity(routing: IAutoMovieRecoverySceneFeasibleRouting, work: IAutoMovieRecoverySceneWork): void {
    prepareRecoverySceneReportCapacityImplementation(routing, work);
  }

  /** Apply an independent left SO3 and additive translation resection step. */
  export function stepMapPose(pose: IAutoMovieRecoveryMapPose, step: readonly number[]): IAutoMovieRecoveryMapPose {
    return stepRecoveryMapPoseImplementation(pose, step);
  }

  /**
   * Apply the map seed's left rotation and current-radius sphere chart. Its raw
   * translation coefficients define r*normalize(t+Bz), with r=norm(t) held
   * constant at this base. Initial poses and points are not rescaled.
   */
  export function stepMapSeedPose(pose: IAutoMovieRecoveryMapPose, tangent: readonly (readonly [number, number, number])[], step: readonly number[]): IAutoMovieRecoveryMapPose {
    return stepRecoveryMapSeedPoseImplementation(pose, tangent, step);
  }

  /**
   * React to one selected increment using its undamped computed agreement. The
   * multiplier is the unclamped reciprocal accepted-radius rule from Ceres
   * levenberg_marquardt_strategy.cc, blob
   * 9e25466e61e0cc6a2c1136131c48c841bd365fcc, lines162-168. Radius caps, diagonal
   * clamps and rejected-step rules are absent. Source:
   * https://ceres-solver.googlesource.com/ceres-solver/+/master/internal/ceres/levenberg_marquardt_strategy.cc
   * This rule alone supplies no standard LM or constrained convergence theorem.
   */
  export function updateRegularization(damping: number, actualDecrease: number, predictedDecrease: number | null): IAutoMovieRecoveryRegularizationUpdate {
    return updateRecoveryRegularizationImplementation(damping, actualDecrease, predictedDecrease);
  }
}
