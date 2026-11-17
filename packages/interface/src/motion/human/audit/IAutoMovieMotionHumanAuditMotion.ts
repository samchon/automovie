import type { IAutoMovieResolvedBone } from "../../../pose/IAutoMovieResolvedBone";
import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieMotionHumanContactWindow } from "../law/IAutoMovieMotionHumanContactWindow";

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

/**
 * Companion types and readers of {@link IAutoMovieMotionHumanAuditMotion}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation start: Where the action's own clock starts, film seconds. entryTime: Where the action takes the body over, film seconds. end: Where it ends, film seconds.
 * @evidence contracts/development/design.md#principled-representation start: Where the action's own clock starts, film seconds. entryTime: Where the action takes the body over, film seconds. end: Where it ends, film seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: audit/AutoMovieMotionHumanAudit.ts (AutoMovieMotionHumanAudit.run, source); audit/AutoMovieMotionHumanAudit.ts (remember, source); audit/AutoMovieMotionHumanAudit.ts (remember, return); audit/AutoMovieMotionHumanAuditBalance.ts (AutoMovieMotionHumanAuditBalance.measure, motion); audit/AutoMovieMotionHumanAuditBalance.ts (AutoMovieMotionHumanAuditBalance.margin, motion); audit/AutoMovieMotionHumanAuditContact.ts (AutoMovieMotionHumanAuditContact.measure, motion).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanContactWindow identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanAuditMotion {
  /**
   * One placed action: its span on the film and the contacts its plan declares.
   *
   * @evidence contracts/development/common.md#meaningful-documentation start: Where the action's own clock starts, film seconds. entryTime: Where the action takes the body over, film seconds. end: Where it ends, film seconds.
   * @evidence contracts/development/design.md#principled-representation start: Where the action's own clock starts, film seconds. entryTime: Where the action takes the body over, film seconds. end: Where it ends, film seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: audit/HumanVerdicts.ts (shifted, return); audit/HumanVerdicts.ts (shifted, span).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanContactWindow identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
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
      contacts: readonly IAutoMovieMotionHumanContactWindow[];
    };
  }

  /**
   * A contact window in film seconds, clipped to its action's span.
   *
   * @evidence contracts/development/common.md#meaningful-documentation from: Start, film seconds. to: End, film seconds.
   * @evidence contracts/development/design.md#principled-representation from: Start, film seconds. to: End, film seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: audit/AutoMovieMotionHumanAuditBalance.ts (AutoMovieMotionHumanAuditBalance.margin.open, w); audit/AutoMovieMotionHumanAuditBalance.ts (AutoMovieMotionHumanAuditBalance.margin.borne, w); audit/AutoMovieMotionHumanAuditBalance.ts (AutoMovieMotionHumanAuditBalance.margin.feet, w); audit/AutoMovieMotionHumanAuditBalance.ts (AutoMovieMotionHumanAuditBalance.margin.support, w); audit/AutoMovieMotionHumanAuditBalance.ts (AutoMovieMotionHumanAuditBalance.standing, windows); audit/AutoMovieMotionHumanAuditBalance.ts (AutoMovieMotionHumanAuditBalance.standing.open, w).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanContactWindow identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IWindow {
    /** The action that declares it. */
    action: string;

    /** The declared window. */
    contact: IAutoMovieMotionHumanContactWindow;

    /** Start, film seconds. */
    from: number;

    /** End, film seconds. */
    to: number;
  }
}
