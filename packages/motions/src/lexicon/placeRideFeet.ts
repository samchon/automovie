import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanRide,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFoot } from "../posture/HumanFoot";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/** A named foot bearing uses the same target for pose writing and admission. */
export interface IRideFoot {
  side: AutoMovieHumanSide;
  id: string;
  contact: IAutoMovieVector3;
  at(film: number): { point: IAutoMovieVector3; normal: IAutoMovieVector3 };
}

/** A foot already resting on a part preserves its entry offset during a ride. */
interface IRidePedal {
  side: AutoMovieHumanSide;
  id: string;
  began: IAutoMovieVector3;
}

/** Separate explicitly acquired supports from the existing part-relative pedal reads. */
export function prepareRideFootSupports(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanRide.IParams>,
  support: IAutoMovieMotionHumanPropReader,
): { pedals: IRidePedal[]; placed: IRideFoot[] } {
  const { feet, on, placeFeet } = context.params;
  const { limbs } = context.entry.posture;
  const pedals: IRidePedal[] = [];
  const placed: IRideFoot[] = [];
  for (const side of ["left", "right"] as const) {
    const id = feet?.[side];
    if (id === undefined) continue;
    if (
      support.prop.points[id] === undefined ||
      limbs[`${side}Leg`] === undefined
    )
      throw new HumanRefusal({
        kind: "affordance",
        axis: "feet",
        value: id,
        feasible: {
          kind: "alternatives",
          values: Object.keys(support.prop.points),
        },
        reason:
          support.prop.points[id] === undefined
            ? `${on} has no point ${id} for the ${side} foot`
            : `the ${side} foot rests on nothing of ${on} when the ride begins`,
        fix: "name one of the support's points, and sit with that foot on its rest first",
      });
    if (placeFeet === true)
      placed.push(placedRideFoot(context, support, side, id));
    else {
      const began = support.prop.point?.(id, context.start)?.point;
      if (began !== undefined) pedals.push({ side, id, began });
    }
  }
  return { pedals, placed };
}

/** Resolve an explicitly acquired support to its live pedal or tread surface. */
function placedRideFoot(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanRide.IParams>,
  support: IAutoMovieMotionHumanPropReader,
  side: AutoMovieHumanSide,
  id: string,
): IRideFoot {
  const contact = HumanFoot.offset(context.body, side, "ball");
  const rest = support.prop.points[id]!;
  const surface = support.prop.affordances?.find((item) => item.id === id);
  if (
    surface === undefined ||
    !["pedal", "bar", "stirrup", "surface"].includes(surface.kind)
  )
    throw new HumanRefusal({
      kind: "affordance",
      axis: "feet",
      value: id,
      feasible: null,
      reason: id + " is not a material foot support",
      fix: "name a pedal, tread, stirrup or bearing surface",
    });
  return {
    side,
    id,
    contact,
    at(film) {
      const point = support.prop.point?.(id, film);
      if (point !== undefined) return point;
      const frame = support.frame(film);
      return {
        point: Vector3.add(
          frame.position,
          Quaternion.rotateVector(frame.rotation, rest.point),
        ),
        normal: Quaternion.rotateVector(frame.rotation, rest.normal),
      };
    },
  };
}

/** Move the displayed ball from its carried pose to the surface, level with its forward slope. */
export function acquireRideFoot(
  foot: IRideFoot,
  pose: IAutoMovieMotionHumanPosture,
  film: number,
  share: number,
): IAutoMovieHumanLimbGoal {
  const goal = pose.limbs[foot.side === "left" ? "leftLeg" : "rightLeg"]!;
  if (share <= 0) return goal;
  const level = resolveHumanPosture.heading(pose);
  const entry = goal.rotation ?? level;
  const target = foot.at(film);
  const normal = Quaternion.rotateVector(
    Quaternion.inverse(level),
    target.normal,
  );
  const bearing: IAutoMovieQuaternion = Quaternion.multiply(
    level,
    Quaternion.fromAxisAngle(
      { x: 1, y: 0, z: 0 },
      (Math.atan2(normal.z, normal.y) * 180) / Math.PI,
    ),
  );
  const rotation = Quaternion.slerp(entry, bearing, share);
  const ball = Vector3.lerp(
    Vector3.add(goal.point, Quaternion.rotateVector(entry, foot.contact)),
    target.point,
    share,
  );
  return {
    ...goal,
    point: Vector3.subtract(
      ball,
      Quaternion.rotateVector(rotation, foot.contact),
    ),
    contact: foot.contact,
    rotation,
  };
}

/** Refuse an exact-support request when the displayed sole cannot meet its named surface. */
export function admitPlacedRideFeet(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanRide.IParams>,
  feet: readonly IRideFoot[],
  posture: (local: number) => IAutoMovieMotionHumanPosture,
  from: number,
): void {
  const sockets = feet.map(
    ({ side }) =>
      context.body.surfaces.sockets[side === "left" ? "ballLeft" : "ballRight"],
  );
  const bones = poseBones.prepare(
    context.body,
    new Set<AutoMovieHumanoidBone>(sockets.map(({ bone }) => bone)),
  );
  const duration = context.params.seconds;
  const sampleCount = Math.max(1, Math.ceil((duration - from) * 24));
  for (let index = 0; index <= sampleCount; ++index) {
    const local = from + ((duration - from) * index) / sampleCount;
    const placed = bones(resolveHumanPosture(context.body, posture(local)));
    for (const [index, foot] of feet.entries()) {
      const socket = sockets[index]!;
      const bone = placed.get(socket.bone)!;
      const shown = Vector3.add(
        bone.worldPosition,
        Quaternion.rotateVector(bone.worldRotation, socket.point),
      );
      const gap = Vector3.distance(shown, foot.at(context.start + local).point);
      if (gap > HumanFoot.BEARING)
        throw new HumanRefusal({
          kind: "reach",
          axis: "feet",
          value: foot.id,
          feasible: {
            kind: "range",
            minimum: 0,
            maximum: HumanFoot.BEARING,
            unit: "m",
          },
          reason:
            foot.side +
            " sole misses " +
            foot.id +
            " by " +
            (1000 * gap).toFixed(1) +
            " mm at " +
            local.toFixed(2) +
            " s",
          fix: "use a seat and foot support within the performer's seated reach",
        });
    }
  }
}
