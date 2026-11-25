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

  /**
   * The world frame of a contact's support at a film second: a prop's frame, or
   * the frame of the supporting person's bone. A planted contact holds its
   * place in this frame, so a foot planted on a moving deck, tread or saddle is
   * read where it stands on that support, not where the support carried it.
   * Absent, every support is taken as fixed in the world, as on a motion with
   * no props.
   *
   * @param support The support a contact window declares.
   * @param seconds Film seconds, within the motion.
   * @returns The support's frame, world metres; the ground's is the identity
   *   raised to its height.
   */
  support?(
    support: IAutoMovieMotionHumanContactWindow.Support,
    seconds: number,
  ): IAutoMovieRigidTransform;

  /**
   * Whether water carries a person at a film second: inside a body of water the
   * water, not a floor, bears the body, so the audit reads a floor under them
   * only where a ground contact declares one (a foot on the pool floor).
   * Absent, no one is ever in water. Out of water the floor is the ground their
   * bearing contacts declare.
   *
   * @param subject The person.
   * @param seconds Film seconds, within the motion.
   * @returns Whether the person is in water.
   */
  water?(subject: string, seconds: number): boolean;
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

    /**
     * Whether the audit judges the body's balance over this action: its law
     * stages a physical outcome or its params ask for balance (the motions
     * package's `HumanPhysics.judged`). Absent or false, the action is a posed,
     * planted one and needs no gravity check.
     */
    physical?: boolean;

    /** The part of the plan the audit reads. */
    plan: ISpanPlan;
  }

  /** The action-local timing, contacts and optional balance the audit reads. */
  export interface ISpanPlan extends Pick<
    IAutoMovieMotionHumanActionPlan,
    "duration" | "balanceWindow" | "physicalWindow"
  > {
    /** The contact windows the plan declares. */
    contacts: readonly IAutoMovieMotionHumanContactWindow[];
  }

  /** A contact window in film seconds, clipped to its action's span. */
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
