// The joint-axis declaration moved to `interface`, where a bone carries it;
// the engine keeps exporting it for its existing consumers.
export type {
  AutoMovieJointTwistPlacement,
  IAutoMovieJointAxes,
} from "@automovie/interface";
export * from "./AutoMovieSkeletonParentKey";
export * from "./IAutoMovieArmChainFault";
export * from "./IAutoMovieChainBone";
export * from "./IAutoMovieHingedArticulation";
export * from "./IAutoMovieJointAxesIssue";
export * from "./IAutoMovieResolvedBone";
export * from "./IAutoMovieSkeletonTopology";
export * from "./IAutoMovieTwoBoneArticulation";
export * from "./ITwoBoneIK";
export * from "./aimRotation";
export * from "./aimYawPitch";
export * from "./armChainFault";
export * from "./clinicalDeviation";
export * from "./constants";
export * from "./decomposeJointRotation";
export * from "./IAutoMovieJointRotationDomain";
export type { IAutoMovieResolvedJointAngles } from "./IAutoMovieResolvedJointAngles";
export * from "./gazeChainJoints";
export * from "./hingedArmArticulation";
export * from "./indexSkeletonTopology";
export * from "./jointRomOvershoot";
export * from "./jointToQuaternion";
export * from "./normalizeJointAxes";
export * from "./reachPose";
export * from "./reachableBoneNames";
export * from "./resolveAttachment";
export * from "./resolvePose";
export * from "./skeletonJointAxes";
export * from "./solveTwoBoneIK";
export * from "./twoBoneChainArticulation";
export * from "./validateJointAxesBasis";
