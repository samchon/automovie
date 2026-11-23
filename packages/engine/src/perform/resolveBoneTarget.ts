import type {
  IAutoMovieActionTarget,
  IAutoMovieActorContext,
  IAutoMovieMotion,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HUMANOID_JOINT_AXES } from "../kinematics/constants/HUMANOID_JOINT_AXES";
import { resolvePose } from "../kinematics/resolvePose";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { sampleMotion } from "../motion/sampleMotion";

/**
 * Resolve a bone action target to world metres using its actor rig and sampled
 * motion, or the rest pose when motion is absent. Non-bone targets, unknown
 * actors/rigs or absent resolved bones return null. Staged heading/position are
 * applied after pose-root FK exactly once.
 */
export const resolveBoneTarget: (
  target: IAutoMovieActionTarget,
  contexts: ReadonlyMap<string, IAutoMovieActorContext>,
  motions: Readonly<Record<string, IAutoMovieMotion>> | undefined,
  seconds: number,
) => IAutoMovieVector3 | null = (
  target: IAutoMovieActionTarget,
  contexts: ReadonlyMap<string, IAutoMovieActorContext>,
  motions: Readonly<Record<string, IAutoMovieMotion>> | undefined,
  seconds: number,
): IAutoMovieVector3 | null => {
  if (target.kind !== "bone") return null;
  const context: IAutoMovieActorContext | undefined = contexts.get(target.node);
  if (context?.rig === undefined) return null;
  const motion: IAutoMovieMotion | undefined = motions?.[target.node];
  const pose: IAutoMoviePose =
    motion === undefined
      ? context.restPose
      : sampleMotion.pose(motion, seconds);
  const [resolved]: IAutoMovieResolvedBone[] = resolvePose(
    pose,
    context.rig,
    HUMANOID_JOINT_AXES,
    context.restFrames,
    undefined,
    undefined,
    new Set([target.bone]),
  );
  if (resolved === undefined) return null;
  const facing: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 0, y: 1, z: 0 },
    context.facingDeg,
  );
  return Vector3.add(
    context.position,
    // `resolvePose` starts its FK walk at `pose.root.translation`, so its
    // world position already carries locomotion exactly once. Rotate that
    // model-space point into the staged facing, then translate to the actor.
    Quaternion.rotateVector(facing, resolved.worldPosition),
  );
};
