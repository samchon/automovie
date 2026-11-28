import { chooseRecoverySqpTightening as chooseRecoverySqpTighteningImplementation } from "./internal/chooseRecoverySqpTightening";
import { copyRecoveryUntiltedEstimate as copyRecoveryUntiltedEstimateImplementation } from "./internal/copyRecoveryUntiltedEstimate";
import { createRecoveryMapTangent as createRecoveryMapTangentImplementation } from "./internal/createRecoveryMapTangent";
import { differentiateRecoveryMapTangent as differentiateRecoveryMapTangentImplementation } from "./internal/differentiateRecoveryMapTangent";
import { isRecoveryCameraNumericalRefusal as isRecoveryCameraNumericalRefusalImplementation } from "./internal/isRecoveryCameraNumericalRefusal";
import { solveRecoveryFeasibleDirection as solveRecoveryFeasibleDirectionImplementation } from "./internal/solveRecoveryFeasibleDirection";
import { validateRecoveryMapMetricRow as validateRecoveryMapMetricRowImplementation } from "./internal/validateRecoveryMapMetricRow";

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

import { type IAutoMovieRecoveryCameraMapAdmissionOperation, type IAutoMovieRecoveryCameraPairAdmissionOperation, type IAutoMovieRecoveryCameraSceneAdmissionOperation, type IAutoMovieRecoveryCameraChartCreationOperation, type IAutoMovieRecoveryCameraEstimateCreationOperation, type IAutoMovieRecoveryCameraMapCreationOperation, type IAutoMovieRecoveryCameraSceneCreationOperation, type IAutoMovieRecoveryImageDirectionSolverCreationOperation, type IAutoMovieRecoveryPoseModelCreationOperation, type IAutoMovieRecoveryFeasibleMapLinearization, type IAutoMovieRecoveryMapState, type IAutoMovieRecoveryCameraMapPolicy, type IAutoMovieRecoveryPoseResidualsLinearizeOperation, type IAutoMovieRecoveryMapPointProjectionOperation, type IAutoMovieRecoveryCameraMapRefinementOperation, type IAutoMovieRecoveryMapJointResult, type IAutoMovieRecoveryMapPose, type IAutoMovieRecoveryMapLandmark, type IAutoMovieRecoveryCameraMapBudget, type IAutoMovieRecoveryFeasibleJointOptions, type IAutoMovieRecoveryFeasibleReportCapacity, type IAutoMovieRecoveryMapDesignSolutionOperation, type IAutoMovieRecoveryMapJointStepSolutionOperation, type IAutoMovieRecoveryRelativePoseStepOperation, type IAutoMovieRecoverySceneSupportCollectionOperation, type IAutoMovieRecoverySceneCheckpointCompletionOperation, type IAutoMovieRecoverySceneSeedReportObserverCreationOperation, type IAutoMovieRecoveryScenePointEvaluationOperation, type IAutoMovieRecoverySceneLandmarksGrowthOperation, type IAutoMovieRecoveryMapMetricFit, type IAutoMovieRecoveryMapJointBlock, type IAutoMovieRecoveryFeasibleSqpStepMixingOperation, type IAutoMovieRecoveryCurvatureAdmission, type IAutoMovieRecoveryMapCurvatureBlocks, type IAutoMovieRecoveryUntiltedEstimate, type IAutoMovieRecoveryMapMetricScales, type IAutoMovieRecoveryCameraSceneBudget, type IAutoMovieRecoveryFeasibleDiagnostics, type IAutoMovieRecoveryFeasibleFit, type IAutoMovieRecoverySqpArc, type IAutoMovieRecoveryFeasibleModel, type IAutoMovieRecoverySqpOptions, type IAutoMovieRecoveryMapMetric, type IAutoMovieRecoveryMapTriangularMetric, type IAutoMovieRecoverySceneRegistration, type IAutoMovieRecoveryCameraSceneEstimate, type IAutoMovieRecoverySceneCandidate, type IAutoMovieRecoveryMapLocalCurvature, type IAutoMovieRecoveryMapCurvatureFit, type IAutoMovieSimplexAtom, type IAutoMovieRecoveryMapDesignFactor, type IAutoMovieRecoveryFeasibleArithmetic, type IAutoMovieSimplexMinimum, type IAutoMovieRecoveryCheckpointReporting, type IAutoMovieRecoverySceneWork, type IAutoMovieRecoveryFeasibleMapReporting, type IAutoMovieRecoveryFeasibleMapWork, type IAutoMovieRecoveryMapJointPreparation, type IAutoMovieRecoverySceneFeasibleRouting, type IAutoMovieRecoveryRegularizationUpdate, type IAutoMovieRecoverySqpTightening, type IAutoMovieRecoveryFeasibleDirection, type IAutoMovieRecoveryFeasibleStateRefinementOperation, type IAutoMovieRecoveryFeasibleProblem, type IAutoMovieRecoveryFeasibleTrialSelection, type IAutoMovieRecoveryFeasibleTrials, type IAutoMovieSimplexBudget } from "@automovie/interface";
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
import { refineRecoveryFeasibleState as refineFeasibleStateImplementation } from "./internal/refineRecoveryFeasibleState";
import { selectRecoveryFeasibleTrial as selectFeasibleTrialImplementation } from "./internal/selectRecoveryFeasibleTrial";
import { spendRecoverySceneWork as spendSceneWorkImplementation } from "./internal/spendRecoverySceneWork";
import { validateRecoveryMapMetricScales as validateMapMetricScalesImplementation } from "./internal/validateRecoveryMapMetricScales";

/** Public operations for Auto Movie Recovery Camera Map. */
export namespace AutoMovieRecoveryCameraMap {
  /**
   * Admit exactly three fixed RGB8 views with unique identities and supplied
   * corrected pinhole calibration. Return their charts in input order. Views
   * zero and one have a separate seed pixel cap within the aggregate cap.
   * Invalid view metadata, seed or map controls, or chart arithmetic throws
   * before extraction.
   */
  export function admitCameraMap(input: Parameters<IAutoMovieRecoveryCameraMapAdmissionOperation.Operation>[0]): ReturnType<IAutoMovieRecoveryCameraMapAdmissionOperation.Operation> {
    return admitRecoveryCameraMapImplementation(input);
  }

  /**
   * Admit exactly two fixed RGB8 views with unique identities under one
   * asserted scene. Return their row-major pinhole matrices and analytic
   * inverses in source order, with the total pixel count. Invalid provenance,
   * raster size, policy, budgets or chart arithmetic throws before extraction.
   */
  export function admitCameraPair(input: Parameters<IAutoMovieRecoveryCameraPairAdmissionOperation.Operation>[0]): ReturnType<IAutoMovieRecoveryCameraPairAdmissionOperation.Operation> {
    return admitRecoveryCameraPairImplementation(input);
  }

  /**
   * Admit at least three fixed RGB8 views within the scene's view cap, and
   * return supplied corrected pinhole charts in source order. Views zero and
   * one define the seed and have a separate pixel cap. Invalid view metadata,
   * controls, aggregate pixels or chart arithmetic throws before extraction.
   */
  export function admitCameraScene(input: Parameters<IAutoMovieRecoveryCameraSceneAdmissionOperation.Operation>[0]): ReturnType<IAutoMovieRecoveryCameraSceneAdmissionOperation.Operation> {
    return admitRecoveryCameraSceneImplementation(input);
  }

  /**
   * Construct row-major pinhole calibration and analytic inverse from admitted
   * focal lengths, skew and principal point in pixels. Integer coordinates
   * identify pixel centres. Nonpositive focal lengths or pixel increments lost
   * in the binary64 round trip throw.
   */
  export function createCameraChart(view: Parameters<IAutoMovieRecoveryCameraChartCreationOperation.Operation>[0]): ReturnType<IAutoMovieRecoveryCameraChartCreationOperation.Operation> {
    return createRecoveryCameraChartImplementation(view);
  }

  /**
   * Qualify the relative pose of two admitted calibrated views from their
   * tentative correspondences. The accepted record contains measured consensus
   * and a transform in the first camera's unit-baseline gauge. A refusal keeps
   * its reasons and measured observations. Progress callback errors propagate.
   */
  export function createCameraEstimate(input: Parameters<IAutoMovieRecoveryCameraEstimateCreationOperation.Operation>[0], features: Parameters<IAutoMovieRecoveryCameraEstimateCreationOperation.Operation>[1], matches: Parameters<IAutoMovieRecoveryCameraEstimateCreationOperation.Operation>[2], charts: Parameters<IAutoMovieRecoveryCameraEstimateCreationOperation.Operation>[3], checkpoint: Parameters<IAutoMovieRecoveryCameraEstimateCreationOperation.Operation>[4]): ReturnType<IAutoMovieRecoveryCameraEstimateCreationOperation.Operation> {
    return createRecoveryCameraEstimateImplementation(input, features, matches, charts, checkpoint);
  }

  /**
   * Initialize a sparse map from three admitted charts and their observed
   * feature pairs. Views zero and one provide the conditional unit-baseline
   * seed. Resection uses only seed-supported landmarks. Returns accepted,
   * seed-only or refused geometry with explicit reasons and fitting
   * diagnostics.
   */
  export function createCameraMap(input: Parameters<IAutoMovieRecoveryCameraMapCreationOperation.Operation>[0], features: Parameters<IAutoMovieRecoveryCameraMapCreationOperation.Operation>[1], charts: Parameters<IAutoMovieRecoveryCameraMapCreationOperation.Operation>[2], pairs: Parameters<IAutoMovieRecoveryCameraMapCreationOperation.Operation>[3], descriptorComparisons: Parameters<IAutoMovieRecoveryCameraMapCreationOperation.Operation>[4], checkpoint: Parameters<IAutoMovieRecoveryCameraMapCreationOperation.Operation>[5]): ReturnType<IAutoMovieRecoveryCameraMapCreationOperation.Operation> {
    return createRecoveryCameraMapImplementation(input, features, charts, pairs, descriptorComparisons, checkpoint);
  }

  /**
   * Grow one sparse component from globally linked calibrated observations.
   * Start with source views zero and one. Omit optional feasible settings to
   * use the default joint fitting route. Each accepted pose, point and
   * observation shares the unit seed-baseline gauge. Failed candidates retain
   * the prior component and report why growth stopped.
   */
  export function createCameraScene(input: Parameters<IAutoMovieRecoveryCameraSceneCreationOperation.Operation>[0], features: Parameters<IAutoMovieRecoveryCameraSceneCreationOperation.Operation>[1], charts: Parameters<IAutoMovieRecoveryCameraSceneCreationOperation.Operation>[2], pairs: Parameters<IAutoMovieRecoveryCameraSceneCreationOperation.Operation>[3], descriptorComparisons: Parameters<IAutoMovieRecoveryCameraSceneCreationOperation.Operation>[4], checkpoint: Parameters<IAutoMovieRecoveryCameraSceneCreationOperation.Operation>[5], feasible?: Parameters<IAutoMovieRecoveryCameraSceneCreationOperation.Operation>[6]): ReturnType<IAutoMovieRecoveryCameraSceneCreationOperation.Operation> {
    return createRecoveryCameraSceneImplementation(input, features, charts, pairs, descriptorComparisons, checkpoint, feasible);
  }

  /**
   * Factor two finite direction columns and return their singular-value ratio
   * and reusable least-squares solve. Supply the caller's admission ratio. A
   * weak direction system throws. Each solve takes one value per direction in
   * the original view order and returns two coordinate coefficients.
   */
  export function createImageDirectionSolver(directions: Parameters<IAutoMovieRecoveryImageDirectionSolverCreationOperation.Operation>[0], minimumRatio: Parameters<IAutoMovieRecoveryImageDirectionSolverCreationOperation.Operation>[1]): ReturnType<IAutoMovieRecoveryImageDirectionSolverCreationOperation.Operation> {
    return createRecoveryImageDirectionSolverImplementation(directions, minimumRatio);
  }

  /**
   * Build the pixel epipolar matrix and five local derivatives from a
   * near-unit two-view translation. Rotation acts on the left in radians. The
   * returned tangent basis gives the two dimensionless translation increments.
   * Unresolved or nonunit gauge throws.
   */
  export function createPoseModel(pose: Parameters<IAutoMovieRecoveryPoseModelCreationOperation.Operation>[0], first: Parameters<IAutoMovieRecoveryPoseModelCreationOperation.Operation>[1], second: Parameters<IAutoMovieRecoveryPoseModelCreationOperation.Operation>[2]): ReturnType<IAutoMovieRecoveryPoseModelCreationOperation.Operation> {
    return createRecoveryPoseModelImplementation(pose, first, second);
  }

  /**
   * Linearize the robust camera-map objective and each retained pixel-error
   * disk. Camera step coordinates precede three coordinates per landmark. The
   * objective uses squared pixels; the inequality and its offset are
   * dimensionless. A nonpositive point depth, unresolved seed tangent or an
   * already infeasible pixel observation throws.
   */
  export function linearizeFeasibleMap(state: IAutoMovieRecoveryMapState, intrinsics: readonly (readonly number[])[], policy: IAutoMovieRecoveryCameraMapPolicy): IAutoMovieRecoveryFeasibleMapLinearization {
    return linearizeRecoveryFeasibleMapImplementation(state, intrinsics, policy);
  }

  /**
   * Evaluate signed pixel Sampson residuals and their five-coordinate Jacobian
   * for ordered paired image points. Each row differentiates both epipolar
   * incidence and normal length. Mismatched pairs, an incompatible model or
   * undefined epipolar lines throw.
   */
  export function linearizePoseResiduals(model: Parameters<IAutoMovieRecoveryPoseResidualsLinearizeOperation.Operation>[0], first: Parameters<IAutoMovieRecoveryPoseResidualsLinearizeOperation.Operation>[1], second: Parameters<IAutoMovieRecoveryPoseResidualsLinearizeOperation.Operation>[2]): ReturnType<IAutoMovieRecoveryPoseResidualsLinearizeOperation.Operation> {
    return linearizeRecoveryPoseResidualsImplementation(model, first, second);
  }

  /**
   * Projects a world point and returns its calibrated pixel Jacobians.
   *
   * Supply the world-to-camera pose and row-major camera intrinsics. Columns
   * of the camera Jacobian describe left rotation in radians and additive
   * translation in the camera frame. Point columns describe world coordinates.
   * The result gives camera depth in the same units as the pose and point.
   * Nonpositive depth returns null. Unrepresentable arithmetic throws.
   */
  export function projectMapPoint(pose: Parameters<IAutoMovieRecoveryMapPointProjectionOperation.Operation>[0], point: Parameters<IAutoMovieRecoveryMapPointProjectionOperation.Operation>[1], intrinsic: Parameters<IAutoMovieRecoveryMapPointProjectionOperation.Operation>[2]): ReturnType<IAutoMovieRecoveryMapPointProjectionOperation.Operation> {
    return projectRecoveryMapPointImplementation(pose, point, intrinsic);
  }

  /**
   * Refine registered cameras and landmarks in one gauge using their fixed
   * pixel observations. The first pose must be identity. The seed translation
   * keeps its near-unit radius, and later translations are unrestricted. Omit
   * feasible options for robust local least squares. Explicit feasible options
   * select the hard-pixel route. Invalid population, gauge or resident limits
   * throw.
   */
  export function refineCameraMap(initialPoses: Parameters<IAutoMovieRecoveryCameraMapRefinementOperation.Operation>[0], initialLandmarks: Parameters<IAutoMovieRecoveryCameraMapRefinementOperation.Operation>[1], intrinsics: Parameters<IAutoMovieRecoveryCameraMapRefinementOperation.Operation>[2], policy: Parameters<IAutoMovieRecoveryCameraMapRefinementOperation.Operation>[3], budget: Parameters<IAutoMovieRecoveryCameraMapRefinementOperation.Operation>[4], checkpoint: Parameters<IAutoMovieRecoveryCameraMapRefinementOperation.Operation>[5], charge?: Parameters<IAutoMovieRecoveryCameraMapRefinementOperation.Operation>[6], feasible?: Parameters<IAutoMovieRecoveryCameraMapRefinementOperation.Operation>[7], reportCapacity?: Parameters<IAutoMovieRecoveryCameraMapRefinementOperation.Operation>[8]): ReturnType<IAutoMovieRecoveryCameraMapRefinementOperation.Operation> {
    return refineRecoveryCameraMapImplementation(initialPoses, initialLandmarks, intrinsics, policy, budget, checkpoint, charge, feasible, reportCapacity);
  }

  /**
   * Refine an admitted sparse map under hard pixel-error limits and the
   * original robust objective. The first camera stays fixed and the seed
   * translation keeps its current admitted radius. Report whether normal pixel
   * KKT is qualified and whether another geometry gate blocked the fit.
   * Request lagged Lagrangian curvature only with SQP acceleration. The caller
   * decides whether to commit the result.
   */
  export function refineCameraMapFeasible(initialPoses: readonly IAutoMovieRecoveryMapPose[], initialLandmarks: readonly IAutoMovieRecoveryMapLandmark[], intrinsics: readonly (readonly number[])[], policy: IAutoMovieRecoveryCameraMapPolicy, budget: IAutoMovieRecoveryCameraMapBudget, options: IAutoMovieRecoveryFeasibleJointOptions, checkpoint: () => void, charge: (work: number) => void, reportCapacity?: IAutoMovieRecoveryFeasibleReportCapacity): IAutoMovieRecoveryMapJointResult {
    return refineRecoveryCameraMapFeasibleImplementation(initialPoses, initialLandmarks, intrinsics, policy, budget, options, checkpoint, charge, reportCapacity);
  }

  /**
   * Solve the caller's original least-squares rows for one camera-coordinate
   * step. Supply minus residual as the right-hand side and a dimensionless
   * minimum design ratio. Damping acts in column-normalized coordinates.
   * Negative damping, unresolved original rank or a linear-budget overrun
   * throws.
   */
  export function solveMapDesign(design: Parameters<IAutoMovieRecoveryMapDesignSolutionOperation.Operation>[0], right: Parameters<IAutoMovieRecoveryMapDesignSolutionOperation.Operation>[1], minimumRatio: Parameters<IAutoMovieRecoveryMapDesignSolutionOperation.Operation>[2], damping: Parameters<IAutoMovieRecoveryMapDesignSolutionOperation.Operation>[3], budget: Parameters<IAutoMovieRecoveryMapDesignSolutionOperation.Operation>[4]): ReturnType<IAutoMovieRecoveryMapDesignSolutionOperation.Operation> {
    return solveRecoveryMapDesignImplementation(design, right, minimumRatio, damping, budget);
  }

  /**
   * Compute a joint camera and landmark step from bounded original-design
   * blocks. Supply fixed gauge camera columns and three point columns per
   * landmark. Damping is nonnegative and cannot admit an unobservable original
   * design. Request metric retention only when the caller has separately
   * admitted its storage.
   */
  export function solveMapJointStep(blocks: Parameters<IAutoMovieRecoveryMapJointStepSolutionOperation.Operation>[0], minimumRatio: Parameters<IAutoMovieRecoveryMapJointStepSolutionOperation.Operation>[1], damping: Parameters<IAutoMovieRecoveryMapJointStepSolutionOperation.Operation>[2], budget: Parameters<IAutoMovieRecoveryMapJointStepSolutionOperation.Operation>[3], retainMetric?: Parameters<IAutoMovieRecoveryMapJointStepSolutionOperation.Operation>[4]): ReturnType<IAutoMovieRecoveryMapJointStepSolutionOperation.Operation> {
    return solveRecoveryMapJointStepImplementation(blocks, minimumRatio, damping, budget, retainMetric);
  }

  /**
   * Applies a five-coordinate update to a relative pose.
   *
   * The first three coordinates are a left rotation vector in radians. The
   * last two move the translation along its supplied tangent basis. The result
   * owns a fresh row-major rotation and a unit translation. A wrong step or
   * basis count, or a collapsed translation, throws.
   */
  export function stepRelativePose(pose: Parameters<IAutoMovieRecoveryRelativePoseStepOperation.Operation>[0], tangent: Parameters<IAutoMovieRecoveryRelativePoseStepOperation.Operation>[1], step: Parameters<IAutoMovieRecoveryRelativePoseStepOperation.Operation>[2]): ReturnType<IAutoMovieRecoveryRelativePoseStepOperation.Operation> {
    return stepRecoveryRelativePoseImplementation(pose, tangent, step);
  }

  /**
   * Group current landmark support by target view for one accepted scene
   * revision. Each retained landmark needs its original linked track. Return
   * target pairs that refer back to the current landmark order; a missing
   * track throws.
   */
  export function collectSceneSupport(landmarks: Parameters<IAutoMovieRecoverySceneSupportCollectionOperation.Operation>[0], tracks: Parameters<IAutoMovieRecoverySceneSupportCollectionOperation.Operation>[1], viewCount: Parameters<IAutoMovieRecoverySceneSupportCollectionOperation.Operation>[2]): ReturnType<IAutoMovieRecoverySceneSupportCollectionOperation.Operation> {
    return collectRecoverySceneSupportImplementation(landmarks, tracks, viewCount);
  }

  /**
   * Complete a detached candidate scene seeded by active views zero and one.
   * Grow admissible points and measurements, then fit the entire retained
   * component in its fixed gauge. Progress and fit observers can abort by
   * throwing. Only a qualified result supplies the caller with a commit
   * candidate.
   */
  export function completeSceneCheckpoint(initialPoses: Parameters<IAutoMovieRecoverySceneCheckpointCompletionOperation.Operation>[0], initialLandmarks: Parameters<IAutoMovieRecoverySceneCheckpointCompletionOperation.Operation>[1], tracks: Parameters<IAutoMovieRecoverySceneCheckpointCompletionOperation.Operation>[2], charts: Parameters<IAutoMovieRecoverySceneCheckpointCompletionOperation.Operation>[3], policy: Parameters<IAutoMovieRecoverySceneCheckpointCompletionOperation.Operation>[4], budget: Parameters<IAutoMovieRecoverySceneCheckpointCompletionOperation.Operation>[5], work: Parameters<IAutoMovieRecoverySceneCheckpointCompletionOperation.Operation>[6], checkpoint: Parameters<IAutoMovieRecoverySceneCheckpointCompletionOperation.Operation>[7], onProposal?: Parameters<IAutoMovieRecoverySceneCheckpointCompletionOperation.Operation>[8], onTrace?: Parameters<IAutoMovieRecoverySceneCheckpointCompletionOperation.Operation>[9], feasible?: Parameters<IAutoMovieRecoverySceneCheckpointCompletionOperation.Operation>[10], reportCapacity?: Parameters<IAutoMovieRecoverySceneCheckpointCompletionOperation.Operation>[11]): ReturnType<IAutoMovieRecoverySceneCheckpointCompletionOperation.Operation> {
    return completeRecoverySceneCheckpointImplementation(initialPoses, initialLandmarks, tracks, charts, policy, budget, work, checkpoint, onProposal, onTrace, feasible, reportCapacity);
  }

  /**
   * Create the observer that transfers the latest completed seed fit into the
   * refusal report target. Setup charges 32 linear visits; each before phase
   * prepays a further 64. The matching after phase accepts one completed
   * report by reference without another charge. A failed precharge leaves the
   * prior report intact.
   */
  export function createSceneSeedReportObserver(target: Parameters<IAutoMovieRecoverySceneSeedReportObserverCreationOperation.Operation>[0], work: Parameters<IAutoMovieRecoverySceneSeedReportObserverCreationOperation.Operation>[1], budget: Parameters<IAutoMovieRecoverySceneSeedReportObserverCreationOperation.Operation>[2]): ReturnType<IAutoMovieRecoverySceneSeedReportObserverCreationOperation.Operation> {
    return createRecoverySceneSeedReportObserverImplementation(target, work, budget);
  }

  /**
   * Qualify a proposed landmark in its retained camera gauge. Check positive
   * depth and maximum reprojection error in pixels for every registered
   * observation. Qualify the largest acute supporting ray angle in degrees
   * against the configured parallax threshold. Return reasons for unsupported
   * observations or deficient geometry.
   */
  export function evaluateScenePoint(point: Parameters<IAutoMovieRecoveryScenePointEvaluationOperation.Operation>[0], observations: Parameters<IAutoMovieRecoveryScenePointEvaluationOperation.Operation>[1], poses: Parameters<IAutoMovieRecoveryScenePointEvaluationOperation.Operation>[2], charts: Parameters<IAutoMovieRecoveryScenePointEvaluationOperation.Operation>[3], policy: Parameters<IAutoMovieRecoveryScenePointEvaluationOperation.Operation>[4], observe?: Parameters<IAutoMovieRecoveryScenePointEvaluationOperation.Operation>[5]): ReturnType<IAutoMovieRecoveryScenePointEvaluationOperation.Operation> {
    return evaluateRecoveryScenePointImplementation(point, observations, poses, charts, policy, observe);
  }

  /**
   * Propose new landmarks and observations from the supplied registered poses.
   * Existing points receive only new positive-depth observations that meet the
   * pixel threshold. A new point must satisfy all of its available registered
   * observations. Duplicate accepted track IDs throw.
   */
  export function growSceneLandmarks(tracks: Parameters<IAutoMovieRecoverySceneLandmarksGrowthOperation.Operation>[0], initial: Parameters<IAutoMovieRecoverySceneLandmarksGrowthOperation.Operation>[1], poses: Parameters<IAutoMovieRecoverySceneLandmarksGrowthOperation.Operation>[2], charts: Parameters<IAutoMovieRecoverySceneLandmarksGrowthOperation.Operation>[3], policy: Parameters<IAutoMovieRecoverySceneLandmarksGrowthOperation.Operation>[4], budget: Parameters<IAutoMovieRecoverySceneLandmarksGrowthOperation.Operation>[5], work: Parameters<IAutoMovieRecoverySceneLandmarksGrowthOperation.Operation>[6], checkpoint: Parameters<IAutoMovieRecoverySceneLandmarksGrowthOperation.Operation>[7]): ReturnType<IAutoMovieRecoverySceneLandmarksGrowthOperation.Operation> {
    return growRecoverySceneLandmarksImplementation(tracks, initial, poses, charts, policy, budget, work, checkpoint);
  }

  /**
   * Factor the original-design inverse metric for a gauge-fixed camera and
   * point population. Supply nonnegative damping and the original rank floor.
   * Return metric actions in the input's camera-first physical coordinate
   * order. Unresolved original rank or insufficient capacity throws.
   */
  export function factorMapMetric(blocks: readonly IAutoMovieRecoveryMapJointBlock[], minimumRatio: number, damping: number, budget: IAutoMovieRecoveryCameraMapBudget): IAutoMovieRecoveryMapMetricFit {
    return factorRecoveryMapMetricImplementation(blocks, minimumRatio, damping, budget);
  }

  /**
   * Try the nominal physical blend of the untilted and tilted steps. If it
   * violates an original row, try a larger weight supported by all rows and
   * return the resulting step or a refusal. Use the objective descent and each
   * original constraint offset in the caller's chart.
   */
  export function mixFeasibleSqpStep(rows: Parameters<IAutoMovieRecoveryFeasibleSqpStepMixingOperation.Operation>[0], sqp: Parameters<IAutoMovieRecoveryFeasibleSqpStepMixingOperation.Operation>[1], tilted: Parameters<IAutoMovieRecoveryFeasibleSqpStepMixingOperation.Operation>[2], nominal: Parameters<IAutoMovieRecoveryFeasibleSqpStepMixingOperation.Operation>[3]): ReturnType<IAutoMovieRecoveryFeasibleSqpStepMixingOperation.Operation> {
    return mixRecoveryFeasibleSqpStepImplementation(rows, sqp, tilted, nominal);
  }

  /**
   * Check whether requested curvature scratch and retained factors fit
   * simultaneously in the declared resident-entry and linear-work bounds.
   * Return the eligible population size or the fixed fallback and calculated
   * work. Malformed dimensions or ceilings throw before requesting a curvature
   * fit.
   */
  export function admitMapCurvature(cameraWidth: number, points: number, observations: number, baseRetained: number, maxResidentEntries: number, maxLinearEntries: number, charge: (work: number) => void): IAutoMovieRecoveryCurvatureAdmission {
    return admitRecoveryMapCurvatureImplementation(cameraWidth, points, observations, baseRetained, maxResidentEntries, maxLinearEntries, charge);
  }

  /**
   * Assemble the lagged fixed-dual curvature blocks in the original-design
   * scaled coordinates. Supply the retained point population and the qualified
   * prior row multipliers. A nonrepresentable local second derivative returns
   * `null`; mismatched diagnostics or row addresses throw.
   */
  export function assembleMapCurvature(state: IAutoMovieRecoveryMapState, intrinsics: readonly (readonly number[])[], policy: IAutoMovieRecoveryCameraMapPolicy, seed: IAutoMovieRecoveryUntiltedEstimate, scales: IAutoMovieRecoveryMapMetricScales, damping: number): IAutoMovieRecoveryMapCurvatureBlocks | null {
    return assembleRecoveryMapCurvatureImplementation(state, intrinsics, policy, seed, scales, damping);
  }

  /**
   * Check scalar slots for the retained joint design and optional transient
   * work. Require at least two cameras and nonnegative safe integer counts and
   * capacity. Equality fits. Malformed or oversized totals throw
   * `RecoverySceneBudget` before allocating the design.
   */
  export function assertSceneLinearRetention(budget: IAutoMovieRecoveryCameraSceneBudget, cameras: number, observations: number, landmarks: number, transientEntries?: number): void {
    assertRecoverySceneLinearRetentionImplementation(budget, cameras, observations, landmarks, transientEntries);
  }

  /**
   * Copy the fixed diagnostic fields of a completed constrained fit into an
   * owned JSON-safe report. Preserve unavailable fields as null. Represent
   * each computed nonfinite value with its own string sentinel.
   */
  export function createFeasibleDiagnostics(fit: IAutoMovieRecoveryFeasibleFit<unknown>): IAutoMovieRecoveryFeasibleDiagnostics {
    return createRecoveryFeasibleDiagnosticsImplementation(fit);
  }

  /**
   * Try an affine-QP direction and at most one same-base curvature correction
   * using an admitted feasible model. Positive baseline weights nominate the
   * working set. Every original row and the physical stationarity checks still
   * qualify the result. When auxiliary resources, covector actions or a gate
   * are unresolved, the receipt names the limiting reason.
   */
  export function createFeasibleSqpArc(model: IAutoMovieRecoveryFeasibleModel, weights: readonly number[], tilted: readonly number[], tolerance: number, options: IAutoMovieRecoverySqpOptions, charge: (work: number) => void): IAutoMovieRecoverySqpArc {
    return createRecoveryFeasibleSqpArcImplementation(model, weights, tilted, tolerance, options, charge);
  }

  /**
   * Retain the scaled upper arrowhead factor of a point-first bundle QR.
   * Supply the independent point blocks, reduced camera block and original
   * column scales in the current chart. Returned actions take camera
   * coordinates first, then three coordinates per point.
   */
  export function createMapMetric(triangles: readonly (readonly (readonly number[])[])[], reduced: readonly (readonly number[])[], pointScales: readonly (readonly number[])[], cameraScales: readonly number[], budget: IAutoMovieRecoveryCameraMapBudget): IAutoMovieRecoveryMapMetric {
    return createRecoveryMapMetricImplementation(triangles, reduced, pointScales, cameraScales, budget);
  }

  /**
   * Bind a point-first upper factor and original positive column scales to
   * physical metric and whitening actions. Vectors put camera coordinates
   * first. Sparse rows carry ordered original column addresses. Invalid
   * factors, width mismatches or a requested unresolved action throw. The
   * optional whitening path can decline an unresolved pivot.
   */
  export function createMapTriangularMetric(triangles: readonly (readonly (readonly number[])[])[], camera: readonly (readonly number[])[], pointScales: readonly (readonly number[])[], cameraScales: readonly number[]): IAutoMovieRecoveryMapTriangularMetric {
    return createRecoveryMapTriangularMetricImplementation(triangles, camera, pointScales, cameraScales);
  }

  /**
   * Describe every requested view in input order using the final accepted
   * scene revision and its remaining support lists. Report registered views,
   * insufficient support, a refusal in the current revision, or a view that
   * was never attempted against that revision. Copy recorded refusal reasons.
   */
  export function describeSceneRegistration(result: IAutoMovieRecoveryCameraSceneEstimate, support: readonly (readonly IAutoMovieRecoverySceneCandidate[])[]): IAutoMovieRecoverySceneRegistration[] {
    return describeRecoverySceneRegistrationImplementation(result, support);
  }

  /**
   * Return pixel coordinates, a Jacobian and two Hessians for the current
   * pinhole map. Use `null` tangent for six ordinary camera coordinates, an
   * empty tangent for a fixed camera, or two directions for the seed sphere
   * chart. Rotations use radians, and point coordinates use the map gauge. An
   * unsupported depth or arithmetic returns `null`.
   */
  export function differentiateMapProjection(pose: IAutoMovieRecoveryMapPose, point: readonly [number, number, number], intrinsic: readonly number[], tangent: readonly (readonly [number, number, number])[] | null): IAutoMovieRecoveryMapLocalCurvature | null {
    return differentiateRecoveryMapProjectionImplementation(pose, point, intrinsic, tangent);
  }

  /**
   * Factor a scaled camera/point arrowhead and check whether its fixed
   * physical rows can be whitened. The result reports an admitted metric and
   * rows, or the unresolved point pivot, camera pivot or row action. Malformed
   * shapes and capacities throw.
   */
  export function factorMapCurvature(blocks: IAutoMovieRecoveryMapCurvatureBlocks, cameraScales: readonly number[], pointScales: readonly (readonly number[])[], physicalRows: readonly IAutoMovieSimplexAtom[]): IAutoMovieRecoveryMapCurvatureFit {
    return factorRecoveryMapCurvatureImplementation(blocks, cameraScales, pointScales, physicalRows);
  }

  /**
   * Measure independent local observability in a rectangular undamped
   * least-squares design. Supply finite rows and the paired right-hand side, a
   * minimum singular ratio and linear limits. Return owned column scales and
   * the reduced orthogonal factors. Zero or dependent directions and exceeded
   * budgets throw.
   */
  export function factorMapDesign(design: readonly (readonly number[])[], right: readonly number[], minimumRatio: number, budget: IAutoMovieRecoveryCameraMapBudget): IAutoMovieRecoveryMapDesignFactor {
    return factorRecoveryMapDesignImplementation(design, right, minimumRatio, budget);
  }

  /**
   * Test the exact fixed first-camera gauge. Rotation must contain the
   * row-major identity and translation must contain three zeros.
   */
  export function isMapIdentityGauge(pose: IAutoMovieRecoveryMapPose): boolean {
    return isRecoveryMapIdentityGaugeImplementation(pose);
  }

  /**
   * Bound how much stored binary64 dual weights can change the reconstructed
   * physical step and row prices. Supply validated sparse rows, their actual
   * stored weights and the returned direction. The result gives the outward
   * aggregate, minimum price and gap. A nonpositive exact simplex mass throws.
   */
  export function measureFeasibleArithmetic(rows: readonly IAutoMovieSimplexAtom[], solution: IAutoMovieSimplexMinimum): IAutoMovieRecoveryFeasibleArithmetic {
    return measureRecoveryFeasibleArithmeticImplementation(rows, solution);
  }

  /**
   * Predict decrease for an actual increment in the current undamped robust
   * model. Coordinates list camera step first and three values per landmark.
   * Return the negative model change in squared pixel objective units, or null
   * for unrepresentable arithmetic. Wrong widths or original-design row shape
   * throw.
   */
  export function predictMapDecrease(blocks: readonly IAutoMovieRecoveryMapJointBlock[], gradient: readonly number[], increment: readonly number[]): number | null {
    return predictRecoveryMapDecreaseImplementation(blocks, gradient, increment);
  }

  /**
   * Reserve reporting capacity for a direct feasible checkpoint. Charge 256
   * linear visits against the scene ledger and require an exact identity first
   * pose. Return owned direction options and the reporting cap for the
   * checkpoint population.
   */
  export function prepareCheckpointReportCapacity(pose: IAutoMovieRecoveryMapPose, budget: IAutoMovieRecoveryCameraSceneBudget, options: IAutoMovieRecoveryFeasibleJointOptions, work: IAutoMovieRecoverySceneWork): IAutoMovieRecoveryCheckpointReporting {
    return prepareRecoveryCheckpointReportCapacityImplementation(pose, budget, options, work);
  }

  /**
   * Admit a fixed feasible map's work and reserve its complete diagnostic
   * transfer. Omit report capacity to derive it from the fit's resident cap.
   * Charges apply through the supplied ledger callback. A malformed reporting
   * scope or insufficient retained capacity throws before solving.
   */
  export function prepareFeasibleMapReporting(poses: readonly IAutoMovieRecoveryMapPose[], landmarks: readonly IAutoMovieRecoveryMapLandmark[], intrinsics: readonly (readonly number[])[], budget: IAutoMovieRecoveryCameraMapBudget, options: IAutoMovieRecoveryFeasibleJointOptions, charge: (work: number) => void, capacity?: IAutoMovieRecoveryFeasibleReportCapacity): IAutoMovieRecoveryFeasibleMapReporting {
    return prepareRecoveryFeasibleMapReportingImplementation(poses, landmarks, intrinsics, budget, options, charge, capacity);
  }

  /**
   * Size numerical storage and work for a fixed map with at least two cameras,
   * six tracked points and a fixed identity first pose. Return original chart
   * and observation counts plus the declared work estimates. Valid population
   * pressure can refuse resident capacity, direction entries or direction work
   * separately.
   */
  export function prepareFeasibleMapWork(initialPoses: readonly IAutoMovieRecoveryMapPose[], initialLandmarks: readonly IAutoMovieRecoveryMapLandmark[], intrinsics: readonly (readonly number[])[], budget: IAutoMovieRecoveryCameraMapBudget, options: IAutoMovieRecoveryFeasibleJointOptions, charge: (work: number) => void): IAutoMovieRecoveryFeasibleMapWork {
    return prepareRecoveryFeasibleMapWorkImplementation(initialPoses, initialLandmarks, intrinsics, budget, options, charge);
  }

  /**
   * Partition a scene and fit resident budget before retaining diagnostic
   * reports. Each persisted report consumes 512 scalar entries, and one more
   * report is reserved for the active report. Return the reduced scene and fit
   * capacity. Malformed limits or an exhausted reserve throw.
   */
  export function prepareFeasibleReportCapacity(sceneEntries: number, fitEntries: number, persistedReports: number): IAutoMovieRecoveryFeasibleReportCapacity {
    return prepareRecoveryFeasibleReportCapacityImplementation(sceneEntries, fitEntries, persistedReports);
  }

  /**
   * Prepare bounded original point blocks and the gauge-fixed reduced camera
   * design. Supply finite observation rows, positive local rank limits and
   * declared linear capacity. Return original scales and the factored
   * camera/point inputs. Unresolved original directions or row mismatch throw.
   */
  export function prepareMapJointBlocks(blocks: readonly IAutoMovieRecoveryMapJointBlock[], minimumRatio: number, budget: IAutoMovieRecoveryCameraMapBudget, measureGradient: boolean): IAutoMovieRecoveryMapJointPreparation {
    return prepareRecoveryMapJointBlocksImplementation(blocks, minimumRatio, budget, measureGradient);
  }

  /**
   * Copy one explicit feasible scene request before user checkpoints. Keep
   * declared budgets for the report and derive an execution budget reserving
   * 64 resident entries. Charge 256 linear visits. Direction bounds must fit
   * declared scene ceilings, and lagged curvature requires acceleration.
   */
  export function prepareSceneFeasibleRouting(budget: IAutoMovieRecoveryCameraSceneBudget, options: IAutoMovieRecoveryFeasibleJointOptions, work: IAutoMovieRecoverySceneWork): IAutoMovieRecoverySceneFeasibleRouting {
    return prepareRecoverySceneFeasibleRoutingImplementation(budget, options, work);
  }

  /**
   * Reserve fit-report retention inside an admitted scene seed transaction.
   * Charge 256 linear visits, then update the supplied routing record with
   * reporting capacity and a reduced execution budget. A refused reserve
   * leaves the previous routing assignment untouched.
   */
  export function prepareSceneReportCapacity(routing: IAutoMovieRecoverySceneFeasibleRouting, work: IAutoMovieRecoverySceneWork): void {
    prepareRecoverySceneReportCapacityImplementation(routing, work);
  }

  /**
   * Applies a six-coordinate update to a camera-map pose.
   *
   * The first three coordinates form a left rotation vector in radians.
   * The last three add translation in the pose's camera frame, using the
   * current reconstruction units. The method returns a fresh pose and throws
   * when the update has the wrong coordinate count.
   */
  export function stepMapPose(pose: IAutoMovieRecoveryMapPose, step: readonly number[]): IAutoMovieRecoveryMapPose {
    return stepRecoveryMapPoseImplementation(pose, step);
  }

  /**
   * Apply a left rotation in radians and two translation coefficients in the
   * supplied seed tangent basis. Normalize the changed translation to the
   * current radius and return an owned pose. A collapsed direction or
   * unresolved seed chart throws.
   */
  export function stepMapSeedPose(pose: IAutoMovieRecoveryMapPose, tangent: readonly (readonly [number, number, number])[], step: readonly number[]): IAutoMovieRecoveryMapPose {
    return stepRecoveryMapSeedPoseImplementation(pose, tangent, step);
  }

  /**
   * Update damping after one selected step using its actual-to-predicted
   * decrease ratio. A missing usable agreement keeps the previous damping. The
   * returned receipt records the update and the ratio. Nonpositive current
   * damping throws.
   */
  export function updateRegularization(damping: number, actualDecrease: number, predictedDecrease: number | null): IAutoMovieRecoveryRegularizationUpdate {
    return updateRecoveryRegularizationImplementation(damping, actualDecrease, predictedDecrease);
  }

  /**
   * Choose strict inward margin for selected affine constraints against the
   * mixed step's physical objective descent. Return the capped value, row
   * price and nominal power ceiling. The supplied SQP norm must lie strictly
   * between zero and one.
   */
  export function chooseSqpTightening(rows: readonly IAutoMovieSimplexAtom[], selected: readonly number[], multipliers: readonly number[], mixed: readonly number[], sqpNorm: number, mixedNorm: number): IAutoMovieRecoverySqpTightening {
    return chooseRecoverySqpTighteningImplementation(rows, selected, multipliers, mixed, sqpNorm, mixedNorm);
  }

  /**
   * Copy a selected original affine dual estimate into fit-owned storage. A
   * null estimate returns null. The copy requires the original width, ordered
   * selected row addresses and nonnegative multipliers. Work is charged before
   * retaining it.
   */
  export function copyUntiltedEstimate(estimate: IAutoMovieRecoveryUntiltedEstimate | null, width: number, rowCount: number, charge: (work: number) => void): IAutoMovieRecoveryUntiltedEstimate | null {
    return copyRecoveryUntiltedEstimateImplementation(estimate, width, rowCount, charge);
  }

  /**
   * Create two coordinate directions tangent to a near-unit seed translation.
   * The first is the projection of the least-aligned axis, and the second
   * completes its orientation. A translation outside the admitted near-unit
   * gauge throws.
   */
  export function createMapTangent(t: readonly [number, number, number]): [number, number, number][] {
    return createRecoveryMapTangentImplementation(t);
  }

  /**
   * Differentiate the seed update r·normalize(t+Bz) at its current
   * translation, holding the base radius fixed. The two supplied B columns are
   * raw three-component directions. Return two physical derivatives or null
   * when the chart shape or arithmetic is unresolved.
   */
  export function differentiateMapTangent(translation: readonly [number, number, number], tangent: readonly (readonly [number, number, number])[]): [number, number, number][] | null {
    return differentiateRecoveryMapTangentImplementation(translation, tangent);
  }

  /**
   * Classify an error as a declared numerical refusal when it is a plain Error
   * with a recognized solver message prefix. Use the result in the numerical
   * proposal's catch boundary. Progress callbacks keep their own failure
   * behavior.
   */
  export function isCameraNumericalRefusal(error: unknown): boolean {
    return isRecoveryCameraNumericalRefusalImplementation(error);
  }

  /**
   * Solve the tilted direction model in a common metric chart. The first
   * sparse row is the objective gradient with zero offset. Each other row
   * supplies an inequality gradient and its original feasible slack. Return
   * the step and multipliers within the stated simplex entry, iteration and
   * work limits.
   */
  export function solveFeasibleDirection(width: number, rows: readonly IAutoMovieSimplexAtom[], tolerance: number, budget: IAutoMovieSimplexBudget, charge?: (work: number) => void): IAutoMovieRecoveryFeasibleDirection {
    return solveRecoveryFeasibleDirectionImplementation(width, rows, tolerance, budget, charge);
  }

  /**
   * Add a nonnegative safe integer charge to one scene ledger category.
   * Joint iterations use the product of the fit and per-fit iteration limits,
   * capped at the largest safe integer. Invalid or excessive charges throw
   * `RecoverySceneBudget` and keep the prior ledger.
   */
  export function spendSceneWork(
    work: IAutoMovieRecoverySceneWork,
    budget: IAutoMovieRecoveryCameraSceneBudget,
    kind: Parameters<typeof spendSceneWorkImplementation>[2],
    amount: number,
  ): void {
    spendSceneWorkImplementation(work, budget, kind, amount);
  }

  /**
   * Validate the original finite positive column scales for a physical map
   * metric. Supply at least one camera scale and three point scales per point.
   * Missing slots, invalid widths and scales outside the finite positive range
   * throw.
   */
  export function validateMapMetricScales(scales: IAutoMovieRecoveryMapMetricScales): void {
    validateMapMetricScalesImplementation(scales.cameraScales, scales.pointScales);
  }
  /**
   * Validate a sparse physical row over a positive safe integer width. Supply
   * strictly increasing in-range integer column indices, one finite value per
   * index and a finite offset. Malformed widths, coefficients and indices
   * throw.
   */
  export function validateMapMetricRow(row: IAutoMovieSimplexAtom, width: number): void {
    validateRecoveryMapMetricRowImplementation(row, width);
  }
  /**
   * Refine a caller-defined feasible state under bounded full and half trials,
   * model work and its original gates. Use the caller's evaluation, model,
   * retraction and commit callbacks. Optional SQP and adaptive reporting use
   * explicit requests. Termination reports qualified convergence, exhaustion
   * or refusal, with selected diagnostics.
   */
  export function refineFeasibleState<State>(
    problem: Parameters<IAutoMovieRecoveryFeasibleStateRefinementOperation.Operation<State>>[0],
    maxTrials: Parameters<IAutoMovieRecoveryFeasibleStateRefinementOperation.Operation<State>>[1],
    tolerance: Parameters<IAutoMovieRecoveryFeasibleStateRefinementOperation.Operation<State>>[2],
    directionBudget: Parameters<IAutoMovieRecoveryFeasibleStateRefinementOperation.Operation<State>>[3],
    checkpoint: Parameters<IAutoMovieRecoveryFeasibleStateRefinementOperation.Operation<State>>[4],
    charge: Parameters<IAutoMovieRecoveryFeasibleStateRefinementOperation.Operation<State>>[5],
    acceleration?: Parameters<IAutoMovieRecoveryFeasibleStateRefinementOperation.Operation<State>>[6],
  ): ReturnType<IAutoMovieRecoveryFeasibleStateRefinementOperation.Operation<State>> {
    return refineFeasibleStateImplementation(
      problem,
      maxTrials,
      tolerance,
      directionBudget,
      checkpoint,
      charge,
      acceleration,
    );
  }

  /**
   * Select a qualified trial from one unchanged optimization base. Try the
   * permitted baseline, mixed, corrected and half candidates under the
   * remaining trial limit. Return the actual chosen increment and gate report.
   * A selected trial alone carries no convergence claim.
   */
  export function selectFeasibleTrial<State>(
    problem: IAutoMovieRecoveryFeasibleProblem<State>,
    state: State,
    cost: number,
    baseline: readonly number[],
    baselineSlope: number,
    arc: IAutoMovieRecoverySqpArc | null,
    mixedSlope: number,
    remaining: number,
    trials: IAutoMovieRecoveryFeasibleTrials,
    checkpoint: () => void,
    charge: (work: number) => void,
  ): IAutoMovieRecoveryFeasibleTrialSelection<State> {
    return selectFeasibleTrialImplementation(
      problem,
      state,
      cost,
      baseline,
      baselineSlope,
      arc,
      mixedSlope,
      remaining,
      trials,
      checkpoint,
      charge,
    );
  }
}
