import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../../posture/internal/HumanFoot";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { standingLegs } from "./standingLegs";

/*
 * Prepare a standing body's two toe-out headings and metatarsophalangeal
 * contacts for one fixed yaw. Each query places the knees from its current root
 * and reads its supplied world-metre ankle targets.
 * Parameter body: The unchanged body of this stance.
 * Parameter yaw: Its fixed heading, degrees about +Y.
 * Parameter toeOut: The standing law's outward foot progression angle, degrees.
 * Returns: A fresh pair of planted leg goals for a root and two ankle points.
 */
export function prepareStandingLegs(
  body: IAutoMovieMotionHumanBody,
  yaw: number,
  toeOut: number,
): (
  root: IAutoMovieVector3,
  feet: Record<AutoMovieHumanSide, IAutoMovieVector3>,
) => IAutoMovieMotionHumanPosture["limbs"] {
  /*
   * Fixed heading rotation and body-local contact of one side.
   */
  function foot(side: AutoMovieHumanSide): IFootResult {
    const heading: number = yaw + (side === "left" ? toeOut : -toeOut);
    const rest: ReturnType<typeof HumanFrame.preparePoint> =
      HumanFrame.preparePoint(yaw, body.rest.get(`${side}LowerLeg`)!);
    const ahead: ReturnType<typeof HumanFrame.preparePoint> =
      HumanFrame.preparePoint(heading, { x: 0, y: 0, z: 1 });
    return {
      yaw: heading,
      rotation: HumanFrame.turn(heading),
      contact: HumanFoot.offset(body, side, "mtp"),
      knee: (root: IAutoMovieVector3): IAutoMovieVector3 => ahead(rest(root)),
    };
  }
  const fixed: Record<AutoMovieHumanSide, ReturnType<typeof foot>> = {
    left: foot("left"),
    right: foot("right"),
  };
  return (
    root: IAutoMovieVector3,
    feet: Record<AutoMovieHumanSide, IAutoMovieVector3>,
  ): IAutoMovieMotionHumanPosture["limbs"] =>
    standingLegs(body, root, yaw, feet, toeOut, fixed);
}

/*
 * The record of `IFootResult`'s site.
 */
type IFootResult = {
  yaw: number;
  rotation: IAutoMovieQuaternion;
  contact: IAutoMovieVector3;
  knee: (root: IAutoMovieVector3) => IAutoMovieVector3;
};
