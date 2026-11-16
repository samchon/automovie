import type { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";

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
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepare two heading rotations and contacts, then evaluate the original knee-frame transforms per current root.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No body placement, toe-out value, contact, planted flag or transform grouping changes.
 * @evidence contracts/development/implementation.md#efficient-algorithms Heading quaternions and body-local contact offsets are calculated once per fixed-yaw plan; each query retains its two changing knee transforms and fresh output records.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The body, heading and toe-out define equivalent fixed geometry; different roots and ankle points are always read afresh.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One plan owns two fixed foot records until release; returned rotation/contact vectors are fresh copies and no time-query output or solver reader is retained.
 */
export function prepareStandingLegs(body: IHumanBody, yaw: number, toeOut: number): (root: IAutoMovieVector3, feet: Record<"left" | "right", IAutoMovieVector3>) => IHumanPosture["limbs"] {
  const foot = (side: "left" | "right"): { yaw: number; rotation: IAutoMovieQuaternion; contact: IAutoMovieVector3 } => {
    const heading: number = yaw + (side === "left" ? toeOut : -toeOut);
    return { yaw: heading, rotation: HumanFrame.turn(heading), contact: HumanFoot.offset(body, side, "mtp") };
  };
  const fixed: Record<"left" | "right", ReturnType<typeof foot>> = { left: foot("left"), right: foot("right") };
  return (root: IAutoMovieVector3, feet: Record<"left" | "right", IAutoMovieVector3>): IHumanPosture["limbs"] => {
    const limbs: IHumanPosture["limbs"] = {};
    for (const side of ["left", "right"] as const) {
      const prepared: ReturnType<typeof foot> = fixed[side];
      limbs[`${side}Leg`] = {
        point: feet[side],
        bend: HumanFrame.point({ origin: HumanFrame.point({ origin: root, yaw }, body.rest.get(`${side}LowerLeg`)!), yaw: prepared.yaw }, { x: 0, y: 0, z: 1 }),
        rotation: { ...prepared.rotation },
        planted: true,
        contact: { ...prepared.contact },
      };
    }
    return limbs;
  };
}
