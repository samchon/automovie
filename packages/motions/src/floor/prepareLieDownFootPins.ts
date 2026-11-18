import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../posture/HumanFoot";

/** Posed bones of the ankles, knees and actual sole sockets. */
type Bones = Parameters<typeof HumanFoot.sockets>[1];

/** One retained point of a sole, selected by the posture it bears on. */
interface IPin {
  /** The leg keeping this plant. */
  side: AutoMovieHumanSide;

  /** The point of the sole about which the foot rolls. */
  socket: IAutoMovieMotionHumanFoot.Socket;

  /** The foot's point of contact at the standing key, world metres. */
  point: IAutoMovieVector3;
}

/** Place the actual landed root and its two foot goals. */
type Write = (posture: IAutoMovieMotionHumanPosture, bones: Bones) => IAutoMovieMotionHumanPosture;

/**
 * Keep both soles fixed while a standing body lowers before it lies down.
 * Each foot pivots on its own bearing socket from the route's first key.
 * The root's existing averaged course and the displayed foot orientations
 * supply the knee poles and foot rotations for the two-bone solver.
 *
 * @param body The body's sole sockets.
 * @param standing The posed standing feet, in world metres.
 * @param landing The relative bones of the first lowered posture.
 * @returns The writer for the initial descent.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the pivot selection, frames, window and retained course.
 * @evidence contracts/development/implementation.md#principled-implementation Selects each foot's lowest heel, ball or toe at the first lowered posture. Its translated ankle preserves the rotation and toe articulation from the current course while keeping that socket fixed from entry.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Two immutable anchors precede the two current limb goals.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The actual entry and foot geometry determine the anchors. Their motion is never approximated by a common translation.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Two legs with a fixed number of soles and constant vector work per query.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the same posed feet the route already reads for the pelvis path.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Keeps a body reference and its two anchors while the plan lives. The actual poses and bones do not escape the write.
 */
export function prepareLieDownFootPins(
  body: IAutoMovieMotionHumanBody,
  standing: Bones,
  landing: Bones,
): Write {
  const feet: IPin[] = SIDES.map((side: AutoMovieHumanSide): IPin => {
    const socket: IAutoMovieMotionHumanFoot.Socket = HumanFoot.sockets(body, landing, side).reduce(
      (lowest: IAutoMovieMotionHumanFoot.ISocket, other: IAutoMovieMotionHumanFoot.ISocket): IAutoMovieMotionHumanFoot.ISocket =>
        other.point.y < lowest.point.y ? other : lowest,
    ).socket;
    return {
      side,
      socket,
      point: HumanFoot.sockets(body, standing, side).find(
        (s: IAutoMovieMotionHumanFoot.ISocket): boolean => s.socket === socket,
      )!.point,
    };
  });
  return (posture: IAutoMovieMotionHumanPosture, bones: Bones): IAutoMovieMotionHumanPosture => {
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
    for (const { side, socket, point } of feet) {
      const placed: IAutoMovieVector3 = HumanFoot.sockets(body, bones, side).find(
        (s: IAutoMovieMotionHumanFoot.ISocket): boolean => s.socket === socket,
      )!.point;
      const ankle: IAutoMovieResolvedBone = bones.get(`${side}Foot`)!;
      const knee: IAutoMovieResolvedBone = bones.get(`${side}LowerLeg`)!;
      limbs[`${side}Leg`] = {
        point: Vector3.add(point, Vector3.subtract(ankle.worldPosition, placed)),
        rotation: ankle.worldRotation,
        bend: Vector3.add(knee.worldPosition, posture.root),
        planted: true,
      };
    }
    return { ...posture, limbs };
  };
}

/** Fixed order for the feet of a standing posture. */
const SIDES: readonly AutoMovieHumanSide[] = ["left", "right"];
