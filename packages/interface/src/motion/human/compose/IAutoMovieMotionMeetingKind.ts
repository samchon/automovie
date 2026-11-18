import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionCoupling } from "./IAutoMovieMotionCoupling";
import type { IAutoMovieMotionHumanTarget } from "./IAutoMovieMotionHumanTarget";
import type { IAutoMovieMotionMeetingRole } from "./IAutoMovieMotionMeetingRole";
import type { IAutoMovieMotionMeetingTiming } from "./IAutoMovieMotionMeetingTiming";

/**
 * A reusable meeting law declaring roles, contact targets and timing, with optional placement and coupling capabilities. AutoMovieMotionMeeting resolves it against the participating performers.
 *
 * @evidence contracts/development/common.md#meaningful-documentation A reusable meeting law declaring roles, contact targets and timing, with optional placement and coupling capabilities. AutoMovieMotionMeeting resolves it against the participating performers.
 * @evidence contracts/development/design.md#principled-representation A kind is what differs between mutual actions: who takes part, where they touch and how long each takes to get there. The frame, the order and the shared instants are the same for all and are computed by `of`.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Handshake, handover, high-five and carried-coupling laws provide meeting kinds; AutoMovieMotionMeeting supplies their shared role/frame/timing resolution.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Roles and contact defaults are explicit, while optional place/couple capabilities retain their documented fallback behavior. The meeting runtime owns role admission rather than this pure callback interface.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the role and the contacts it is given, and that the instants are seconds since the meeting's start.
   * @evidence contracts/development/implementation.md#principled-implementation A role's own timing toward the contacts, from where it stands and where its bones are, so the meeting takes the latest of each instant over the roles.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One required member of a kind, called once per role by `of`. The handshake, handover, high-five and carried-coupling planners supply this callback.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The member returns instants and no shared ones; the pair's shared instants are `of`'s, so no role is timed by its partner's guess.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared member has no body, so it has no algorithm; the cost belongs to each implementation.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared member coordinates no work, so it shares none.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared member owns no state; what an implementation retains is stated by the function that builds it.
   */
  timing(
    role: IAutoMovieMotionMeetingRole,
    contacts: Readonly<Record<string, IAutoMovieVector3>>,
  ): IAutoMovieMotionMeetingTiming;

  /**
   * Where the contacts lie when every role is present; the mean of the
   * roles' default places when absent.
   *
   * @param roles The roles, in the meeting's order.
   * @returns Each contact's world point, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the roles it is given, their order, the unit and the frame of the result, and that its absence means the mean of the default places.
   * @evidence contracts/development/implementation.md#principled-implementation A kind that knows where its contacts lie better than the mean of the roles' default places says so here, and `of` calls it only when every role is present.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One optional member of a kind, called at most once by `of`. The mutual-action planners supply this optional shared timing callback.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts When a role is missing `of` does not call it, so a kind's placement never sees a partner made up to fill a role.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared member has no body, so it has no algorithm; the cost belongs to each implementation.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared member coordinates no work, so it shares none.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared member owns no state; what an implementation retains is stated by the function that builds it.
   */
  place?(
    roles: readonly IAutoMovieMotionMeetingRole[],
  ): Record<string, IAutoMovieVector3>;

  /** Place oriented anatomical contacts once from the complete pair, giving their world points and outward normals. */
  surfaces?(roles: readonly IAutoMovieMotionMeetingRole[]): Record<string, IAutoMovieMotionMeetingKind.ISurface>;
  /**
   * The coupling of a kind in which one role bears another (#3437): the
   * borne role's contacts on the bearer with their load shares, and the
   * mass the bearer carries with its centre. Computed once with the
   * meeting, from the ordered roles, and only when every role is present.
   *
   * @param roles The roles, in the meeting's order.
   * @param instants The meeting's shared instants, film seconds.
   * @returns The coupling.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the coupling holds, when it is computed and from what.
   * @evidence contracts/development/implementation.md#principled-implementation A coupled system is stated once for both bodies, as Liu, Hertzmann and Popović 2006 state multi-character constraints once in one problem, so neither role derives the other's side of a contact.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One optional member of a kind, called at most once by `of`.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts When a role is missing `of` does not call it, so no coupling is made up against an absent bearer.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared member has no body, so it has no algorithm; the cost belongs to each implementation.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared member coordinates no work, so it shares none.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared member owns no state; what an implementation retains is stated by the function that builds it.
   */
  couple?(
    roles: readonly IAutoMovieMotionMeetingRole[],
    instants: IAutoMovieMotionMeetingTiming,
  ): IAutoMovieMotionCoupling;
}

export namespace IAutoMovieMotionMeetingKind {
  /** A contact's world point and outward normal before the meeting grants solid contact. */
  export type ISurface = Pick<IAutoMovieMotionHumanTarget.IPlace, "point" | "normal">;
}
