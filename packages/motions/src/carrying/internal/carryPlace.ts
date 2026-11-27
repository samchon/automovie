import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCarry,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanTrunk } from "../../everyday/internal/HumanTrunk";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { HumanHand } from "../../posture/internal/HumanHand";

/** The authored trunk channels a hold place reads when given. */
type CarryPostureItem = "pitch" | "roll" | "joints";

/** The channels that carry a hold place's floor frame. */
type CarryPosture2 = "root" | "yaw";

/**
 * Root and heading with the optional authored trunk channels that move a hand's
 * support frame.
 */
type CarryPosture = Pick<IAutoMovieMotionHumanPosture, CarryPosture2> &
  Partial<Pick<IAutoMovieMotionHumanPosture, CarryPostureItem>>;

/** A same-body FK loan scoped to the current posture evaluation. */
type FK = Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2];

/**
 * A hand's hold place in the performer's moving floor frame (`carry`).
 *
 * @param body The body.
 * @param posture The posture whose root and heading carry the frame.
 * @param how How the load is held.
 * @param side The hand.
 * @param loaded The loaded side.
 * @param resolution The existing same-body FK reader when the handle rides the
 *   shoulders.
 * @returns The point and the outward normal of the place, world, or undefined
 *   for a free hand.
 */
export function carryPlace(
  body: IAutoMovieMotionHumanBody,
  posture: CarryPosture,
  how: IAutoMovieMotionHumanCarry.How,
  side: AutoMovieHumanSide,
  loaded: AutoMovieHumanSide,
  resolution?: FK,
): IAutoMovieMotionHumanCarry.IPlaceResult {
  const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
  const arm: number = m.upperArm + m.forearm;
  const out: number = side === "left" ? 1 : -1;
  const frame: IAutoMovieMotionHumanFrame = {
    origin: { x: posture.root.x, y: 0, z: posture.root.z },
    yaw: posture.yaw,
  };
  const turn: (v: IAutoMovieVector3) => IAutoMovieVector3 = (
    v: IAutoMovieVector3,
  ): IAutoMovieVector3 =>
    HumanFrame.point({ origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw }, v);
  // A pushed handle at the elbow's height (Hoozemans et al. 1998) is held
  // with the upper arm hanging and the forearm level, so the grip lies the
  // shoulder less the upper arm high and a forearm ahead, a shoulder width
  // apart. The box's and the child's places are shares of the body's
  // measures standing in for the load's own size, which a load that is not
  // yet a prop cannot give (the namespace's "not yet").
  switch (how) {
    case "twoHands":
      return {
        point: HumanFrame.point(frame, {
          x: out * 0.8 * m.shoulderHalfWidth,
          y: m.waistHeight,
          z: Math.max(
            arm / 3,
            forwardAbdomen(body, posture, frame, resolution) + m.forearmRadius,
          ),
        }),
        normal: turn({ x: -out, y: 0, z: 0 }),
      };
    case "push": {
      // The handle is carried from the shoulder line. A root-relative
      // handle lets forward trunk inclination drive the arm through it.
      const shoulder: IAutoMovieVector3 = measuredShoulder(
        body,
        posture,
        side,
        resolution,
      );
      return {
        point: Vector3.add(
          shoulder,
          turn({
            x: out * m.forearmRadius,
            y: -m.upperArm,
            z: m.forearm,
          }),
        ),
        normal: { x: 0, y: 1, z: 0 },
      };
    }
    case "hip": {
      if (side !== loaded) return undefined;
      // The child's seat rides beside the hip joint. The palm lies one
      // extended finger span outside the outer thigh, leaving room for the
      // hand that slides inward beneath the seat.
      const bone: AutoMovieHumanoidBone = `${side}UpperLeg`;
      const hip: IAutoMovieVector3 = HumanTrunk.resolve(
        body,
        trunkOf(posture),
        undefined,
        resolution,
        new Set([bone]),
      ).get(bone)!.worldPosition;
      const palm: IAutoMovieVector3 = HumanHand.offset(
        body,
        side,
        "palm",
      ).point;
      const finger: number = m.hand - Vector3.length(palm);
      return {
        point: Vector3.add(
          hip,
          turn({ x: out * (m.thighRadius + finger), y: 0, z: 0.2 * arm }),
        ),
        normal: { x: 0, y: -1, z: 0 },
      };
    }
    case "oneHand":
      return undefined;
  }
}

/** The current abdomen's front in the walking floor frame. */
function forwardAbdomen(
  body: IAutoMovieMotionHumanBody,
  posture: CarryPosture,
  frame: IAutoMovieMotionHumanFrame,
  resolution?: FK,
): number {
  const abdomen: ReturnType<typeof HumanTrunk.region> = HumanTrunk.region(
    body,
    trunkOf(posture),
    "abdomen",
    resolution,
  );
  return HumanFrame.local(frame, abdomen.point).z;
}

/** The pushing arm's current shoulder, carried by the actual girdle. */
function measuredShoulder(
  body: IAutoMovieMotionHumanBody,
  posture: CarryPosture,
  side: AutoMovieHumanSide,
  resolution?: FK,
): IAutoMovieVector3 {
  const bone: AutoMovieHumanoidBone = `${side}UpperArm`;
  return HumanTrunk.resolve(
    body,
    trunkOf(posture),
    undefined,
    resolution,
    new Set([bone]),
  ).get(bone)!.worldPosition;
}

/**
 * A root-only caller uses the upright rest frame; a shown trunk keeps its
 * articulation.
 */
function trunkOf(posture: CarryPosture): IAutoMovieMotionHumanPosture {
  return {
    ...posture,
    pitch: posture.pitch ?? 0,
    roll: posture.roll ?? 0,
    joints: posture.joints ?? {},
    limbs: {},
  };
}
