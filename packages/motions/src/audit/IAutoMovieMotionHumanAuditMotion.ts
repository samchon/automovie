import type { IAutoMovieResolvedBone } from "@automovie/engine";
import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IHumanContactWindow } from "../law/IHumanContactWindow";

/**
 * A motion as the audit reads it: displayed bones at any film second and the
 * placed actions with their declared contact windows.
 *
 * `HumanPerformance` is one such motion, and the audit reads nothing else of
 * it, so the same checks run on a performance, on a recorded clip replayed
 * through forward kinematics, or on a motion a test builds by hand to prove a
 * check catches a defect.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the audit reads and which producers satisfy it.
 * @evidence contracts/development/design.md#principled-representation The displayed bones are the only thing drawn, and the contact windows the only declared intent a geometric check needs; both are read as their owners declare them.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Three members, a structural subset of `HumanPerformance`, each read by an audit check.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the contact window and the engine's resolved bone; no cast or optional member.
 */
export interface IAutoMovieMotionHumanAuditMotion {
  /** The motion's length, film seconds. */
  readonly duration: number;

  /**
   * A person's displayed bones.
   *
   * @param subject The person.
   * @param seconds Film seconds, within the motion.
   * @returns The bones, world frame.
   */
  bones(
    subject: string,
    seconds: number,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

  /**
   * A person's placed actions, in film order.
   *
   * @param subject The person.
   * @returns The actions; empty for a motion that declares no contact.
   */
  segments(subject: string): readonly IAutoMovieMotionHumanAuditMotion.ISpan[];
}

/** Companion types and readers of {@link IAutoMovieMotionHumanAuditMotion}. */
export namespace IAutoMovieMotionHumanAuditMotion {
  /** One placed action: its span on the film and the contacts its plan declares. */
  export interface ISpan {
    /** The action's name, for findings. */
    name: string;

    /** Where the action's own clock starts, film seconds. */
    start: number;

    /** Where the action takes the body over, film seconds. */
    entryTime: number;

    /** Where it ends, film seconds. */
    end: number;

    /** The part of the plan the audit reads. */
    plan: {
      /** The action's own length, seconds; contact shares are of this. */
      duration: number;

      /** The declared contact windows. */
      contacts: readonly IHumanContactWindow[];
    };
  }

  /** A contact window in film seconds, clipped to its action's span. */
  export interface IWindow {
    /** The action that declares it. */
    action: string;

    /** The declared window. */
    contact: IHumanContactWindow;

    /** Start, film seconds. */
    from: number;

    /** End, film seconds. */
    to: number;
  }

  /**
   * Every declared contact window of a person in film seconds: a window's
   * shares are of its action's own duration from the action's start, and the
   * action only holds the body from its entry to its end, so the window is
   * clipped to that span. A window the clip empties is dropped.
   *
   * @param motion The motion.
   * @param subject The person.
   * @returns The windows, in action order.
   */
  export function windows(
    motion: IAutoMovieMotionHumanAuditMotion,
    subject: string,
  ): IWindow[] {
    const out: IWindow[] = [];
    for (const span of motion.segments(subject))
      for (const contact of span.plan.contacts) {
        const from: number = Math.max(
          span.entryTime,
          span.start + contact.from * span.plan.duration,
        );
        const to: number = Math.min(
          span.end,
          span.start + contact.to * span.plan.duration,
        );
        if (to >= from) out.push({ action: span.name, contact, from, to });
      }
    return out;
  }

  /**
   * The film seconds a check samples between two instants: `from`, then every
   * `1 / rate` after it, and `to` itself when the grid does not land on it, so
   * neither end of a window is left unread.
   *
   * @param from Film seconds.
   * @param to Film seconds, at least `from`.
   * @param rate Samples per second, positive.
   * @returns The instants, ascending.
   * @throws {Error} When the rate is not positive or the span is reversed.
   */
  export function grid(from: number, to: number, rate: number): number[] {
    if (!(rate > 0)) throw new Error("An audit grid needs a positive rate");
    if (!(to >= from)) throw new Error("An audit grid needs from <= to");
    const out: number[] = [];
    const count: number = Math.floor((to - from) * rate + 1e-9);
    for (let i: number = 0; i <= count; i++) out.push(from + i / rate);
    if (to - out[out.length - 1]! > 1e-9) out.push(to);
    return out;
  }
}
