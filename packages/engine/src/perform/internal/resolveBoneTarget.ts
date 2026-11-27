import type {
  IAutoMovieActionTarget,
  IAutoMovieActorContext,
  IAutoMovieMotion,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineHumanoidJointAxes } from "../../kinematics/AutoMovieEngineHumanoidJointAxes";
import { resolvePose } from "../../kinematics/internal/resolvePose";
import { AutoMovieEngineQuaternion } from "../../math/AutoMovieEngineQuaternion";
import { AutoMovieEngineVector3 } from "../../math/AutoMovieEngineVector3";
import { AutoMovieEngineMotionSampling } from "../../motion/AutoMovieEngineMotionSampling";

/*
 * Resolve a bone action target to world metres using its actor rig and sampled
 * motion, or the rest pose when motion is absent. Non-bone targets, unknown
 * actors/rigs or absent resolved bones return null. Staged heading/position are
 * applied after pose-root FK exactly once.
 */
export function resolveBoneTarget(
  target: IAutoMovieActionTarget,
  contexts: ReadonlyMap<string, IAutoMovieActorContext>,
  motions: Readonly<Record<string, IAutoMovieMotion>> | undefined,
  seconds: number,
): IAutoMovieVector3 | null {
  if (target.kind !== "bone") return null;
  const context: IAutoMovieActorContext | undefined = contexts.get(target.node);
  if (context?.rig === undefined) return null;
  const motion: IAutoMovieMotion | undefined = motions?.[target.node];
  const pose: IAutoMoviePose =
    motion === undefined
      ? context.restPose
      : AutoMovieEngineMotionSampling.samplePose(motion, seconds);
  const [resolved]: IAutoMovieResolvedBone[] = resolvePose(
    pose,
    context.rig,
    AutoMovieEngineHumanoidJointAxes,
    context.restFrames,
    undefined,
    undefined,
    new Set([target.bone]),
  );
  if (resolved === undefined) return null;
  const facing: IAutoMovieQuaternion = AutoMovieEngineQuaternion.fromAxisAngle(
    { x: 0, y: 1, z: 0 },
    context.facingDeg,
  );
  return AutoMovieEngineVector3.add(
    context.position,
    // `resolvePose` starts its FK walk at `pose.root.translation`, so its
    // world position already carries locomotion exactly once. Rotate that
    // model-space point into the staged facing, then translate to the actor.
    AutoMovieEngineQuaternion.rotateVector(facing, resolved.worldPosition),
  );
}
