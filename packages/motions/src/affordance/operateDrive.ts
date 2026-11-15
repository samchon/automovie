import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieAffordanceKind,
  AutoMovieMotionTarget,
  IAutoMovieAffordance,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
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
 * button, a knob) or the contact that rides one (a door's handle on its
 * hinge, a drawer's pull on its slider, `IAutoMovieAffordance.rides`). The
 * stroke moves that articulation from where the performance has it at the
 * operation's start by the mechanism's amount, in the articulation's own
 * unit and sign: degrees for a hinge's swing or a knob's turn, metres for a
 * slider's or a button's travel. The hand's goal at a progress is the
 * contact of the prop posed at that travel, so the hand cannot drift from
 * the part; the drive writes the same travel at the same progress.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States which contact names the articulation, the unit and sign of the amount, and why hand and part share one function.
 * @evidence contracts/development/design.md#principled-representation One record of the operated part: its prop, contact, articulation, start travel, amount and posed place by progress.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The part and the drive, read by `operate`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The part's place is the prop's own pose, never a guessed arc; a rigid prop has no part and keeps `operate.state`'s geometry.
 */
export namespace operateDrive {
  /** The articulation kinds whose travel moves a part. */
  export const ARTICULATIONS: ReadonlySet<AutoMovieAffordanceKind> = new Set<
    AutoMovieAffordanceKind
  >(["hinge", "slider", "knob", "button", "trigger", "crank", "wheel", "pedal"]);

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
   * @returns The part, or undefined for a rigid prop or a target that is not a prop's articulated contact.
   */
  export function part(
    context: IHumanActionContext,
    at: AutoMovieMotionTarget,
    amount: number,
  ): IPart | undefined {
    if (at.kind !== "prop") return undefined;
    const held: IHumanActionContext.IProp = context.prop(at.subject);
    const articulate = held.prop.articulate;
    if (articulate === undefined) return undefined;
    const contact: IAutoMovieAffordance | undefined = (
      held.prop.affordances ?? []
    ).find((a: IAutoMovieAffordance): boolean => a.id === at.point);
    if (contact === undefined) return undefined;
    const articulation: string | undefined = ARTICULATIONS.has(contact.kind)
      ? contact.id
      : contact.rides;
    if (articulation === undefined) return undefined;
    const before: Readonly<Record<string, number>> =
      held.state?.(context.start) ?? {};
    const base: number = before[articulation] ?? 0;
    const frame: IHumanProp.IFrame = held.frame(context.start);

    // One posed prop per progress read last: a stroke reads the same
    // progress for the hand's point and its turn.
    let last: { progress: number; place: IPlace } | undefined;
    return {
      prop: at.subject,
      contact: contact.id,
      articulation,
      base,
      amount,
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
