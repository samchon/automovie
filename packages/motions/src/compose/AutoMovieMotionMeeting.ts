import { type IAutoMovieResolvedBone, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { AutoMovieMotionHumanTarget } from "./AutoMovieMotionHumanTarget";

/**
 * The meeting of an action two performers do together: one frame with the
 * place of each shared contact, and the film seconds both arrive at, hold
 * and leave.
 *
 * A meeting is computed once, by a pure function of where the roles stand
 * when it starts, and every role's law reads the same record, so no law
 * derives its partner's side of a contact. The roles are put in one order
 * (by role name, then by subject) before anything is computed, so the record
 * is the same whichever role asks first. A role with no performer is left
 * out: the contacts are then the present role's default places and the
 * meeting is not solid, so each role's law performs alone in the air.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a meeting holds, when it is computed, why the order of asking does not matter and what a missing role means.
 * @evidence contracts/development/design.md#principled-representation A mutual action has one geometry and one timing that both performers obey, the scene with named roles of contextual animation and the shared synchronisation points of BML; the record is that scene, so neither law derives the other's side.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Four records and three functions. The performance computes the meeting and the action context carries it; the mutual laws read it with #3286. Default places and their resolution stay `AutoMovieMotionHumanTarget`'s.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A missing role is a shorter role list and a meeting that is not solid, not a partner made up to fill it.
 */
export namespace AutoMovieMotionMeeting {
  /**
   * One performer's part in a meeting, as it stands when the meeting starts.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the record is and at which moment; each member gives its meaning.
   * @evidence contracts/development/design.md#principled-representation What a kind needs to place contacts and time a role: who it is, its body, where it stands and where its bones are at the start.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Five required members; the posture and the bones are picks of their owners' types, only the members a meeting reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No optional member; an absent performer is an absent role, not a role with empty fields.
   */
  export interface IRole {
    /** The role's name within the kind (`giver`, `attacker`). */
    name: string;

    /** The performer's subject id. */
    subject: string;

    /** The performer's body. */
    body: IHumanBody;

    /** Where the performer stands. */
    posture: Pick<IHumanPosture, "root" | "yaw">;

    /** The performer's world bones there. */
    bones: ReadonlyMap<
      AutoMovieHumanoidBone,
      Pick<IAutoMovieResolvedBone, "worldPosition" | "worldRotation">
    >;
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
   * A kind of mutual action: its roles, its contacts and its natural timing.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what a kind is; each member and both methods give their meaning, parameters and units.
   * @evidence contracts/development/design.md#principled-representation A kind is what differs between mutual actions: who takes part, where they touch and how long each takes to get there. The frame, the order and the shared instants are the same for all and are computed by `of`.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Five members. No kind is shipped in this package yet beyond the feature test's; the handshake, the handover and the strike define theirs with #3286.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The contacts are default places, so one statement serves both the mean when together and the offer when alone; `place` is optional because the mean of the defaults is the right meeting point for a symmetric kind.
   */
  export interface IKind {
    /** The kind's name (`handshake`, `handover`, `strike`). */
    name: string;

    /** The role names, one per performer; a symmetric action names one role twice. */
    roles: readonly string[];

    /** Each shared contact's default place, which a role offers when alone. */
    contacts: Readonly<Record<string, AutoMovieMotionHumanTarget.IDefault>>;

    /**
     * One role's natural timing toward the contacts.
     *
     * @param role The role.
     * @param contacts The contacts' world points, metres.
     * @returns The role's instants, seconds since the meeting's start.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the role and the contacts it is given, and that the instants are seconds since the meeting's start.
     * @evidence contracts/development/implementation.md#principled-implementation A role's own timing toward the contacts, from where it stands and where its bones are, so the meeting takes the latest of each instant over the roles.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One required member of a kind, called once per role by `of`. No kind is shipped in this package yet beyond the feature test's; the laws that define theirs come with issue #3286.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The member returns instants and no shared ones; the pair's shared instants are `of`'s, so no role is timed by its partner's guess.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared member has no body, so it has no algorithm; the cost belongs to each implementation.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared member coordinates no work, so it shares none.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared member owns no state; what an implementation retains is stated by the function that builds it.
     */
    timing(
      role: IRole,
      contacts: Readonly<Record<string, IAutoMovieVector3>>,
    ): ITiming;

    /**
     * Where the contacts lie when every role is present; the mean of the
     * roles' default places when absent.
     *
     * @param roles The roles, in the meeting's order.
     * @returns Each contact's world point, metres.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the roles it is given, their order, the unit and the frame of the result, and that its absence means the mean of the default places.
     * @evidence contracts/development/implementation.md#principled-implementation A kind that knows where its contacts lie better than the mean of the roles' default places says so here, and `of` calls it only when every role is present.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One optional member of a kind, called at most once by `of`. No kind is shipped in this package yet beyond the feature test's.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts When a role is missing `of` does not call it, so a kind's placement never sees a partner made up to fill a role.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared member has no body, so it has no algorithm; the cost belongs to each implementation.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared member coordinates no work, so it shares none.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared member owns no state; what an implementation retains is stated by the function that builds it.
     */
    place?(roles: readonly IRole[]): Record<string, IAutoMovieVector3>;
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
     * floor points, heading from the first role to the second; one role's
     * own floor point and heading when it is alone.
     */
    frame: HumanFrame.IFrame;

    /** Each contact's point in the frame; `x` left, `y` up, `z` forward, metres. */
    contacts: Readonly<Record<string, IAutoMovieVector3>>;

    /** The shared instants, film seconds. */
    instants: ITiming;

    /** The roles present, in the meeting's order. */
    roles: readonly Pick<IRole, "name" | "subject">[];

    /** Whether every role is present, so the contacts can be touched. */
    solid: boolean;
  }

  /**
   * The meeting of a mutual action.
   *
   * @param kind The kind.
   * @param roles The roles present, in any order.
   * @param context The film second the meeting starts at.
   * @returns The meeting.
   * @throws {Error} With no role, more roles than the kind has, or a role the kind does not name.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, that the roles' order is free and the three refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The roles are sorted by name and then subject before anything is read, so the result does not depend on who asks. The frame sits at the mean floor point heading from the first role to the second; each contact is the kind's own placement or the mean of the roles' default places; each shared instant is the latest of the roles' natural ones, since the pair can meet only when the slower role arrives.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Validate, order, frame, contacts, instants, record, in that order with one local each.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An empty, oversized or misnamed role list throws with the kind's roles named. Roles on one floor point take the first role's heading instead of an undefined direction. A role count is checked against the kind's, not each name's multiplicity.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two roles and a few contacts; one sort and one pass each.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Default places resolve through `AutoMovieMotionHumanTarget.fallback` and the frame change through `HumanFrame.local`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function; the record keeps no body, posture or bone.
   */
  export function of(
    kind: IKind,
    roles: readonly IRole[],
    context: { start: number },
  ): IMeeting {
    if (roles.length === 0 || roles.length > kind.roles.length)
      throw new Error(
        `A ${kind.name} meets ${kind.roles.length} roles at most and one at least`,
      );
    for (const role of roles)
      if (!kind.roles.includes(role.name))
        throw new Error(
          `A ${kind.name} has no role "${role.name}"; its roles are ${kind.roles.join(", ")}`,
        );
    const ordered: IRole[] = [...roles].sort((a: IRole, b: IRole): number =>
      a.name !== b.name
        ? a.name < b.name
          ? -1
          : 1
        : a.subject < b.subject
          ? -1
          : a.subject > b.subject
            ? 1
            : 0,
    );
    const solid: boolean = ordered.length === kind.roles.length;
    const floors: IAutoMovieVector3[] = ordered.map(
      (r: IRole): IAutoMovieVector3 => ({
        x: r.posture.root.x,
        y: 0,
        z: r.posture.root.z,
      }),
    );
    const origin: IAutoMovieVector3 = mean(floors);
    const across: IAutoMovieVector3 =
      ordered.length < 2
        ? { x: 0, y: 0, z: 0 }
        : Vector3.subtract(floors[1]!, floors[0]!);
    const frame: HumanFrame.IFrame = {
      origin,
      yaw:
        Vector3.length(across) < 1e-9
          ? ordered[0]!.posture.yaw
          : (Math.atan2(across.x, across.z) * 180) / Math.PI,
    };
    const world: Record<string, IAutoMovieVector3> =
      solid && kind.place !== undefined
        ? kind.place(ordered)
        : Object.fromEntries(
            Object.entries(kind.contacts).map(
              ([name, place]: [string, AutoMovieMotionHumanTarget.IDefault]): [
                string,
                IAutoMovieVector3,
              ] => [
                name,
                mean(
                  ordered.map(
                    (r: IRole): IAutoMovieVector3 =>
                      AutoMovieMotionHumanTarget.fallback(
                        r.body,
                        r.posture,
                        place,
                      ).point,
                  ),
                ),
              ],
            ),
          );
    const timings: ITiming[] = ordered.map(
      (r: IRole): ITiming => kind.timing(r, world),
    );
    const latest = (key: keyof ITiming): number =>
      context.start + Math.max(...timings.map((t: ITiming): number => t[key]));
    return {
      kind: kind.name,
      frame,
      contacts: Object.fromEntries(
        Object.entries(world).map(
          ([name, point]: [string, IAutoMovieVector3]): [
            string,
            IAutoMovieVector3,
          ] => [name, HumanFrame.local(frame, point)],
        ),
      ),
      instants: {
        ready: latest("ready"),
        stroke: latest("stroke"),
        relax: latest("relax"),
      },
      roles: ordered.map(
        (r: IRole): Pick<IRole, "name" | "subject"> => ({
          name: r.name,
          subject: r.subject,
        }),
      ),
      solid,
    };
  }

  /**
   * A contact of a meeting as the place one performer directs a movement at:
   * the contact's world point, facing back at that performer along the floor.
   *
   * @param meeting The meeting.
   * @param contact The contact's name.
   * @param posture Where the performer stands.
   * @returns The place, solid when the meeting is.
   * @throws {Error} On a contact the meeting lacks.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the place's point and facing, when it is solid and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation A contact between two people is approached from each one's own side, so the place faces back at the asking performer along the floor and the two roles get opposite normals on one point.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup, one frame change and one normal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unknown contact throws with the meeting's contacts named; a performer standing on the contact takes the direction behind its own heading instead of a zero normal.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Returns `AutoMovieMotionHumanTarget.IPlace`, so `hand` and the phrases take it like any resolved target.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function place(
    meeting: IMeeting,
    contact: string,
    posture: Pick<IHumanPosture, "root" | "yaw">,
  ): AutoMovieMotionHumanTarget.IPlace {
    const local: IAutoMovieVector3 | undefined = meeting.contacts[contact];
    if (local === undefined)
      throw new Error(
        `The ${meeting.kind} has no contact "${contact}"; its contacts are ${Object.keys(meeting.contacts).join(", ")}`,
      );
    const point: IAutoMovieVector3 = HumanFrame.point(meeting.frame, local);
    const back: IAutoMovieVector3 = {
      x: posture.root.x - point.x,
      y: 0,
      z: posture.root.z - point.z,
    };
    return {
      point,
      normal:
        Vector3.length(back) < 1e-9
          ? HumanFrame.point(
              { origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw },
              { x: 0, y: 0, z: -1 },
            )
          : Vector3.normalize(back),
      solid: meeting.solid,
    };
  }

  /**
   * A meeting's shared instants on one action's own time.
   *
   * @param meeting The meeting.
   * @param start The film second of the action's time zero.
   * @returns The instants, seconds since the action's start.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the conversion and both time origins.
   * @evidence contracts/development/implementation.md#principled-implementation Film seconds less the action's start are the action's own seconds, the time its clock is built on.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record of three differences.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None: an instant before the action's start comes out negative and is not clamped, so the law that pins its clock to it sees that it started too late.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Three subtractions with nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function local(meeting: IMeeting, start: number): ITiming {
    return {
      ready: meeting.instants.ready - start,
      stroke: meeting.instants.stroke - start,
      relax: meeting.instants.relax - start,
    };
  }

  /** The mean of points. */
  const mean = (points: readonly IAutoMovieVector3[]): IAutoMovieVector3 =>
    Vector3.scale(
      points.reduce(
        (sum: IAutoMovieVector3, p: IAutoMovieVector3): IAutoMovieVector3 =>
          Vector3.add(sum, p),
        { x: 0, y: 0, z: 0 },
      ),
      1 / points.length,
    );
}
