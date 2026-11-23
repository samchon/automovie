import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionCoupling } from "./IAutoMovieMotionCoupling";
import type { IAutoMovieMotionHumanTarget } from "./IAutoMovieMotionHumanTarget";
import type { IAutoMovieMotionMeetingRole } from "./IAutoMovieMotionMeetingRole";
import type { IAutoMovieMotionMeetingTiming } from "./IAutoMovieMotionMeetingTiming";

/**
 * A reusable meeting law declaring roles, contact targets and timing, with
 * optional placement and coupling capabilities. AutoMovieMotionMeeting resolves
 * it against the participating performers.
 */
export interface IAutoMovieMotionMeetingKind {
  /** The kind's name (`handshake`, `handover`, `strike`). */
  name: string;

  /** The role names, one per performer; a symmetric action names one role twice. */
  roles: readonly string[];

  /** Each shared contact's default place, which a role offers when alone. */
  contacts: Readonly<Record<string, IAutoMovieMotionHumanTarget.IDefault>>;

  /**
   * One role's natural timing toward the contacts.
   *
   * @param role The role.
   * @param contacts The contacts' world points, metres.
   * @returns The role's instants, seconds since the meeting's start.
   */
  timing(
    role: IAutoMovieMotionMeetingRole,
    contacts: Readonly<Record<string, IAutoMovieVector3>>,
  ): IAutoMovieMotionMeetingTiming;

  /**
   * Where the contacts lie when every role is present; the mean of the roles'
   * default places when absent.
   *
   * @param roles The roles, in the meeting's order.
   * @returns Each contact's world point, metres.
   */
  place?(
    roles: readonly IAutoMovieMotionMeetingRole[],
  ): Record<string, IAutoMovieVector3>;

  /**
   * Place oriented anatomical contacts once from the complete pair, giving
   * their world points and outward normals.
   */
  surfaces?(
    roles: readonly IAutoMovieMotionMeetingRole[],
  ): Record<string, IAutoMovieMotionMeetingKind.ISurface>;
  /**
   * The coupling of a kind in which one role bears another: the borne role's
   * contacts on the bearer with their load shares, and the mass the bearer
   * carries with its centre. Computed once with the meeting, from the ordered
   * roles, and only when every role is present.
   *
   * @param roles The roles, in the meeting's order.
   * @param instants The meeting's shared instants, film seconds.
   * @returns The coupling.
   */
  couple?(
    roles: readonly IAutoMovieMotionMeetingRole[],
    instants: IAutoMovieMotionMeetingTiming,
  ): IAutoMovieMotionCoupling;
}

export namespace IAutoMovieMotionMeetingKind {
  /**
   * A contact's world point and outward normal before the meeting grants solid
   * contact.
   */
  export type ISurface = Pick<
    IAutoMovieMotionHumanTarget.IPlace,
    "point" | "normal"
  >;
}
