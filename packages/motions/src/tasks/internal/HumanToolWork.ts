import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanToolWork,
  IAutoMovieMotionTarget,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";

/**
 * Where a tool works.
 *
 * @param context The action's context.
 * @param work The kind, the aimed work point, the performer's forward and the
 *   tool's reach from its grip to its face, metres.
 * @returns The work point and a stir's circle.
 * @throws {HumanRefusal} When a stir's work point is no vessel's inside, the
 *   vessel declares no `rim` or no inside width, or the spoon is too short to
 *   reach the stirring depth from above the rim.
 */
export function HumanToolWork(
  context: Pick<IAutoMovieMotionHumanActionContext, OfContext>,
  work: IOfWork,
): HumanToolWork.IWork {
  if (work.kind !== "stir")
    return { on: context.aim(work.on, context.start).point, radius: 0 };
  if (work.on.kind !== "prop" || work.on.point !== "inside")
    throw new HumanRefusal({
      kind: "affordance",
      axis: "on",
      value: work.on.kind,
      reason:
        "a stir works inside a vessel, and the work point is no vessel's inside",
      fix: 'aim the stir at a vessel\'s inside, { kind: "prop", subject, point: "inside" }, as createVessel declares it',
    });
  const subject: string = work.on.subject;
  const read: IAutoMovieMotionHumanPropReader = context.prop(subject);
  const affordances: readonly IAutoMovieAffordance[] =
    read.prop.affordances ?? [];
  const declared = (id: string): IAutoMovieAffordance => {
    const found: IAutoMovieAffordance | undefined = affordances.find(
      (a: IAutoMovieAffordance): boolean => a.id === id,
    );
    if (found === undefined)
      throw new HumanRefusal({
        kind: "affordance",
        axis: "on",
        value: subject,
        feasible: {
          kind: "alternatives",
          values: affordances.map((a: IAutoMovieAffordance): string => a.id),
        },
        reason: `${subject} declares no ${id}`,
        fix: `stir a vessel that declares an inside and a rim, as createVessel does`,
      });
    return found;
  };
  const inside: IAutoMovieAffordance = declared("inside");
  const rim: IAutoMovieAffordance = declared("rim");
  return HumanToolWork.stir({
    subject,
    inside,
    rim,
    frame: read.frame(context.start),
    forward: work.forward,
    length: work.length,
    forearm: context.body.measure.forearm,
  });
}

/**
 * Where a held tool works: the work point a hammer, a saw or a screwdriver is
 * brought to, and for a stir the vessel stirred.
 *
 * A stir works inside a vessel (`createVessel`): the spoon circles over the
 * vessel's `inside`, halfway between that floor and the `rim` (provisional:
 * deep enough to move what the vessel holds, clear of its floor), on a circle a
 * third of the forearm across (the arm's own stir) or half the inside's radius
 * where that is smaller (provisional: the spoon's bowl kept clear of the wall).
 * The hand holds the spoon from above the rim, so a spoon whose grip to face is
 * shorter than that depth below the rim is refused, as is a stir aimed at
 * anything but a vessel's inside.
 */
export namespace HumanToolWork {
  /** Where a tool works. */
  export interface IWork {
    /**
     * The working point at a contact, world metres: for a stir, the circle's
     * point nearest the performer.
     */
    on: IAutoMovieVector3;

    /** A stir's circle radius, metres; 0 for the other kinds. */
    radius: number;
  }
  /** A stir's vessel, spoon and arm. */
  export interface IStir {
    /** The vessel's name. */
    subject: string;

    /** The vessel's declared inside: its floor and width. */
    inside: Pick<IAutoMovieAffordance, "frame" | "width">;

    /** The vessel's declared rim. */
    rim: Pick<IAutoMovieAffordance, "frame">;

    /** The vessel's world frame. */
    frame: IAutoMovieRigidTransform;

    /** The performer's forward. */
    forward: IAutoMovieVector3;

    /** The spoon's reach from its grip to its face, metres. */
    length: number;

    /** The performer's forearm, metres. */
    forearm: number;
  }

  /**
   * A stir's work point: halfway between the inside's floor and the rim, on a
   * circle the lesser of a third of the forearm and a quarter of the inside's
   * width across, its point nearest the performer.
   *
   * @param stir The vessel, the spoon and the arm.
   * @returns The work point and the circle's radius.
   * @throws {HumanRefusal} When the inside has no width or the spoon is shorter
   *   than the stirring depth below the rim.
   */
  export function stir(stir: IStir): IWork {
    const { subject, inside, rim, frame } = stir;
    if (!((inside.width ?? 0) > 0))
      throw new HumanRefusal({
        kind: "affordance",
        axis: "on",
        value: subject,
        reason: `${subject}'s inside declares no width to stir in`,
        fix: "give the vessel's inside its width, as createVessel does",
      });
    const world = (a: Pick<IAutoMovieAffordance, "frame">): IAutoMovieVector3 =>
      Vector3.add(
        frame.position,
        Quaternion.rotateVector(frame.rotation, a.frame.translation),
      );
    const floor: IAutoMovieVector3 = world(inside);
    const top: number = world(rim).y;
    const depth: number = (top - floor.y) / 2;
    if (!(stir.length > depth))
      throw new HumanRefusal({
        kind: "reach",
        axis: "prop",
        value: stir.length,
        feasible: { kind: "range", minimum: depth, maximum: null, unit: "m" },
        reason: `the spoon reaches ${stir.length.toFixed(3)} m from its grip, short of the ${depth.toFixed(3)} m from ${subject}'s rim to the stirring depth`,
        fix: "stir with a longer spoon, or a shallower vessel",
      });
    const radius: number = Math.min(stir.forearm / 3, inside.width! / 4);
    return {
      on: Vector3.subtract(
        { x: floor.x, y: floor.y + depth, z: floor.z },
        Vector3.scale(stir.forward, radius),
      ),
      radius,
    };
  }
}

/** The record of `IOfWork`'s site. */
type IOfWork = {
  kind: IAutoMovieMotionHumanToolWork.Kind;
  on: IAutoMovieMotionTarget;
  forward: IAutoMovieVector3;
  length: number;
};

/** The alternatives of `OfContext`'s site. */
type OfContext = "aim" | "body" | "prop" | "start";
