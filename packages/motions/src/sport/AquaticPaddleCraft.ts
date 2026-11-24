import {
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanSupportCarry,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanSupportCarry } from "../carrier/HumanSupportCarry";
import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { seated } from "../everyday/seated";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFoot } from "../posture/HumanFoot";
import { humanPostureHeading } from "../posture/humanPostureHeading";
import { poseBones } from "../posture/poseBones";
import { AquaticPosture } from "./AquaticPosture";
import { AquaticProp } from "./AquaticProp";

const SIDES = ["left", "right"] as const;
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/**
 * The native canoe and kayak stance and its independently moving handheld
 * paddle.
 */
export namespace AquaticPaddleCraft {
  /** One native boat stance and paddle's two grip windows. */
  export interface IStroke {
    /** Both hands grip the same independently posed paddle prop. */
    hands: IAutoMovieMotionHumanContactWindow[];
    /** Action seconds to establish the grips before the first catch. */
    lead: number;
    /** Current hull-bearing pose and both fitted anatomical grip goals. */
    posture(
      shape: IAutoMovieMotionHumanPosture,
      seconds: number,
    ): IAutoMovieMotionHumanPosture;
  }

  /** Fit the appropriate craft stance and both hands to the displayed prop. */
  export function bind(
    context: AquaticPosture.Context,
    hull: string,
    paddle: string,
    canoe: boolean,
    side: AutoMovieHumanSide,
  ): IStroke {
    const { body, start } = context;
    const tool: IAutoMovieMotionHumanPropReader = context.prop(paddle);
    const carrier: IAutoMovieMotionHumanPropReader = context.prop(hull);
    const pose = canoe ? kneel(context, carrier, side) : sit(context, carrier);
    const names: Readonly<Record<AutoMovieHumanSide, string>> = canoe
      ? side === "left"
        ? { left: "shaftGrip", right: "topGrip" }
        : { left: "topGrip", right: "shaftGrip" }
      : { left: "leftGrip", right: "rightGrip" };
    const rest: AquaticProp.IContacts = AquaticProp.at(tool, start);
    for (const hand of SIDES) rest.require(names[hand], "handle");
    if (canoe) rest.require("bladeTip", "surface");
    else for (const hand of SIDES) rest.require(`${hand}Tip`, "surface");

    return {
      lead: canoe ? 0.28 : 0,
      hands: SIDES.map(
        (hand): IAutoMovieMotionHumanContactWindow => ({
          part: `${hand}Hand`,
          kind: "grip",
          from: 0,
          to: 1,
          support: { kind: "prop", subject: paddle, carries: false },
        }),
      ),
      posture(shape, seconds) {
        const posture: IAutoMovieMotionHumanPosture = pose(shape, seconds);
        const current: AquaticProp.IContacts = AquaticProp.at(
          tool,
          start + seconds,
        );
        for (const hand of SIDES)
          posture.limbs[`${hand}Arm`] = AquaticProp.hold(
            body,
            posture,
            hand,
            current.require(names[hand], "handle").world,
          );
        return posture;
      },
    };
  }
}

/**
 * Carry the actual entered half-kneel and change only the stroke's upper-body
 * joints.
 */
function kneel(
  { body, entry, start }: AquaticPosture.Context,
  hull: IAutoMovieMotionHumanPropReader,
  side: AutoMovieHumanSide,
): IStrokePose {
  const floor: AquaticProp.IContact = AquaticProp.at(hull, start).require(
    "floor",
    "surface",
  );
  const region =
    body.surfaces.regions[side === "left" ? "kneeLeft" : "kneeRight"];
  const front = side === "left" ? "right" : "left";
  const read = poseBones(body, entry.pose, undefined, new Set([region.bone]));
  const knee: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
    region,
    read.get(region.bone)!,
  ).point;
  const centers: IAutoMovieVector3[] = [knee, entry.feet[front].ankle];
  const misses: boolean = centers
    .map(
      (point): IAutoMovieVector3 =>
        Quaternion.rotateVector(
          Quaternion.inverse(floor.world.rotation),
          Vector3.subtract(point, floor.world.translation),
        ),
    )
    .some(
      (point, i): boolean =>
        Math.abs(point.x) > (floor.affordance.width ?? 0) / 2 ||
        Math.abs(point.z) > (floor.affordance.depth ?? 0) / 2 ||
        Math.abs(
          point.y -
            (i === 0 ? body.measure.shankRadius : body.measure.ankleHeight),
        ) > 0.025,
    );
  if (misses)
    throw new HumanRefusal({
      kind: "reach",
      axis: "support",
      value: hull.prop.subject,
      reason:
        "the selected knee and opposite foot must enter on the canoe floor",
      fix: "compose a half-kneel on the floor before the stroke",
    });
  return (shape, seconds): IAutoMovieMotionHumanPosture => {
    const carry: IAutoMovieMotionHumanSupportCarry.ICarry =
      HumanSupportCarry.of(hull.frame, start, start + seconds);
    const current: IAutoMovieMotionHumanPosture = HumanSupportCarry.posture(
      carry,
      entry.posture,
    );
    return {
      ...current,
      ...humanPostureHeading.angles(
        Quaternion.multiply(carry.turn, humanPostureHeading(entry.posture)),
      ),
      joints: {
        ...current.joints,
        spine: shape.joints.spine,
        chest: shape.joints.chest,
        neck: shape.joints.neck,
      },
      limbs: {
        leftLeg: current.limbs.leftLeg,
        rightLeg: current.limbs.rightLeg,
      },
    };
  };
}

/** Fit the seat surface and both forefeet at the actual kayak brace angles. */
function sit(
  { body, start }: AquaticPosture.Context,
  hull: IAutoMovieMotionHumanPropReader,
): IStrokePose {
  const entry = AquaticProp.at(hull, start);
  entry.require("seat", "seat");
  for (const foot of SIDES) entry.require(`${foot}Foot`, "surface");
  const quarter = Quaternion.fromAxisAngle(UP, 90);
  return (shape, seconds): IAutoMovieMotionHumanPosture => {
    const current: AquaticProp.IContacts = AquaticProp.at(
      hull,
      start + seconds,
    );
    const seat: AquaticProp.IContact = current.require("seat", "seat");
    const center: IAutoMovieVector3 = Vector3.add(
      seat.world.translation,
      Quaternion.rotateVector(seat.world.rotation, {
        x: 0,
        y: 0,
        z: -(seat.affordance.depth ?? 0) / 2,
      }),
    );
    const posture: IAutoMovieMotionHumanPosture = {
      ...shape,
      ...humanPostureHeading.angles(seat.world.rotation),
      limbs: {},
    };
    posture.root = seated.root(body, center, posture);
    for (const side of SIDES) {
      const plate = current.require(`${side}Foot`, "surface").world;
      const rotation = Quaternion.multiply(plate.rotation, quarter);
      const contact: IAutoMovieVector3 = HumanFoot.offset(body, side, "ball");
      const ankle: IAutoMovieVector3 = Vector3.subtract(
        plate.translation,
        Quaternion.rotateVector(rotation, contact),
      );
      posture.limbs[`${side}Leg`] = {
        ...AutoMovieMotionHumanLeg.goal(
          body,
          posture,
          side,
          { ankle, rotation },
          false,
        ),
        contact,
      };
    }
    return posture;
  };
}

type IStrokePose = (
  shape: IAutoMovieMotionHumanPosture,
  seconds: number,
) => IAutoMovieMotionHumanPosture;
