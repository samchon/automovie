import type {
  IAutoMovieActionTarget,
  IAutoMovieMotion,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IAutoMovieResolvedBone } from "../kinematics/IAutoMovieResolvedBone";
import { HUMANOID_JOINT_AXES } from "../kinematics/constants/HUMANOID_JOINT_AXES";
import { resolvePose } from "../kinematics/resolvePose";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { sampleMotion } from "../motion/sampleMotion";
import { IAutoMovieActorContext } from "./IAutoMovieActorContext";

/**
 * Resolve a bone action target to world metres using its actor rig and sampled motion, or the rest pose when motion is absent. Non-bone targets, unknown actors/rigs or absent resolved bones return null. Staged heading/position are applied after pose-root FK exactly once.
 *
 * @evidence contracts/common.md#principled-implementation Uses clinical humanoid axes and the context's rest frames in resolvePose, whose root-inclusive model FK is then rotated by staged +Y facing and translated by context position.
 * @evidence contracts/common.md#clear-and-simple-design Bone target resolution owns context lookup, optional sampling and world placement; it delegates joint constraints/FK to the existing canonical resolver.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It does not substitute a nearby bone or guessed geometry for a missing target; context representation is rigid staging with no nonuniform node scale.
 * @evidence contracts/common.md#meaningful-documentation States world metres, sampled/rest fallback, root-once ordering, clinical frame pairing and null failures; this low-level public resolver has no current production caller beyond tests.
 * @evidence contracts/performance.md#efficient-algorithms One sample when motion exists, one full B-bone FK and an O(B) matching scan; output storage is the delegated FK array plus one fresh target vector.
 * @evidence contracts/performance.md#reuse-equivalent-work The one sampled pose feeds the entire FK; no cross-target cache is used because context rig, motion and time are caller-controlled without revision identity.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Inputs are borrowed and the resolved array is invocation-local; the caller owns the returned vector, and no rig cache or running task is retained.
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
      : sampleMotion(motion, seconds).pose;
  const resolved: IAutoMovieResolvedBone | undefined = resolvePose(
    pose,
    context.rig,
    HUMANOID_JOINT_AXES,
    context.restFrames,
  ).find(
    (entry: IAutoMovieResolvedBone): boolean => entry.bone === target.bone,
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
