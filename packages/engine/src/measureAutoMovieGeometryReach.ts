import {
  type IAutoMovieGeometryActorReader,
  type IAutoMovieGeometryMeasurementInput,
  type IAutoMovieGeometryQuery,
  IAutoMovieGeometryResult,
  type IAutoMoviePose,
  type IAutoMovieResolvedBone,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { createAutoMovieGeometryActorReader } from "./createAutoMovieGeometryActorReader";
import { HUMANOID_JOINT_AXES } from "./kinematics/constants/HUMANOID_JOINT_AXES";
import { reachPose } from "./kinematics/internal/reachPose";
import { resolvePose } from "./kinematics/internal/resolvePose";
import { Quaternion } from "./math/Quaternion";
import { Transform } from "./math/Transform";
import { Vector3 } from "./math/Vector3";
import { validatePose } from "./validation/validatePose";

/**
 * Measure each available arm's rest-chain reach gap in model metres at
 * shot-local seconds; report solved-pose ROM separately and refuse degenerate
 * node scale or absent arm chains.
 */
export function measureAutoMovieGeometryReach(
  props: IAutoMovieGeometryMeasurementInput,
  request: Extract<IAutoMovieGeometryQuery, { query: "reach" }>,
): IAutoMovieGeometryResult {
  const reader: IAutoMovieGeometryActorReader =
    createAutoMovieGeometryActorReader(props.compiled);

  const sampledTime: number = request.time ?? 0;

  const actor: ReturnType<typeof reader.find> = reader.find(
    request.actor,
    request.shot,
  );

  const target: IAutoMovieVector3 = reader.selector(
    request.target,
    props.design.world,
    {
      shot: actor.compiled.shot.id,
      time: sampledTime,
    },
  );

  const spatial: ReturnType<typeof reader.spatial> = reader.spatial(
    actor.compiled,
    request.actor,
    sampledTime,
    actor.model.skeleton,
  );

  const nodeLocal: IAutoMovieVector3 | null = toModelPoint(
    target,
    spatial.nodeTransform,
  );
  const localTarget: IAutoMovieVector3 | null =
    nodeLocal === null || spatial.poseRoot === null
      ? nodeLocal
      : toModelPoint(
          nodeLocal,
          Transform.of(spatial.poseRoot.translation, spatial.poseRoot.rotation),
        );

  if (localTarget === null)
    throw new Error(
      `Actor "${request.actor}" has a degenerate current scale. Correct its compiled scene transform before reach measurement.`,
    );

  if (actor.model.skeleton === null)
    throw new Error(
      `Actor "${request.actor}" has no skeleton. Bind a rigged model before reach measurement.`,
    );

  const left: IArmReachMeasurement | null = measureArmReach(
    actor.model.skeleton,
    "left",
    localTarget,
  );

  const right: IArmReachMeasurement | null = measureArmReach(
    actor.model.skeleton,
    "right",
    localTarget,
  );

  if (left === null && right === null)
    throw new Error(
      `Actor "${request.actor}" has no measurable upper-arm, lower-arm and hand chain. Correct the rig before reach measurement.`,
    );

  return {
    kind: "measurement",
    values: {
      sampledTime,
      reachable: Boolean(left?.reachable || right?.reachable),
      leftMeasurable: left !== null,
      leftGap: left?.gap ?? 0,
      leftPoseWithinRom: left?.poseWithinRom ?? false,
      rightMeasurable: right !== null,
      rightGap: right?.gap ?? 0,
      rightPoseWithinRom: right?.poseWithinRom ?? false,
    },
  };
}
interface IArmReachMeasurement {
  /** Positive rest-chain deficit in model metres, or zero within radial reach. */
  gap: number;

  /** Whether the radial deficit is at most 1e-6 model metres. */
  reachable: boolean;

  /** Whether the independently solved pose passes the current rig's ROM gate. */
  poseWithinRom: boolean;
}

const measureArmReach: (
  skeleton: IAutoMovieSkeleton,
  side: "left" | "right",
  target: IAutoMovieVector3,
) => IArmReachMeasurement | null = (
  skeleton: IAutoMovieSkeleton,
  side: "left" | "right",
  target: IAutoMovieVector3,
): IArmReachMeasurement | null => {
  const upperName: "leftUpperArm" | "rightUpperArm" =
    side === "left" ? "leftUpperArm" : "rightUpperArm";
  const lowerName: "leftLowerArm" | "rightLowerArm" =
    side === "left" ? "leftLowerArm" : "rightLowerArm";
  const handName: "leftHand" | "rightHand" =
    side === "left" ? "leftHand" : "rightHand";
  const rest: IAutoMovieResolvedBone[] = resolvePose(
    { skeleton: skeleton.id, root: null, joints: [] },
    skeleton,
    HUMANOID_JOINT_AXES,
  );
  const upper: (typeof rest)[number] | undefined = rest.find(
    (bone: (typeof rest)[number]): boolean => bone.bone === upperName,
  );
  const lower: (typeof rest)[number] | undefined = rest.find(
    (bone: (typeof rest)[number]): boolean => bone.bone === lowerName,
  );
  const hand: (typeof rest)[number] | undefined = rest.find(
    (bone: (typeof rest)[number]): boolean => bone.bone === handName,
  );
  if (upper === undefined || lower === undefined || hand === undefined)
    return null;
  const upperLength: number = Vector3.length(
    Vector3.subtract(lower.worldPosition, upper.worldPosition),
  );
  const lowerLength: number = Vector3.length(
    Vector3.subtract(hand.worldPosition, lower.worldPosition),
  );
  if (upperLength < 1e-6 || lowerLength < 1e-6) return null;
  const targetDistance: number = Vector3.length(
    Vector3.subtract(target, upper.worldPosition),
  );
  const gap: number = Math.max(0, targetDistance - upperLength - lowerLength);
  const pose: IAutoMoviePose | null = reachPose(skeleton, side, target);
  return {
    gap,
    reachable: gap <= 1e-6,
    poseWithinRom:
      pose !== null && validatePose({ pose, skeleton }).items.length === 0,
  };
};

const toModelPoint: (
  point: IAutoMovieVector3,
  transform: IAutoMovieTransform,
) => IAutoMovieVector3 | null = (
  point: IAutoMovieVector3,
  transform: IAutoMovieTransform,
): IAutoMovieVector3 | null => {
  if (
    Math.abs(transform.scale.x) < 1e-6 ||
    Math.abs(transform.scale.y) < 1e-6 ||
    Math.abs(transform.scale.z) < 1e-6
  )
    return null;
  const unrotated: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.inverse(transform.rotation),
    Vector3.subtract(point, transform.translation),
  );
  return {
    x: unrotated.x / transform.scale.x,
    y: unrotated.y / transform.scale.y,
    z: unrotated.z / transform.scale.z,
  };
};
