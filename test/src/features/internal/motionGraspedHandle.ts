import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHand,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanHand
} from "../../../../packages/motions/src/posture/internal/HumanHand";

/**
 * A prop's frame in the hand bone's frame when the hand holds its handle as
 * a grasp holds one: the handle's approach (its -Y) runs into the palm along
 * the hand's grip socket normal and its wrapped axis (its +X) along the
 * socket's forward, so a shaft lies across the palm, and the handle's point
 * sits on the socket (`HumanGraspTarget`, `HumanGraspHand`). A staging that
 * puts an implement in a hand reads it here instead of an arbitrary turn.
 *
 * @param body The body.
 * @param side The holding hand.
 * @param handle The handle affordance's frame in the prop's frame.
 * @param working The implement's working point in the prop's frame: the handle is taken the way round that runs its working end out past the index finger, the socket's forward, as a racket's head or a club's head extends from the thumb side of the grip.
 * @returns The prop's frame in the hand bone's frame, metres and a unit quaternion.
 */
export function motionGraspedHandle(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  handle: IAutoMovieAffordance["frame"],
  working: IAutoMovieVector3,
): IAutoMovieRigidTransform {
  const socket: IAutoMovieMotionHumanHand.IFrame = HumanHand.offset(
    body,
    side,
    "grip",
  );
  // The handle's +X runs along it; the working end lies one way or the other.
  const toward: number = AutoMovieEngineVector3.dot(
    AutoMovieEngineQuaternion.rotateVector(handle.rotation, { x: 1, y: 0, z: 0 }),
    AutoMovieEngineVector3.subtract(working, handle.translation),
  );
  const turn: number = toward < 0 ? 180 : 0;
  const grasped: IAutoMovieQuaternion = HumanHand.align(
    { normal: { x: 0, y: -1, z: 0 }, forward: { x: 1, y: 0, z: 0 } },
    { normal: socket.normal, forward: socket.forward },
  );
  const rotation: IAutoMovieQuaternion = AutoMovieEngineQuaternion.normalize(
    AutoMovieEngineQuaternion.multiply(
      AutoMovieEngineQuaternion.multiply(
        grasped,
        AutoMovieEngineQuaternion.fromAxisAngle({ x: 0, y: -1, z: 0 }, turn),
      ),
      AutoMovieEngineQuaternion.inverse(handle.rotation),
    ),
  );
  return {
    position: AutoMovieEngineVector3.subtract(
      socket.point,
      AutoMovieEngineQuaternion.rotateVector(rotation, handle.translation),
    ),
    rotation,
  };
}
