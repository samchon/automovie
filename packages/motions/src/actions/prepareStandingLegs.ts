import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { standingLegs } from "./standingLegs";

/**
 * Prepare a standing body's two toe-out headings and metatarsophalangeal
 * contacts for one fixed yaw. Each query places the knees from its current
 * root and reads its supplied world-metre ankle targets.
 *
 * @param body The unchanged body of this stance.
 * @param yaw Its fixed heading, degrees about +Y.
 * @param toeOut The standing law's outward foot progression angle, degrees.
 * @returns A fresh pair of planted leg goals for a root and two ankle points.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States fixed inputs, degree/world-metre units and fresh goal ownership.
 * @evidence contracts/development/implementation.md#principled-implementation Retains the standing law's knee frame over each foot and foot rotation about +Y, with the same canonical HumanFoot metatarsophalangeal contact.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepare two heading rotations, contacts and nested knee-frame point readers, then evaluate their original ordered additions on each current root.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No body placement, toe-out value, contact, planted flag or transform grouping changes.
 * @evidence contracts/development/implementation.md#efficient-algorithms Heading quaternions, body-local contacts and the two-stage knee transforms' fixed trigonometry/products prepare once per fixed-yaw plan; each query retains both stages' original root additions and fresh outputs.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The body, heading and toe-out define equivalent fixed geometry; different roots and ankle points are always read afresh.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One plan owns two fixed foot records until release; returned rotation/contact vectors are fresh copies and no time-query output or solver reader is retained.
 */
export function prepareStandingLegs(
  body: IHumanBody,
  yaw: number,
  toeOut: number,
): (
  root: IAutoMovieVector3,
  feet: Record<"left" | "right", IAutoMovieVector3>,
) => IHumanPosture["limbs"] {
  /** Fixed heading rotation and body-local contact of one side. */
  function foot(side: "left" | "right"): {
    yaw: number;
    rotation: IAutoMovieQuaternion;
    contact: IAutoMovieVector3;
    knee: (root: IAutoMovieVector3) => IAutoMovieVector3;
  } {
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
  const fixed: Record<"left" | "right", ReturnType<typeof foot>> = {
    left: foot("left"),
    right: foot("right"),
  };
  return (
    root: IAutoMovieVector3,
    feet: Record<"left" | "right", IAutoMovieVector3>,
  ): IHumanPosture["limbs"] =>
    standingLegs(body, root, yaw, feet, toeOut, fixed);
}
