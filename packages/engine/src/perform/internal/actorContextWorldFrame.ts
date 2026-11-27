import type {
  IAutoMovieActorContext,
  IAutoMovieActorWorldFrame,
} from "@automovie/interface";

import { Quaternion } from "../../math/Quaternion";

/**
 * Read the actor context's staged metre position and +Y heading as a rigid
 * world frame. The position is borrowed; rotation is a fresh quaternion. Scale
 * is absent from this synthesis context.
 */
export function actorContextWorldFrame(
  context: IAutoMovieActorContext,
): IAutoMovieActorWorldFrame {
  return {
    position: context.position,
    rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, context.facingDeg),
    facingDeg: context.facingDeg,
  };
}
