import { Quaternion, type RigidCarrierSample, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieHumanLimbGoal,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanRide,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanPropFrame } from "../../perform/HumanPropFrame";
import { HumanFoot } from "../../posture/HumanFoot";
import { humanPostureHeading } from "../../posture/humanPostureHeading";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";

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

  /** A planted mount foot kept in the named stirrup's full material frame. */
  export interface IRetained {
    /** The rider's foot that bears. */
    side: AutoMovieHumanSide;

    /** The named stirrup on the carrier. */
    id: string;

    /** The held foot point, named or relative to its ankle in metres. */
    socket: "ball" | IAutoMovieVector3;

    /** Carry the entering goal in the stirrup at the film second. */
    at(film: number, sample?: RigidCarrierSample.IRead): IAutoMovieHumanLimbGoal;
  }

  /** The entering fit of one foot and the named support it should continue. */
  export interface IRetain {
    /** The entry's declared base and active supports. */
    entry: Pick<IAutoMovieMotionHumanEntryState, "base" | "supports">;

    /** The foot actually displayed at the cut. */
    foot: Pick<
      IAutoMovieMotionHumanEntryState.IFoot,
      "ankle" | "rotation" | "planted"
    >;

    /** The entering leg goal, in world metres. */
    goal: IAutoMovieHumanLimbGoal;

    /** The carrier's named material reader. */
    support: IAutoMovieMotionHumanPropReader;

    /** The rider's foot that bears. */
    side: AutoMovieHumanSide;

    /** The explicitly named support on the carrier. */
    id: string;

    /** The film second of the cut. */
    start: number;
  }

  /** A ride's acquired, retained stirrup, and part-relative pedal supports. */
  export interface ISupports {
    /** Feet already resting on a moving part. */
    pedals: IRidePedal[];

    /** Feet acquired onto their named support. */
    placed: IRideFoot[];

    /** Feet continuing their entering stirrup fit. */
    retained: IRetained[];
  }

  /**
   * Change frames only when an astride entry actually carries the named
   * stirrup's plant. The displayed ankle and its bend keep their relative pose
   * in the stirrup, and the declared contact stays in the ankle's rest frame.
   *
   * @param input The entering foot, goal and support.
   * @returns A material-relative foot reader when the mount owns the plant.
   */
  export function retain(input: IRetain): IRetained | undefined {
    const { entry, foot, goal, support, side, id, start } = input;
    const site: IAutoMovieMotionHumanPropReader["site"] = support.site;
    if (
      entry.base.kind !== "seated" ||
      entry.base.seat?.astride !== true ||
      !foot.planted ||
      goal.on !== undefined ||
      goal.contact === undefined ||
      site === undefined ||
      !support.prop.affordances?.some(
        (a: IAutoMovieAffordance): boolean => a.id === id && a.kind === "stirrup",
      )
    )
      return undefined;

    const bearing = entry.supports.find(
      (
        entry: IAutoMovieMotionHumanEntryState.ISupport,
      ): entry is IAutoMovieMotionHumanEntryState.ISupport & {
        socket: IRetained["socket"];
      } => {
        if (
          entry.part !== `${side}Foot` ||
          entry.kind !== "plant" ||
          entry.support.kind !== "prop" ||
          entry.support.subject !== support.prop.subject ||
          entry.support.point !== id
        )
          return false;

        const socket = entry.socket;
        if (socket === undefined || typeof socket === "string")
          return socket === "ball";
        return (
          Number.isFinite(socket.x) &&
          Number.isFinite(socket.y) &&
          Number.isFinite(socket.z)
        );
      },
    );
    if (bearing === undefined) return undefined;
    const { socket } = bearing;
    const contact: IAutoMovieVector3 = socket === "ball" ? goal.contact : socket;

    const local: IAutoMovieRigidTransform = HumanPropFrame.relative(
      site.call(support, id, start),
      { position: foot.ankle, rotation: foot.rotation },
    );
    const bend: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.inverse(foot.rotation),
      Vector3.subtract(goal.bend, foot.ankle),
    );
    return {
      side,
      id,
      socket,
      at(
        film: number,
        sample?: RigidCarrierSample.IRead,
      ): IAutoMovieHumanLimbGoal {
        const part: IAutoMovieTransform | undefined = sample?.point(id);
        const ankle: IAutoMovieRigidTransform = HumanPropFrame.compose(
          part === undefined
            ? site.call(support, id, film)
            : { position: part.translation, rotation: part.rotation },
          local,
        );
        return {
          ...goal,
          point: ankle.position,
          rotation: ankle.rotation,
          contact,
          bend: Vector3.add(
            ankle.position,
            Quaternion.rotateVector(ankle.rotation, bend),
          ),
          planted: true,
        };
      },
    };
  }

  /** Distinguish acquired supports from an existing plant or pedal. */
  export function supports(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanRide.IParams>,
    support: IAutoMovieMotionHumanPropReader,
  ): ISupports {
    const { feet, on, placeFeet }: IAutoMovieMotionHumanRide.IParams =
      context.params;
    const { limbs }: IAutoMovieMotionHumanPosture = context.entry.posture;
    const pedals: IRidePedal[] = [];
    const placed: IRideFoot[] = [];
    const retained: IRetained[] = [];
    for (const side of ["left", "right"] as const) {
      const id: string | undefined = feet?.[side];
      if (id === undefined) continue;
      const goal: IAutoMovieHumanLimbGoal | undefined = limbs[`${side}Leg`];
      if (support.prop.points[id] === undefined || goal === undefined)
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
      if (placeFeet === true) {
        placed.push(placedRideFoot(context, support, side, id));
        continue;
      }
      const held: IRetained | undefined = retain({
        entry: context.entry,
        foot: context.entry.feet[side],
        goal,
        support,
        side,
        id,
        start: context.start,
      });
      if (held !== undefined) {
        retained.push(held);
        continue;
      }
      const began: IAutoMovieVector3 | undefined = support.prop.point?.(
        id,
        context.start,
      )?.point;
      if (began !== undefined) pedals.push({ side, id, began });
    }
    return { pedals, placed, retained };
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
    // The entry seed prescribes a fit for its entering target and rotation.
    const { seed: _seed, ...entering }: IAutoMovieHumanLimbGoal = goal;
    return {
      ...entering,
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
