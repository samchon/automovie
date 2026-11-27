import type {
  AutoMovieHumanoidBone,
  IAutoMovieFitChainToTargetProps,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMoviePoseResolution,
  IAutoMoviePreparedChainPlant,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieSeededChainFit,
  IAutoMovieSolvedChainPlant,
  IAutoMovieSkeletonPoseResolution,
  IAutoMovieSwivelNear,
  IAutoMovieSwivelSeed,
} from "@automovie/interface";

import { AutoMovieEngineKinematics } from "../kinematics/AutoMovieEngineKinematics";
import { fitChainToTarget as fitChainToTargetImplementation } from "./internal/fitChainToTarget";
import { fitHingedChainAt as fitHingedChainAtImplementation } from "./internal/fitHingedChainAt";
import { fitHingedChainCandidate as fitHingedChainCandidateImplementation } from "./internal/fitHingedChainCandidate";
import { fitHingedRotationError as fitHingedRotationErrorImplementation } from "./internal/fitHingedRotationError";
import { fitSeededChainToTarget as fitSeededChainToTargetImplementation } from "./internal/fitSeededChainToTarget";
import { readHingedChainSeed as readHingedChainSeedImplementation } from "./internal/readHingedChainSeed";
import type { continueHingedOrientation } from "./internal/continueHingedOrientation";
import type { prepareChainFit } from "./internal/prepareChainFit";

/** Public articulated-chain fitting operations for Auto Movie Engine Motion. */
export namespace AutoMovieEngineMotionKinematics {
  /** A placed hinged-chain candidate, including its legal-shell shortfall. */
  export type IHingedChainPlacement =
    fitHingedChainAtImplementation.IPlaced;

  /** Joint angles and Euler charts before range-of-motion projection. */
  export type IHingedChainFreeFit = fitHingedChainAtImplementation.IFree;

  /** A joint's principal and alternate Euler readings. */
  export type IHingedChainJointCharts =
    fitHingedChainAtImplementation.Charts;

  /** Root and effector chart readings for a free hinged-chain fit. */
  export type IHingedChainCharts = fitHingedChainAtImplementation.ICharts;

  /** Workspace for repeated targets against one unchanged fit source. */
  export type ISeededChainFitWorkspace =
    fitSeededChainToTargetImplementation.IWorkspace;

  /** Fixed source fields for a repeated target-search operation. */
  export type ISeededChainFitSource =
    fitSeededChainToTargetImplementation.ISource;

  /** Live fit fields bound to a fixed repeated-target source. */
  export type ISeededChainFitOptions =
    fitSeededChainToTargetImplementation.IOptions;

  /** Authored frame reader admitted by a seeded fit workspace. */
  export type ISeededChainReadAuthored = () => ReadonlyMap<
    AutoMovieHumanoidBone,
    IAutoMovieResolvedBone
  >;

  /** Optional chain-plant preparation used by a seeded fit workspace. */
  export type ISeededChainPlantReader =
    () => IAutoMoviePreparedChainPlant | null;

  /** Scorer for the displayed effector rotation of a hinged candidate. */
  export type IHingedRotationError = (
    upper: IAutoMovieQuaternion,
    lower: IAutoMovieQuaternion,
    preparedAbove?: IAutoMovieQuaternion,
  ) => number;

  /** Pose-resolution reader shared across one unchanged chain fit source. */
  export type ISeededChainFitPoseResolution = IAutoMoviePoseResolution;

  /** Immutable skeleton-pose reader for the source rig and topology. */
  export type ISeededChainFitSkeletonResolution =
    IAutoMovieSkeletonPoseResolution.IRig;

  /** Fixed rig prepared for scoring hinged-chain candidates. */
  export type IHingedChainFitRig = prepareChainFit.IRig;

  /** Fit a reachable two-bone chain to a model-frame target under effective ROM. */
  export function fitChainToTarget(
    props: IAutoMovieFitChainToTargetProps,
  ): IAutoMoviePose {
    return fitChainToTargetImplementation(props);
  }

  /** Fit a chain and retain its seed, branch, swivel and planted result. */
  export function fitSeededChainToTarget(
    input: IAutoMovieFitChainToTargetProps,
  ): IAutoMovieSeededChainFit {
    return fitSeededChainToTargetImplementation.fit(input);
  }

  /** Prepare repeated targets for an unchanged source request. */
  export function prepareSeededChainFit(
    source: Omit<IAutoMovieFitChainToTargetProps, "target">,
    readAuthored?: ISeededChainReadAuthored,
    resolution: ISeededChainFitPoseResolution =
      AutoMovieEngineKinematics.preparePoseResolution(),
    poseResolution?: ISeededChainFitSkeletonResolution,
    plant?: ISeededChainPlantReader,
  ): ISeededChainFitWorkspace {
    return fitSeededChainToTargetImplementation.prepare(
      source,
      readAuthored,
      resolution,
      poseResolution,
      plant,
    );
  }

  /** Prepare a reusable source for changing fit options and targets. */
  export function prepareSeededChainFitSource(
    source: ISeededChainFitSource,
    readAuthored?: ISeededChainReadAuthored,
    resolution: ISeededChainFitPoseResolution =
      AutoMovieEngineKinematics.preparePoseResolution(),
    poseResolution?: ISeededChainFitSkeletonResolution,
  ): (options: ISeededChainFitOptions) => ISeededChainFitWorkspace {
    return fitSeededChainToTargetImplementation.prepareSource(
      source,
      readAuthored,
      resolution,
      poseResolution,
    );
  }

  /** Read producer-owned orientation-root provenance from one exact fit result. */
  export function seededChainFitOrientationRoot(
    result: IAutoMovieSeededChainFit & continueHingedOrientation.IRooted,
  ): continueHingedOrientation.IRoot | undefined {
    return fitSeededChainToTargetImplementation.orientationRoot(result);
  }

  /** Place a hinged chain at a prescribed swivel and branch without searching. */
  export function fitHingedChainAt(
    props: IAutoMovieFitChainToTargetProps,
    swivel: number,
    branch: number,
  ): IHingedChainPlacement | null {
    return fitHingedChainAtImplementation.place(props, swivel, branch);
  }

  /** Read hinged-chain angles and charts at a swivel without placement. */
  export function fitHingedChainAtFree(
    props: IAutoMovieFitChainToTargetProps,
    swivel: number,
    branch: number,
  ): IHingedChainFreeFit | null {
    return fitHingedChainAtImplementation.free(props, swivel, branch);
  }

  /** Read the swivel seed of a posed hinged chain. */
  export function readHingedChainSeed(
    props: IAutoMovieFitChainToTargetProps,
    upper: IAutoMovieJointPose,
    lower: IAutoMovieJointPose,
  ): IAutoMovieSwivelSeed | null {
    return readHingedChainSeedImplementation(props, upper, lower);
  }

  /** Score one hinged candidate's displayed effector-rotation error. */
  export function fitHingedRotationError(
    props: IAutoMovieFitChainToTargetProps,
    prepared: IAutoMoviePreparedChainPlant,
    axes: IAutoMovieJointAxes,
    rotation: IAutoMovieQuaternion,
    rig?: IHingedChainFitRig,
  ): IHingedRotationError {
    return fitHingedRotationErrorImplementation(
      props,
      prepared,
      axes,
      rotation,
      rig,
    );
  }

  /** Select the best hinged-chain candidate for one prepared fit request. */
  export function fitHingedChainCandidate(
    props: IAutoMovieFitChainToTargetProps,
    prepared: IAutoMoviePreparedChainPlant,
    axes: IAutoMovieJointAxes,
    rotation: IAutoMovieQuaternion | undefined,
    rig: IHingedChainFitRig,
  ): IAutoMovieSolvedChainPlant | null {
    return fitHingedChainCandidateImplementation(
      props,
      prepared,
      axes,
      rotation,
      rig,
    );
  }
}
