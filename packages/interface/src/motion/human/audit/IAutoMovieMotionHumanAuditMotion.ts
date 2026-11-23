import type { IAutoMovieRigidTransform } from "../../../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieResolvedBone } from "../../../pose/IAutoMovieResolvedBone";
import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieMotionHumanActionPlan } from "../law/IAutoMovieMotionHumanActionPlan";
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
 * @evidence contracts/development/common.md#meaningful-documentation States what the audit reads and which producers satisfy it. start: Where the action's own clock starts, film seconds. entryTime: Where the action takes the body over, film seconds. end: Where it ends, film seconds.
 * @evidence contracts/development/design.md#principled-representation The displayed bones are the only thing drawn, and the contact windows the only declared intent a geometric check needs; both are read as their owners declare them. start: Where the action's own clock starts, film seconds. entryTime: Where the action takes the body over, film seconds. end: Where it ends, film seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Three required members, a structural subset of `HumanPerformance`, each read by an audit check, and two optional readers of a scene with moving supports or water, absent on a motion without them. Runtime boundary references: audit/AutoMovieMotionHumanAudit.ts (AutoMovieMotionHumanAudit.run, source); audit/AutoMovieMotionHumanAudit.ts (remember, source); audit/AutoMovieMotionHumanAudit.ts (remember, return); audit/AutoMovieMotionHumanAuditBalance.ts (AutoMovieMotionHumanAuditBalance.measure, motion); audit/AutoMovieMotionHumanAuditBalance.ts (AutoMovieMotionHumanAuditBalance.margin, motion); audit/AutoMovieMotionHumanAuditContact.ts (AutoMovieMotionHumanAuditContact.measure, motion).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the contact window, the engine's resolved bone and rigid transform; no cast, and each optional reader states its reading when absent. Shares the canonical IAutoMovieMotionHumanContactWindow identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanAuditMotion.bones: A person's displayed bones.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanAuditMotion.segments: A person's placed actions, in film order.
   */
  segments(subject: string): readonly IAutoMovieMotionHumanAuditMotion.ISpan[];

  /**
   * The world frame of a contact's support at a film second: a prop's frame,
   * or the frame of the supporting person's bone. A planted contact holds its
   * place in this frame, so a foot planted on a moving deck, tread or saddle
   * is read where it stands on that support, not where the support carried it.
   * Absent, every support is taken as fixed in the world, as on a motion with
   * no props.
   *
   * @param support The support a contact window declares.
   * @param seconds Film seconds, within the motion.
   * @returns The support's frame, world metres; the ground's is the identity raised to its height.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanAuditMotion.support: the frame a planted contact is read in, and the reading when absent.
   */
  support?(
    support: IAutoMovieMotionHumanContactWindow.Support,
    seconds: number,
  ): IAutoMovieRigidTransform;

  /**
   * Whether water carries a person at a film second: inside a body of water
   * the water, not a floor, bears the body, so the audit reads a floor under
   * them only where a ground contact declares one (a foot on the pool floor).
   * Absent, no one is ever in water. Out of water the floor is the ground
   * their bearing contacts declare.
   *
   * @param subject The person.
   * @param seconds Film seconds, within the motion.
   * @returns Whether the person is in water.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanAuditMotion.water: when the water, not a floor, bears a person, and the reading when absent.
   */
  water?(subject: string, seconds: number): boolean;
}

/**
 * Companion types and readers of {@link IAutoMovieMotionHumanAuditMotion}.
 *
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

    /**
     * Whether the audit judges the body's balance over this action: its law
     * stages a physical outcome or its params ask for balance (the motions
     * package's `HumanPhysics.judged`). Absent or false, the action is a
     * posed, planted one and needs no gravity check.
     */
    physical?: boolean;

    /** The part of the plan the audit reads. */
    plan: ISpanPlan;
  }

  /**
   * The action-local timing, contacts and optional balance the audit reads.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Identifies the audited declarations and their action clock.
   * @evidence contracts/development/design.md#principled-representation Uses the action plan's canonical time and balance fields and borrows its contact windows as read-only.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Audit-only view used by ISpan.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Does not copy or recompute any contact or balance terms.
   */
  export interface ISpanPlan extends Pick<
    IAutoMovieMotionHumanActionPlan,
    "duration" | "balanceWindow" | "physicalWindow"
  > {
    /** The contact windows the plan declares. */
    contacts: readonly IAutoMovieMotionHumanContactWindow[];
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
