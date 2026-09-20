import { IAutoMovieMotion } from "@automovie/interface";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { sampleMotion } from "../motion/sampleMotion";
import { IAutoMovieActorContext } from "./IAutoMovieActorContext";
import { IAutoMovieActorWorldFrame } from "./IAutoMovieActorWorldFrame";

const staticActorWorldFrame = (
  context: IAutoMovieActorContext,
): IAutoMovieActorWorldFrame => ({
  position: context.position,
  rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, context.facingDeg),
  facingDeg: context.facingDeg,
});

/**
 * Resolve a motion root on top of the actor's staged world transform.
 *
 * @evidence requirements/motion/root-motion-and-trajectories.md#motion-root-authority-mode Composes clip-local root motion with the authored staged transform without double authority.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-procedural-gait-rule Produces the world root at one sampled instant.
 */
export const resolveActorWorldFrame = (
  context: IAutoMovieActorContext,
  motion: IAutoMovieMotion | undefined,
  seconds: number,
): IAutoMovieActorWorldFrame | null => {
  if (motion === undefined) return null;
  const root = sampleMotion(motion, seconds).pose.root;
  if (root === null) return null;
  const staged = staticActorWorldFrame(context);
  const rotation = Quaternion.multiply(staged.rotation, root.rotation);
  const forward = Quaternion.rotateVector(rotation, { x: 0, y: 0, z: 1 });
  return {
    position: Vector3.add(
      staged.position,
      Quaternion.rotateVector(staged.rotation, root.translation),
    ),
    rotation,
    facingDeg: (Math.atan2(forward.x, forward.z) * 180) / Math.PI,
  };
};
