import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieMotionTarget,
  IAutoMovieAffordance,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanProp } from "../perform/IHumanProp";

/**
 * Where a held tool works: the work point a hammer, a saw or a screwdriver
 * is brought to, and for a stir the vessel stirred.
 *
 * A stir works inside a vessel (`createVessel`): the spoon circles over the
 * vessel's `inside`, halfway between that floor and the `rim` (provisional:
 * deep enough to move what the vessel holds, clear of its floor), on a
 * circle a third of the forearm across (the arm's own stir) or half the
 * inside's radius where that is smaller (provisional: the spoon's bowl kept
 * clear of the wall). The hand holds the spoon from above the rim, so a
 * spoon whose grip to face is shorter than that depth below the rim is
 * refused, as is a stir aimed at anything but a vessel's inside.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two readings, the stir's depth, circle and refusals and the provisional values.
 * @evidence contracts/development/design.md#principled-representation The work's kind, and the work point with the stir's circle as one record.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The kind, the record and one reader, used by `useTool`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The vessel's depth and width are its own contacts; no pot is typed.
 */
export namespace HumanToolWork {
  /** A kind of work. */
  export type Kind = "hammer" | "saw" | "stir" | "screwdriver";

  /** Where a tool works. */
  export interface IWork {
    /** The working point at a contact, world metres: for a stir, the circle's point nearest the performer. */
    on: IAutoMovieVector3;

    /** A stir's circle radius, metres; 0 for the other kinds. */
    radius: number;
  }

  /**
   * Where a tool works.
   *
   * @param context The action's context.
   * @param work The kind, the aimed work point, the performer's forward and the tool's reach from its grip to its face, metres.
   * @returns The work point and a stir's circle.
   * @throws {HumanRefusal} When a stir's work point is no vessel's inside, the vessel declares no `rim` or no inside width, or the spoon is too short to reach the stirring depth from above the rim.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the result and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The vessel's contacts carried into the world by its frame at the action's start; the circle centred over the inside, its nearest point the contact.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The aimed point for three kinds; the vessel's reading for the stir.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A stir with no vessel, a vessel with no rim and a spoon too short are refused, never stirred at a guessed place.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Linear in the vessel's few contacts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Called once per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function of(
    context: Pick<IHumanActionContext, "aim" | "body" | "prop" | "start">,
    work: {
      kind: Kind;
      on: AutoMovieMotionTarget;
      forward: IAutoMovieVector3;
      length: number;
    },
  ): IWork {
    if (work.kind !== "stir")
      return { on: context.aim(work.on, context.start).point, radius: 0 };
    if (work.on.kind !== "prop" || work.on.point !== "inside")
      throw new HumanRefusal({
        kind: "affordance",
        axis: "on",
        value: work.on.kind,
        reason: "a stir works inside a vessel, and the work point is no vessel's inside",
        fix: 'aim the stir at a vessel\'s inside, { kind: "prop", subject, point: "inside" }, as createVessel declares it',
      });
    const subject: string = work.on.subject;
    const read: IHumanActionContext.IProp = context.prop(subject);
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
    if (!((inside.width ?? 0) > 0))
      throw new HumanRefusal({
        kind: "affordance",
        axis: "on",
        value: subject,
        reason: `${subject}'s inside declares no width to stir in`,
        fix: "give the vessel's inside its width, as createVessel does",
      });
    const frame: IHumanProp.IFrame = read.frame(context.start);
    const world = (a: IAutoMovieAffordance): IAutoMovieVector3 =>
      Vector3.add(
        frame.position,
        Quaternion.rotateVector(frame.rotation, a.frame.translation),
      );
    const floor: IAutoMovieVector3 = world(inside);
    const top: number = world(rim).y;
    const depth: number = (top - floor.y) / 2;
    if (!(work.length > depth))
      throw new HumanRefusal({
        kind: "reach",
        axis: "prop",
        value: work.length,
        feasible: { kind: "range", minimum: depth, maximum: null, unit: "m" },
        reason: `the spoon reaches ${work.length.toFixed(3)} m from its grip, short of the ${depth.toFixed(3)} m from ${subject}'s rim to the stirring depth`,
        fix: "stir with a longer spoon, or a shallower vessel",
      });
    const radius: number = Math.min(
      context.body.measure.forearm / 3,
      inside.width! / 4,
    );
    return {
      on: Vector3.subtract(
        { x: floor.x, y: floor.y + depth, z: floor.z },
        Vector3.scale(work.forward, radius),
      ),
      radius,
    };
  }
}
