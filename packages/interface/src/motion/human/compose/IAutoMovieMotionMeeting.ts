import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieResolvedBone } from "../../../pose/IAutoMovieResolvedBone";
import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanFrame } from "../posture/IAutoMovieMotionHumanFrame";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";
import type { IAutoMovieMotionCoupling } from "./IAutoMovieMotionCoupling";
import type { IAutoMovieMotionHumanTarget } from "./IAutoMovieMotionHumanTarget";

/**
 * The meeting of an action two or more performers do together: one frame
 * with the place of each shared contact, and the film seconds all arrive
 * at, hold and leave.
 *
 * A meeting is computed once, by a pure function of where the roles stand
 * when it starts, and every role's law reads the same record, so no law
 * derives its partner's side of a contact. The roles are put in one order
 * (by role name, then by subject) before anything is computed, so the record
 * is the same whichever role asks first. A role with no performer is left
 * out: the contacts are then the present role's default places and the
 * meeting is not solid, so each role's law performs alone in the air.
 *
 * @evidence contracts/development/common.md#meaningful-documentation from: The earliest film second of the contact; the natural one when absent. to: The film second the contact is left; the natural one when absent. contacts: Each shared contact's default place, which a role offers when alone.
 * @evidence contracts/development/design.md#principled-representation from: The earliest film second of the contact; the natural one when absent. to: The film second the contact is left; the natural one when absent. contacts: Each shared contact's default place, which a role offers when alone.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/AutoMovieMotionMeeting.ts (AutoMovieMotionMeeting.of, kind); handling/handshakeMeeting.ts (handshakeMeeting.kind, return); handling/HumanHandoverMeeting.ts (HumanHandoverMeeting.kind, return); lexicon/HumanCarriedCoupling.ts (HumanCarriedCoupling.kind, return); perform/HumanPerformanceMeeting.ts (HumanPerformanceMeeting.reader, kind); touch/highFive.ts (highFive.meeting, return).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanTarget.IDefault, IAutoMovieVector3, IAutoMovieMotionCoupling, IAutoMovieMotionHumanBody identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionMeeting {
  /**
   * The film seconds a meeting holds over, as the composition states them:
   * the contact is made no earlier than `from` and left at `to`, and the
   * partners are free before and after. A meeting whose natural contact
   * comes before `from` is moved later as a whole; one that would leave
   * before `to` is held until then.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what each bound does and what is free outside them.
   * @evidence contracts/development/design.md#principled-representation A held meeting (a hug, a clasp) lasts as long as the story says, which only the composition knows; its two ends are film seconds every role reads alike.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two optional numbers, read by `of`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A window cannot shorten a meeting below its natural contact: `of` refuses it instead of cutting the reach.
   */
  export interface IWindow {
    /** The earliest film second of the contact; the natural one when absent. */
    from?: number;

    /** The film second the contact is left; the natural one when absent. */
    to?: number;
  }

  /**
   * A kind of mutual action: its roles, its contacts and its natural timing.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what a kind is; each member and both methods give their meaning, parameters and units.
   * @evidence contracts/development/design.md#principled-representation A kind is what differs between mutual actions: who takes part, where they touch and how long each takes to get there. The frame, the order and the shared instants are the same for all and are computed by `of`.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Five members. handshakeMeeting, HumanHandoverMeeting, highFive and HumanCarriedCoupling construct kinds read by HumanPerformanceMeeting.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The contacts are default places, so one statement serves both the mean when together and the offer when alone; `place` is optional because the mean of the defaults is the right meeting point for a symmetric kind.
   */
  export interface IKind {
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
      role: IAutoMovieMotionMeeting.IRole,
      contacts: Readonly<Record<string, IAutoMovieVector3>>,
    ): IAutoMovieMotionMeeting.ITiming;

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
      roles: readonly IAutoMovieMotionMeeting.IRole[],
    ): Record<string, IAutoMovieVector3>;

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
      roles: readonly IAutoMovieMotionMeeting.IRole[],
      instants: IAutoMovieMotionMeeting.ITiming,
    ): IAutoMovieMotionCoupling;
  }

  /**
   * One performer's part in a meeting, as it stands when the meeting starts.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the record is and at which moment; each member gives its meaning.
   * @evidence contracts/development/design.md#principled-representation What a kind needs to place contacts and time a role: who it is, its body, where it stands and where its bones are at the start.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Five required members and whether a seat bears the role; the posture and the bones are picks of their owners' types, only the members a meeting reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The one optional member is the seat, absent for the standing body most meetings hold; an absent performer is an absent role, not a role with empty fields.
   */
  export interface IRole {
    /** The role's name within the kind (`giver`, `attacker`). */
    name: string;

    /** The performer's subject id. */
    subject: string;

    /** The performer's body. */
    body: IAutoMovieMotionHumanBody;

    /** Where the performer stands. */
    posture: Pick<IAutoMovieMotionHumanPosture, "root" | "yaw">;

    /** The performer's world bones there. */
    bones: ReadonlyMap<
      AutoMovieHumanoidBone,
      Pick<IAutoMovieResolvedBone, "worldPosition" | "worldRotation">
    >;

    /** Whether a seat bears the performer then, so a reach may lean the trunk over the seat; standing when absent. */
    seated?: boolean;
  }

  /**
   * The three instants a meeting shares.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the record is; each member gives its meaning and unit.
   * @evidence contracts/development/design.md#principled-representation The instants two performers must agree on are when both are ready, when the contact is made and when it is left; they carry the names of a phrase's standard instants, so each law pins its own clock to them.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three required numbers, used for a role's natural timing, the meeting's film seconds and an action's local seconds.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts One record for all three uses, whose origin each use states, instead of three records of the same shape.
   */
  export interface ITiming {
    /** When the roles are ready to meet, seconds. */
    ready: number;

    /** When the contact is made, seconds. */
    stroke: number;

    /** When the contact is left, seconds. */
    relax: number;
  }

  /**
   * A meeting.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member gives its meaning, frame and unit; the frame states both its two-role and its one-role form.
   * @evidence contracts/development/design.md#principled-representation The contacts are stored in the shared frame, so they read the same for both roles and survive a move of the pair; the instants are film seconds, the one time both actions share.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Six required members of plain data, with no body or bone kept, so the record can be carried by the action context.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `solid` is the one fact a law cannot derive from the rest, since the roles present do not say how many the kind has.
   */
  export interface IMeeting {
    /** The kind's name. */
    kind: string;

    /**
     * The shared frame: its origin on the floor at the mean of the roles'
     * floor points, heading from the first role to the second, or to the
     * mean floor point of the others when more than two meet; one role's own
     * floor point and heading when it is alone.
     */
    frame: IAutoMovieMotionHumanFrame.IFrame;

    /** Each contact's point in the frame; `x` left, `y` up, `z` forward, metres. */
    contacts: Readonly<Record<string, IAutoMovieVector3>>;

    /** The shared instants, film seconds. */
    instants: IAutoMovieMotionMeeting.ITiming;

    /** The roles present, in the meeting's order. */
    roles: readonly Pick<IAutoMovieMotionMeeting.IRole, "name" | "subject">[];

    /** Whether every role is present, so the contacts can be touched. */
    solid: boolean;

    /** How one role bears another, for a kind that couples them and when the meeting is solid. */
    coupling?: IAutoMovieMotionCoupling;
  }

  /**
   * The meeting of a mutual action. Input context of AutoMovieMotionMeeting.of. The film second the meeting starts at.
   *
   * @evidence contracts/development/common.md#meaningful-documentation start: Action start in performance seconds, used to place the meeting on the shared timeline.
   * @evidence contracts/development/design.md#principled-representation start: Action start in performance seconds, used to place the meeting on the shared timeline.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/AutoMovieMotionMeeting.ts (AutoMovieMotionMeeting.of, context).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in AutoMovieMotionMeeting.of.
   */
  export type IOfContext = {
    /** Action start in performance seconds, used to place the meeting on the shared timeline. */
    start: number;
  };
}
