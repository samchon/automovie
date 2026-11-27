import type {
  IAutoMovieActorContext,
  IAutoMovieActorWorldFrame,
  IAutoMovieMotion,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../../math/Quaternion";
import { Vector3 } from "../../math/Vector3";
import { AutoMovieEngineMotionSampling } from "../../motion/AutoMovieEngineMotionSampling";
import { actorContextWorldFrame } from "./actorContextWorldFrame";

/**
 * Resolve an admitted motion root at shot-local seconds through the context's
 * staged rigid world frame. Missing motion or a null sampled root returns null.
 * Output rotation and heading include the motion root; root scale is not
 * represented.
 */
export function resolveActorWorldFrame(
  context: IAutoMovieActorContext,
  motion: IAutoMovieMotion | undefined,
  seconds: number,
): IAutoMovieActorWorldFrame | null {
  if (motion === undefined) return null;
  const root: IAutoMovieTransform | null = AutoMovieEngineMotionSampling.sampleRoot(motion, seconds);
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
}
