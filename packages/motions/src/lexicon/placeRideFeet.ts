import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieHumanLimbGoal,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanRide,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFoot } from "../posture/HumanFoot";
import { humanPostureHeading } from "../posture/humanPostureHeading";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * Fit explicitly staged feet to the moving support and verify the displayed
 * soles.
 */
export namespace placeRideFeet {
  /** A named foot bearing uses the same target for pose writing and admission. */
  export interface IRideFoot {
    /** The rider's foot that bears. */
    side: AutoMovieHumanSide;

    /** The supporting affordance on the carried model. */
    id: string;

    /** The ball of the foot in its bone frame, metres. */
    contact: IAutoMovieVector3;

    /** Read the support point and its outward normal in world coordinates. */
    at(film: number): IAutoMovieMotionHumanProp.IPlacedPoint;
  }

  /** A foot already resting on a part preserves its entry offset during a ride. */
  export interface IRidePedal {
    /** The rider's foot on the part. */
    side: AutoMovieHumanSide;

    /** The part's point on the carried model. */
    id: string;

    /** The point in the world when the ride begins, metres. */
    began: IAutoMovieVector3;
  }

  /**
   * A ride's feet: those that keep a part-relative entry, and those fitted to a
   * named support.
   */
  export interface ISupports {
    /** Feet already resting on a moving part. */
    pedals: IRidePedal[];

    /** Feet acquired onto their named support. */
    placed: IRideFoot[];
  }

  /**
   * Separate explicitly acquired supports from the existing part-relative pedal
   * reads.
   */
  export function supports(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanRide.IParams>,
    support: IAutoMovieMotionHumanPropReader,
  ): ISupports {
    const { feet, on, placeFeet }: IAutoMovieMotionHumanRide.IParams =
      context.params;
    const { limbs }: IAutoMovieMotionHumanPosture = context.entry.posture;
    const pedals: IRidePedal[] = [];
    const placed: IRideFoot[] = [];
    for (const side of ["left", "right"] as const) {
      const id: string | undefined = feet?.[side];
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
        const began: IAutoMovieVector3 | undefined = support.prop.point?.(
          id,
          context.start,
        )?.point;
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
    const contact: IAutoMovieVector3 = HumanFoot.offset(
      context.body,
      side,
      "ball",
    );
    const rest: IAutoMovieMotionHumanProp["points"][string] =
      support.prop.points[id]!;
    const surface: IAutoMovieAffordance | undefined =
      support.prop.affordances?.find(
        (item: IAutoMovieAffordance): boolean => item.id === id,
      );
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
      at(film: number): IAutoMovieMotionHumanProp.IPlacedPoint {
        const point: IAutoMovieMotionHumanProp.IPlacedPoint | undefined =
          support.prop.point?.(id, film);
        if (point !== undefined) return point;
        const frame: IAutoMovieRigidTransform = support.frame(film);
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

  /**
   * Move the displayed ball from its carried pose to the surface, level with
   * its forward slope.
   */
  export function acquire(
    foot: IRideFoot,
    pose: IAutoMovieMotionHumanPosture,
    film: number,
    share: number,
  ): IAutoMovieHumanLimbGoal {
    const goal: IAutoMovieHumanLimbGoal =
      pose.limbs[foot.side === "left" ? "leftLeg" : "rightLeg"]!;
    if (share <= 0) return goal;
    const level: IAutoMovieQuaternion = humanPostureHeading(pose);
    const entry: IAutoMovieQuaternion = goal.rotation ?? level;
    const target: IAutoMovieMotionHumanProp.IPlacedPoint = foot.at(film);
    const normal: IAutoMovieVector3 = Quaternion.rotateVector(
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
    const rotation: IAutoMovieQuaternion = Quaternion.slerp(
      entry,
      bearing,
      share,
    );
    const ball: IAutoMovieVector3 = Vector3.lerp(
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

  /**
   * Refuse an exact-support request when the displayed sole cannot meet its
   * named surface.
   */
  export function admit(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanRide.IParams>,
    feet: readonly IRideFoot[],
    posture: (local: number) => IAutoMovieMotionHumanPosture,
    from: number,
  ): void {
    const sockets: IAutoMovieHumanoidSurfaces.IFrame[] = feet.map(
      ({ side }: IRideFoot): IAutoMovieHumanoidSurfaces.IFrame =>
        context.body.surfaces.sockets[
          side === "left" ? "ballLeft" : "ballRight"
        ],
    );
    const bones: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
      context.body,
      new Set<AutoMovieHumanoidBone>(
        sockets.map(
          ({
            bone,
          }: IAutoMovieHumanoidSurfaces.IFrame): AutoMovieHumanoidBone => bone,
        ),
      ),
    );
    const duration: number = context.params.duration;
    const sampleCount: number = Math.max(1, Math.ceil((duration - from) * 24));
    for (let index: number = 0; index <= sampleCount; ++index) {
      const local: number = from + ((duration - from) * index) / sampleCount;
      const placed: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = bones(
        resolveHumanPosture(context.body, posture(local)),
      );
      for (const [index, foot] of feet.entries()) {
        const socket: IAutoMovieHumanoidSurfaces.IFrame = sockets[index]!;
        const bone: IAutoMovieResolvedBone = placed.get(socket.bone)!;
        const shown: IAutoMovieVector3 = Vector3.add(
          bone.worldPosition,
          Quaternion.rotateVector(bone.worldRotation, socket.point),
        );
        const gap: number = Vector3.distance(
          shown,
          foot.at(context.start + local).point,
        );
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
}
