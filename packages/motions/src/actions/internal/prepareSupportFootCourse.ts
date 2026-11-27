import { AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanLeg } from "../../compose/internal/AutoMovieMotionHumanLeg";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import type { supportCourse } from "./supportCourse";

/*
 * Prepare a writer that puts one foot, flat and facing the route's heading, on
 * the straight course between two toe-joint positions. Between two fitted keys
 * the joint-space blend can sweep a free foot through an edge the keys clear,
 * and can tilt a bearing foot off a level top; the writer replaces the leg's
 * goal with the foot on its course. With `bearing` the goal plants the foot,
 * and with equal ends it holds the foot in place. Given the root at both ends,
 * the course is expressed in the moving root's frame, as an effector path is
 * while the root travels: the foot's offset from the root blends from its start
 * to its end offset. Both ends being reachable, every blend is, so the leg
 * never over-reaches mid-course.
 * Parameter body: The canonical motion body.
 * Parameter side: The foot.
 * Parameter yaw: The route's heading, degrees.
 * Parameter from: The toe joint's first position, world metres.
 * Parameter to: The toe joint's last position, world metres.
 * Parameter bearing: Whether the foot bears on its target rather than swings; a
 * swing when absent.
 * Parameter rootFrom: The root at the course's start, world metres; with ootTo the
 * course is carried by the moving root.
 * Parameter rootTo: The root at the course's end, world metres.
 * Returns: A writer of that leg and its toes at a share in [0, 1] of the
 * course, leaving the other limbs alone.
 */
export function prepareSupportFootCourse(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  yaw: number,
  from: IAutoMovieVector3,
  to: IAutoMovieVector3,
  bearing: boolean = false,
  rootFrom?: IAutoMovieVector3,
  rootTo?: IAutoMovieVector3,
): supportCourse.Write {
  const carried: boolean = rootFrom !== undefined && rootTo !== undefined;
  const fromOffset: IAutoMovieVector3 = carried
    ? AutoMovieEngineVector3.subtract(from, rootFrom!)
    : from;
  const toOffset: IAutoMovieVector3 = carried
    ? AutoMovieEngineVector3.subtract(to, rootTo!)
    : to;
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
        ...goal(
          posture,
          at(
            carried
              ? AutoMovieEngineVector3.add(
                  posture.root,
                  AutoMovieEngineVector3.lerp(fromOffset, toOffset, share),
                )
              : AutoMovieEngineVector3.lerp(from, to, share),
          ),
          bearing,
        ),
        contact,
      },
    },
  });
}
