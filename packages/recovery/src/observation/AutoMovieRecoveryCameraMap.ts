import { type IAutoMovieRecoveryCameraMapAdmissionOperation, type IAutoMovieRecoveryCameraPairAdmissionOperation, type IAutoMovieRecoveryCameraSceneAdmissionOperation, type IAutoMovieRecoveryCameraChartCreationOperation, type IAutoMovieRecoveryCameraEstimateCreationOperation, type IAutoMovieRecoveryCameraMapCreationOperation, type IAutoMovieRecoveryCameraSceneCreationOperation, type IAutoMovieRecoveryImageDirectionSolverCreationOperation, type IAutoMovieRecoveryPoseModelCreationOperation, type IAutoMovieRecoveryFeasibleMapLinearization, type IAutoMovieRecoveryMapState, type IAutoMovieRecoveryCameraMapPolicy, type IAutoMovieRecoveryPoseResidualsLinearizeOperation, type IAutoMovieRecoveryMapPointProjectionOperation, type IAutoMovieRecoveryCameraMapRefinementOperation, type IAutoMovieRecoveryMapJointResult, type IAutoMovieRecoveryMapPose, type IAutoMovieRecoveryMapLandmark, type IAutoMovieRecoveryCameraMapBudget, type IAutoMovieRecoveryFeasibleJointOptions, type IAutoMovieRecoveryFeasibleReportCapacity, type IAutoMovieRecoveryMapDesignSolutionOperation, type IAutoMovieRecoveryMapJointStepSolutionOperation, type IAutoMovieRecoveryRelativePoseStepOperation } from "@automovie/interface";
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
}
