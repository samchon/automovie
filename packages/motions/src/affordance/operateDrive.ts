import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieAffordanceKind,
  AutoMovieMotionTarget,
  IAutoMovieAffordance,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanProp } from "../perform/IHumanProp";
import type { operate } from "./operate";

/**
 * The part an operation moves on a prop that articulates, and the drive the
 * operation publishes for it: the hand and the part follow one function of
 * the stroke's progress, the prop posed at the articulation's travel there.
 *
 * The operated contact is the prop's articulation itself (a trigger, a
 * button, a knob) or a contact that rides one of the mechanism's kinds,
 * however far up its chain (a door's lever on its latch on its hinge, a
 * drawer's pull on its slider, `IAutoMovieAffordance.rides`). The
 * stroke moves that articulation from where the performance has it at the
 * operation's start by the mechanism's amount, in the articulation's own
 * unit and sign: degrees for a hinge's swing or a knob's turn, metres for a
 * slider's or a button's travel. The hand's goal at a progress is the
 * contact of the prop posed at that travel, so the hand cannot drift from
 * the part; the drive writes the same travel at the same progress.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States which contact names the articulation, the unit and sign of the amount, and why hand and part share one function.
 * @evidence contracts/development/design.md#principled-representation One record of the operated part: its prop, contact, articulation, start travel, amount and posed place by progress.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The mechanisms' articulation kinds, the part, the drive and a hinged leaf's line with its radius and foot, read by `operate`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The part's place is the prop's own pose, never a guessed arc; a rigid prop has no part and keeps `operate.state`'s geometry.
 */
export namespace operateDrive {
  /**
   * The articulation kinds each mechanism moves: a hinge's leaf, a knob's
   * turn (a crank and a wheel turn alike), a slider's travel, a button's
   * press (a trigger's pull and a pedal's press alike).
   */
  export const KINDS: Readonly<
    Record<
      Exclude<operate.Mechanism["kind"], "insert">,
      ReadonlySet<AutoMovieAffordanceKind>
    >
  > = {
    hinge: new Set<AutoMovieAffordanceKind>(["hinge"]),
    knob: new Set<AutoMovieAffordanceKind>(["knob", "crank", "wheel"]),
    slider: new Set<AutoMovieAffordanceKind>(["slider"]),
    button: new Set<AutoMovieAffordanceKind>(["button", "trigger", "pedal"]),
  };

  /** A contact's world point and outward unit normal. */
  export interface IPlace {
    /** World metres. */
    point: IAutoMovieVector3;

    /** Outward unit normal. */
    normal: IAutoMovieVector3;
  }

  /** An operated part of an articulated prop. */
  export interface IPart {
    /** The prop's subject. */
    prop: string;

    /** The contact the hand takes. */
    contact: string;

    /** The articulation the contact moves with. */
    articulation: string;

    /** The articulation's travel at the operation's start. */
    base: number;

    /** The signed amount the operation moves it by. */
    amount: number;

    /**
     * The contact's world place at a progress of the stroke.
     *
     * @param progress 0 at the stroke's start, 1 at its end.
     * @returns The point and outward normal.
     */
    place(progress: number): IPlace;

    /**
     * A hinge articulation's own line at the stroke's start, world: a point
     * of it and its unit axis, the affordance frame's `+Y`, about which a
     * positive travel turns by the right-hand rule (a door's upright hinge,
     * a gun cock's cross pin). Absent for any other articulation.
     */
    line?: ILine;
  }

  /** A turning line, world. */
  export interface ILine {
    /** A point of the line, metres. */
    point: IAutoMovieVector3;

    /** Its unit axis. */
    axis: IAutoMovieVector3;
  }

  /**
   * A mechanism's signed amount in its articulation's unit: a button's
   * press and a slider's travel in metres (a button's 0.005 when absent, as
   * `operate` presses it), a knob's turn and a hinge's swing in degrees.
   *
   * @param mechanism The mechanism, not an insertion.
   * @returns The amount.
   */
  export function amount(
    mechanism: Exclude<operate.Mechanism, { kind: "insert" }>,
  ): number {
    switch (mechanism.kind) {
      case "button":
        return mechanism.travel ?? 0.005;
      case "knob":
        return mechanism.turn;
      case "slider":
        return mechanism.travel;
      case "hinge":
        return mechanism.swing;
    }
  }

  /**
   * The operated part, when the target is a contact of a prop that
   * articulates and rides or is an articulation.
   *
   * @param context The operation's context.
   * @param at The operated contact.
   * @param amount The mechanism's signed amount in the articulation's unit.
   * @param kind The mechanism's kind, whose articulation kinds (`KINDS`) are looked for up the chain the contact rides.
   * @returns The part, or undefined for a rigid prop or a target that is not, and rides no, articulation of the mechanism's kinds.
   */
  export function part(
    context: IHumanActionContext,
    at: AutoMovieMotionTarget,
    amount: number,
    kind: Exclude<operate.Mechanism["kind"], "insert">,
  ): IPart | undefined {
    if (at.kind !== "prop") return undefined;
    const held: IHumanActionContext.IProp = context.prop(at.subject);
    const articulate = held.prop.articulate;
    if (articulate === undefined) return undefined;
    const contact: IAutoMovieAffordance | undefined = (
      held.prop.affordances ?? []
    ).find((a: IAutoMovieAffordance): boolean => a.id === at.point);
    if (contact === undefined) return undefined;
    // The articulation the mechanism moves: the contact itself or the first
    // one of the mechanism's kinds up the chain it rides, so a door's lever
    // on its latch on its hinge swings the hinge and turns the latch.
    const kinds: ReadonlySet<AutoMovieAffordanceKind> = KINDS[kind];
    const of = (id: string): IAutoMovieAffordance | undefined =>
      (held.prop.affordances ?? []).find(
        (a: IAutoMovieAffordance): boolean => a.id === id,
      );
    let link: IAutoMovieAffordance | undefined = contact;
    const seen: Set<string> = new Set();
    while (link !== undefined && !kinds.has(link.kind) && !seen.has(link.id)) {
      seen.add(link.id);
      link = link.rides === undefined ? undefined : of(link.rides);
    }
    if (link === undefined || !kinds.has(link.kind)) return undefined;
    const articulation: string = link.id;
    const before: Readonly<Record<string, number>> =
      held.state?.(context.start) ?? {};
    const base: number = before[articulation] ?? 0;
    const frame: IHumanProp.IFrame = held.frame(context.start);

    // A hinge's own line, read off the prop posed where the stroke starts.
    const hinge: IAutoMovieAffordance | undefined = (
      held.prop.affordances ?? []
    ).find(
      (a: IAutoMovieAffordance): boolean =>
        a.id === articulation && a.kind === "hinge",
    );
    const line: ILine | undefined = ((): ILine | undefined => {
      if (hinge === undefined) return undefined;
      const pin: IAutoMovieAffordance = articulate(before).affordances.find(
        (a: IAutoMovieAffordance): boolean => a.id === articulation,
      )!;
      return {
        point: Vector3.add(
          frame.position,
          Quaternion.rotateVector(frame.rotation, pin.frame.translation),
        ),
        axis: Quaternion.rotateVector(
          Quaternion.multiply(frame.rotation, pin.frame.rotation),
          { x: 0, y: 1, z: 0 },
        ),
      };
    })();

    // One posed prop per progress read last: a stroke reads the same
    // progress for the hand's point and its turn.
    let last: { progress: number; place: IPlace } | undefined;
    return {
      prop: at.subject,
      contact: contact.id,
      articulation,
      base,
      amount,
      ...(line === undefined ? {} : { line }),
      place: (progress: number): IPlace => {
        if (last !== undefined && last.progress === progress) return last.place;
        const posed: IHumanProp.IPosed = articulate({
          ...before,
          [articulation]: base + amount * progress,
        });
        const moved: IAutoMovieAffordance = posed.affordances.find(
          (a: IAutoMovieAffordance): boolean => a.id === contact.id,
        )!;
        const turn: IAutoMovieQuaternion = Quaternion.multiply(
          frame.rotation,
          moved.frame.rotation,
        );
        const place: IPlace = {
          point: Vector3.add(
            frame.position,
            Quaternion.rotateVector(frame.rotation, moved.frame.translation),
          ),
          normal: Quaternion.rotateVector(turn, { x: 0, y: 1, z: 0 }),
        };
        last = { progress, place };
        return place;
      },
    };
  }

  /** A leaf's hinge line: a point of it and its unit axis, the vertical when absent (a door's line given by a point). */
  export interface IHinge {
    /** A point of the line, world metres. */
    point: IAutoMovieVector3;

    /** Its unit axis; the vertical when absent. */
    axis?: IAutoMovieVector3;
  }

  /**
   * A hinged leaf's line: the vertical through the point the mechanism
   * names (a door's), or else the operated prop's own hinge articulation
   * (`IPart.line`), however it lies: a gun cock's cross pin.
   *
   * @param context The operation's context.
   * @param mechanism The hinge mechanism.
   * @param part The operated part, when the prop articulates.
   * @returns The line.
   * @throws {HumanRefusal} When the mechanism names no point and the handle rides no hinge articulation.
   */
  export function hinge(
    context: IHumanActionContext,
    mechanism: Extract<operate.Mechanism, { kind: "hinge" }>,
    part: IPart | undefined,
  ): IHinge {
    if (mechanism.hinge !== undefined)
      return { point: context.aim(mechanism.hinge, context.start).point };
    if (part?.line !== undefined) return part.line;
    throw new HumanRefusal({
      kind: "affordance",
      axis: "mechanism",
      value: "hinge",
      reason:
        "a hinged leaf names no hinge point and its handle rides no hinge articulation of a prop",
      fix: "give the hinge line's point, or operate a handle that rides a prop's hinge",
    });
  }

  /**
   * A point's distance from a hinge line, metres: the handle's radius about
   * it, the horizontal distance for a vertical line given by a point.
   *
   * @param line The line.
   * @param point The point.
   * @returns The radius.
   */
  export function radius(line: IHinge, point: IAutoMovieVector3): number {
    return line.axis === undefined
      ? Vector3.length(
          Vector3.subtract({ ...point, y: 0 }, { ...line.point, y: 0 }),
        )
      : Vector3.length(Vector3.subtract(point, foot(line, point)));
  }

  /**
   * The foot of a point on a hinge line: the line's point level with it
   * for the vertical line of a line given without an axis (a door's, the
   * point's own height kept exactly), its projection on the line otherwise.
   *
   * @param line The line.
   * @param point The point.
   * @returns The foot, world metres.
   */
  export function foot(line: IHinge, point: IAutoMovieVector3): IAutoMovieVector3 {
    if (line.axis === undefined) return { ...line.point, y: point.y };
    return Vector3.add(
      line.point,
      Vector3.scale(
        line.axis,
        Vector3.dot(Vector3.subtract(point, line.point), line.axis),
      ),
    );
  }

  /**
   * The drive an operation publishes for its part: the travel at the
   * stroke's minimum-jerk progress from `strokeStart` to `strokeEnd`, the
   * progress the hand's path is read at.
   *
   * @param part The part.
   * @param clock The operation's clock.
   * @returns The drive.
   */
  export function drive(
    part: IPart,
    clock: AutoMovieMotionClock.IClock,
  ): IHumanActionPlan.IDrive {
    return {
      prop: part.prop,
      articulation: part.articulation,
      from: clock.at("strokeStart") / clock.duration,
      to: clock.at("strokeEnd") / clock.duration,
      travel: (seconds: number): number =>
        part.base +
        part.amount * clock.progress("strokeStart", "strokeEnd", seconds),
    };
  }
}
