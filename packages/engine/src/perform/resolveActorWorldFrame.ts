import type {
  IAutoMovieMotion,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { sampleMotion } from "../motion/sampleMotion";
import { IAutoMovieActorContext } from "./IAutoMovieActorContext";
import { IAutoMovieActorWorldFrame } from "./IAutoMovieActorWorldFrame";
import { actorContextWorldFrame } from "./actorContextWorldFrame";

/**
 * Resolve an admitted motion root at shot-local seconds through the context's staged rigid world frame. Missing motion or a null sampled root returns null. Output rotation and heading include the motion root; root scale is not represented.
 *
 * @evidence contracts/common.md#principled-implementation Samples once, rotates root translation by staged heading, adds staged position, composes rotations in staged-then-root order and projects rotated +Z to a degree heading.
 * @evidence contracts/common.md#clear-and-simple-design Uses actorContextWorldFrame for the shared staged conversion instead of a second quaternion convention; motion interpolation remains with sampleMotion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Null is preserved rather than replaced with a fabricated live frame; arbitrary affine scale is outside the synthesis context and is not collapsed into this rigid result.
 * @evidence contracts/common.md#meaningful-documentation States shot-local seconds, world metres, root presence, composition order and absent scale.
 * @evidence contracts/performance.md#efficient-algorithms One motion sample plus constant vector/quaternion arithmetic; sampling cost depends on its K keyframes and J interpolated joints, while frame assembly adds constant storage.
 * @evidence contracts/performance.md#reuse-equivalent-work The sampled pose root serves both translation and orientation in this invocation; no duplicate sampling or cache across mutable motion inputs occurs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns fresh frame values; motion/context inputs are borrowed and no retained pose cache, renderer or task is acquired.
 */
export const resolveActorWorldFrame: (
  context: IAutoMovieActorContext,
  motion: IAutoMovieMotion | undefined,
  seconds: number,
) => IAutoMovieActorWorldFrame | null = (
  context: IAutoMovieActorContext,
  motion: IAutoMovieMotion | undefined,
  seconds: number,
): IAutoMovieActorWorldFrame | null => {
  if (motion === undefined) return null;
  const root: IAutoMovieTransform | null = sampleMotion(motion, seconds).pose
    .root;
  if (root === null) return null;
  const staged: IAutoMovieActorWorldFrame = actorContextWorldFrame(context);
  const rotation: IAutoMovieQuaternion = Quaternion.multiply(
    staged.rotation,
    root.rotation,
  );
  const forward: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
    x: 0,
    y: 0,
    z: 1,
  });
  return {
    position: Vector3.add(
      staged.position,
      Quaternion.rotateVector(staged.rotation, root.translation),
    ),
    rotation,
    facingDeg: (Math.atan2(forward.x, forward.z) * 180) / Math.PI,
  };
};
