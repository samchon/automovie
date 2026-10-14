import {
  AutoMovieGeometryQuery,
  IAutoMovieGeometryResult,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { IAutoMovieGeometryMeasurementInput } from "./IAutoMovieGeometryMeasurementInput";
import { createAutoMovieGeometryActorReader } from "./createAutoMovieGeometryActorReader";
import { HUMANOID_JOINT_AXES } from "./kinematics/constants/HUMANOID_JOINT_AXES";
import { reachPose } from "./kinematics/reachPose";
import { resolvePose } from "./kinematics/resolvePose";
import { Quaternion } from "./math/Quaternion";
import { Vector3 } from "./math/Vector3";
import { validatePose } from "./validation/validatePose";

/**
 * Measure each available arm's rest-chain reach gap in model metres at shot-local seconds; report solved-pose ROM separately and refuse degenerate node scale or absent arm chains.
 *
 * @evidence contracts/common.md#principled-implementation Inverts node TRS then pose-root rigid placement to obtain a model-frame target, preserving nonuniform scale and rotated roots; each arm gap is max(0, shoulder distance minus both rest segment lengths), with 1e-6 degeneracy/reach tolerance.
 * @evidence contracts/common.md#clear-and-simple-design The branch resolves the sampled actor and target once, while a private arm helper owns rest-chain lengths, reachPose and ROM reporting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An incomplete or near-zero-length arm is unmeasurable; both missing chains, missing skeleton and any near-zero node scale throw rather than guessing reach or dividing by zero.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes model-metre geometric gap from ROM feasibility, local time and named refusal conditions; a zero gap does not guarantee a ROM-valid pose.
 * @evidence contracts/performance.md#efficient-algorithms Actor/selector lookup and up to two rest FK and reach/ROM solves dominate work, linear in rig bones; no time sweep or rendering is performed.
 * @evidence contracts/performance.md#reuse-equivalent-work Both arms use the same resolved target and sampled spatial record; rest/IK results are not cached across mutable skeleton snapshots.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Resolved actor, target and solver poses are call-local; only scalar measurement fields escape, with no retained rig or external resource.
 */
export function measureAutoMovieGeometryReach(
  props: IAutoMovieGeometryMeasurementInput,
  request: Extract<AutoMovieGeometryQuery, { query: "reach" }>,
): IAutoMovieGeometryResult {
  const reader: ReturnType<typeof createAutoMovieGeometryActorReader> =
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
      : toModelPoint(nodeLocal, {
          ...spatial.poseRoot,
          scale: { x: 1, y: 1, z: 1 },
        });

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
  const rest: ReturnType<typeof resolvePose> = resolvePose(
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
  const pose: ReturnType<typeof reachPose> = reachPose(skeleton, side, target);
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
