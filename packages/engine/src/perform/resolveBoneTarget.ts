import { IAutoMovieActionTarget, IAutoMovieMotion, IAutoMovieVector3 } from "@automovie/interface";
import { HUMANOID_JOINT_AXES } from "../kinematics/constants/HUMANOID_JOINT_AXES";
import { resolvePose } from "../kinematics/resolvePose";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { sampleMotion } from "../motion/sampleMotion";
import { IAutoMovieActorContext } from "./IAutoMovieActorContext";

/**
 * Resolve a bone target into world coordinates from a sampled actor motion.
 *
 * @evidence requirements/motion/constraints-and-inverse-kinematics.md#motion-constraint-target-space Resolves a moving bone target into the explicit world space consumed by IK.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Transforms a sampled rig-bone position into world target space.
 */
export const resolveBoneTarget = (
  target: IAutoMovieActionTarget,
  contexts: ReadonlyMap<string, IAutoMovieActorContext>,
  motions: Readonly<Record<string, IAutoMovieMotion>> | undefined,
  seconds: number,
): IAutoMovieVector3 | null => {
  if (target.kind !== "bone") return null;
  const context = contexts.get(target.node);
  if (context?.rig === undefined) return null;
  const motion = motions?.[target.node];
  const pose =
    motion === undefined
      ? context.restPose
      : sampleMotion(motion, seconds).pose;
  const resolved = resolvePose(
    pose,
    context.rig,
    HUMANOID_JOINT_AXES,
    context.restFrames,
  ).find((entry) => entry.bone === target.bone);
  if (resolved === undefined) return null;
  const facing = Quaternion.fromAxisAngle(
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
