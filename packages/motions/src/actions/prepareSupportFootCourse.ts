import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { HumanFoot } from "../posture/HumanFoot";
import type { supportCourse } from "./supportCourse";

/**
 * Prepare a writer that puts one foot, flat and facing the route's heading,
 * on the straight course between two toe-joint positions. Between two
 * fitted keys the joint-space blend can sweep a free foot through an edge
 * the keys clear, and can tilt a bearing foot off a level top; the writer
 * replaces the leg's goal with the foot on its course. With `bearing` the
 * goal plants the foot, and with equal ends it holds the foot in place.
 *
 * @param body The canonical motion body.
 * @param side The foot.
 * @param yaw The route's heading, degrees.
 * @param from The toe joint's first position, world metres.
 * @param to The toe joint's last position, world metres.
 * @param bearing Whether the foot bears on its target rather than swings; a swing when absent.
 * @returns A writer of that leg and its toes at a share in [0, 1] of the course, leaving the other limbs alone.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the course, frame, units, the bearing default and what is written.
 * @evidence contracts/development/implementation.md#principled-implementation Places the body's rigid foot by its real toe-joint offset at the linearly interpolated world point and fits the leg to it with the shared leg placement.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepares the foot and leg geometry once; each call reads one point and writes one limb.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The held feet and hands keep the support law's fits.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant preparation; one leg placement per call.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The foot frame, rotation and leg placement are prepared once and shared by every call.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The writer retains only its prepared geometry.
 */
export function prepareSupportFootCourse(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  yaw: number,
  from: IAutoMovieVector3,
  to: IAutoMovieVector3,
  bearing: boolean = false,
): supportCourse.Write {
  const at: ReturnType<typeof HumanFoot.prepareAt> = HumanFoot.prepareAt(
    body,
    side,
    "mtp",
    yaw,
    0,
  );
  const rotation: IAutoMovieQuaternion = HumanFoot.rotation(yaw, 0);
  const goal: ReturnType<typeof AutoMovieMotionHumanLeg.preparePlacement> =
    AutoMovieMotionHumanLeg.preparePlacement(body, side, rotation);
  const contact: IAutoMovieVector3 = HumanFoot.offset(body, side, "mtp");
  const leg: AutoMovieHumanLimb = side === "left" ? "leftLeg" : "rightLeg";
  const toes: AutoMovieHumanoidBone =
    side === "left" ? "leftToes" : "rightToes";
  return (
    posture: IAutoMovieMotionHumanPosture,
    share: number,
  ): IAutoMovieMotionHumanPosture => ({
    ...posture,
    joints: { ...posture.joints, [toes]: [0, 0, 0] },
    limbs: {
      ...posture.limbs,
      [leg]: {
        ...goal(posture, at(Vector3.lerp(from, to, share)), bearing),
        contact,
      },
    },
  });
}
