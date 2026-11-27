import { assemblePlantedFeet as assemblePlantedFeetImplementation } from "./internal/assemblePlantedFeet";
import { contactMask as contactMaskImplementation } from "./internal/contactMask";
import { pinStanceTargets as pinStanceTargetsImplementation } from "./internal/pinStanceTargets";
import { plantStanceFeet as plantStanceFeetImplementation } from "./internal/plantStanceFeet";
import { rekeyPlantedFeet as rekeyPlantedFeetImplementation } from "./internal/rekeyPlantedFeet";
import { prepareChainPlant as prepareChainPlantImplementation } from "./prepareChainPlant";
import { prepareChainConstants as prepareChainConstantsImplementation } from "./prepareChainConstants";
import { prepareChainRigConstants as prepareChainRigConstantsImplementation } from "./prepareChainRigConstants";
import { placeChainPlant as placeChainPlantImplementation } from "./placeChainPlant";
import { solvePreparedChainPlant as solvePreparedChainPlantImplementation } from "./solvePreparedChainPlant";
import { resolvePreparedChainEffector as resolvePreparedChainEffectorImplementation } from "./resolvePreparedChainEffector";
import type { IPlantStanceFeetProps as IPlantStanceFeetInternalProps } from "./internal/IPlantStanceFeetProps";
import type { IRekeyPlantedFeetProps as IRekeyPlantedFeetInternalProps } from "./internal/IRekeyPlantedFeetProps";

import type {
  IAutoMovieContactMask,
  IAutoMovieFootPlant,
  IAutoMovieKeyframe,
  IAutoMovieMotion,
  IAutoMoviePinStanceTargets,
  IAutoMoviePlantedFeet,
  AutoMovieHumanoidBone,
  IAutoMovieFitChainToTargetProps,
  IAutoMovieJointAxes,
  IAutoMoviePlantChain,
  IAutoMovieRestFrame,
  IAutoMovieSkeleton,
  IAutoMoviePreparedChainPlant,
  IAutoMovieSolvePreparedChainPlantProps,
  IAutoMovieSolvedChainPlant,
  IAutoMovieResolvePreparedChainEffectorResolvedPreparedEffectorProps,
  IAutoMovieChainBone,
  IAutoMovieVector3,
  IAutoMovieQuaternion,
  IAutoMoviePrepareChainConstants,
  IAutoMoviePrepareChainRigConstants,
} from "@automovie/interface";
import type { AutoMovieEngineSkeletonPose } from "../kinematics/AutoMovieEngineSkeletonPose";
import type { AutoMovieEngineKinematicsChains } from "../kinematics/AutoMovieEngineKinematicsChains";
import type { prepareChainFit } from "./internal/prepareChainFit";

/** Public operations for detecting and correcting planted-foot contacts. */
export namespace AutoMovieEngineMotionPlanting {
  /** Assemble corrected keyframes and stance metadata around the source clip. */
  export function assemblePlantedFeet(
    motion: IAutoMovieMotion,
    keyframes: IAutoMovieKeyframe[],
    plants: IAutoMovieFootPlant[],
  ): IAutoMoviePlantedFeet {
    return assemblePlantedFeetImplementation(motion, keyframes, plants);
  }

  /** Classify resolved effector samples as stance relative to sampled ground. */
  export function contactMask(
    props: IAutoMovieContactMask.IProps,
  ): boolean[] {
    return contactMaskImplementation(props);
  }

  /** Pin each supported leg stance run to one model-frame contact. */
  export function pinStanceTargets(
    props: IAutoMoviePinStanceTargets.IProps,
  ): IAutoMoviePinStanceTargets.IResult {
    return pinStanceTargetsImplementation(props);
  }

  /** Props accepted by the full motion stance planting operation. */
  export type IPlantStanceFeetProps =
    IPlantStanceFeetInternalProps;

  /** Sample, detect, pin and fit leg contacts on an admitted motion. */
  export function plantStanceFeet(
    props: IPlantStanceFeetProps,
  ): IAutoMoviePlantedFeet {
    return plantStanceFeetImplementation(props);
  }

  /** Props for re-keying one admitted parallel pose/target sample set. */
  export type IRekeyPlantedFeetProps =
    IRekeyPlantedFeetInternalProps;

  /** Fit the targeted leg chains into corrected keyframes. */
  export function rekeyPlantedFeet(
    props: IRekeyPlantedFeetProps,
  ): IAutoMovieKeyframe[] {
    return rekeyPlantedFeetImplementation(props);
  }

  /** Constants prepared once for a rig and reused under any parent pose. */
  export type IChainConstants = IAutoMoviePrepareChainConstants.IConstants;

  /** Pose-dependent preparation of a reachable two-bone chain. */
  export function prepareChainPlant(
    props: Pick<
      IAutoMovieFitChainToTargetProps,
      "skeleton" | "pose" | "chain" | "topology" | "jointAxes" | "restFrames"
    >,
    resolution?: ReturnType<
      typeof import("../kinematics/AutoMovieEngineKinematics").AutoMovieEngineKinematics.preparePoseResolution
    >,
    poseResolution?: AutoMovieEngineSkeletonPose.IRig,
  ): IAutoMoviePreparedChainPlant | null {
    return prepareChainPlantImplementation(props, resolution, poseResolution);
  }

  /** Prepare rig-only constants for a directly parented two-bone chain. */
  export function prepareChainConstants(props: {
    skeleton: IAutoMovieSkeleton;
    chain: IAutoMoviePlantChain;
    jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;
    restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;
  }): IChainConstants | null {
    return prepareChainConstantsImplementation(props);
  }

  /** Pose-independent records required to prepare a chain rig. */
  export type IChainRigConstantsFixed = IAutoMoviePrepareChainRigConstants.IFixed;

  /** Fit readers prepared once for the chain's unchanged rig. */
  export type IChainRigConstants = IAutoMoviePrepareChainRigConstants.IRig;

  /** Prepare the reusable fit readers for a chain's rig. */
  export function prepareChainRigConstants(
    props: Pick<
      IAutoMovieFitChainToTargetProps,
      "skeleton" | "chain" | "jointAxes" | "restFrames"
    >,
    fixed: IChainRigConstantsFixed | null,
  ): IChainRigConstants {
    return prepareChainRigConstantsImplementation(props, fixed);
  }

  /** Place rig-only chain constants under a pose's parent frame. */
  export function placeChainPlant(
    constants: IChainConstants,
    parent: { worldPosition: IAutoMovieVector3; worldRotation: IAutoMovieQuaternion },
  ): IAutoMoviePreparedChainPlant {
    return placeChainPlantImplementation(constants, parent);
  }

  /** Solve a prepared chain for its target and bend normal. */
  export function solvePreparedChainPlant(
    props: IAutoMovieSolvePreparedChainPlantProps,
    rig?: prepareChainFit.IRig,
    target?: AutoMovieEngineKinematicsChains.ITwoBonePreparedTarget,
  ): IAutoMovieSolvedChainPlant | null {
    return solvePreparedChainPlantImplementation(props, rig, target);
  }

  /** Resolve the effector reached by candidate joints on a prepared chain. */
  export function resolvePreparedChainEffector(
    props: IAutoMovieResolvePreparedChainEffectorResolvedPreparedEffectorProps,
    lower?: IAutoMovieChainBone,
  ): IAutoMovieVector3 {
    return resolvePreparedChainEffectorImplementation(props, lower);
  }
}
