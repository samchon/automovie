import type { IAutoMovieMotionCoupling, IAutoMovieMotionHumanFrame, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanTarget, IAutoMovieMotionMeeting, IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "@automovie/engine";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFrame } from "../posture/HumanFrame";
import { AutoMovieMotionHumanTarget } from "./AutoMovieMotionHumanTarget";

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
 * @evidence contracts/development/common.md#meaningful-documentation States what a meeting holds, when it is computed, why the order of asking does not matter and what a missing role means.
 * @evidence contracts/development/design.md#principled-representation A mutual action has one geometry and one timing that both performers obey, the scene with named roles of contextual animation and the shared synchronisation points of BML; the record is that scene, so neither law derives the other's side.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Five records, the coupling's two names (IAutoMovieMotionCoupling, #3437) and three functions. The performance computes the meeting and the action context carries it; the mutual laws read it with #3286. Default places and their resolution stay `AutoMovieMotionHumanTarget`'s.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A missing role is a shorter role list and a meeting that is not solid, not a partner made up to fill it.
 */
export namespace AutoMovieMotionMeeting {

  /**
   * The meeting of a mutual action.
   *
   * @param kind The kind.
   * @param roles The roles present, in any order.
   * @param context The film second the meeting starts at.
   * @param window The film seconds it holds over; its natural instants when absent.
   * @returns The meeting.
   * @throws {HumanRefusal} A `participant` refusal on `roles` with the kind's range of roles, with no role or more roles than the kind has; on `role` listing the kind's roles, for a role it does not name; and a `parameter` refusal on `window` when the window ends before the contact can be made.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, that the roles' order is free, the two `participant` refusals (the count of roles with its range, a role the kind does not name with its roles) and the `window` refusal that names the earliest second the contact can be made.
   * @evidence contracts/development/implementation.md#principled-implementation The roles are sorted by name and then subject before anything is read, so the result does not depend on who asks. The frame sits at the mean floor point heading from the first role to the second; each contact is the kind's own placement or the mean of the roles' default places; each shared instant is the latest of the roles' natural ones, since the pair can meet only when the slower role arrives; a window moves the instants later to its start and holds the contact to its end.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Validate, order, frame, contacts, instants, record, in that order with one local each.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An empty, oversized or misnamed role list is refused with the kind's roles named. Roles on one floor point take the first role's heading instead of an undefined direction. A role count is checked against the kind's, not each name's multiplicity.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two roles and a few contacts; one sort and one pass each.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Default places resolve through `AutoMovieMotionHumanTarget.fallback` and the frame change through `HumanFrame.local`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function; the record keeps no body, posture or bone.
   */
  export function of(
    kind: IAutoMovieMotionMeeting.IKind,
    roles: readonly IAutoMovieMotionMeeting.IRole[],
    context: IAutoMovieMotionMeeting.IOfContext,
    window?: IAutoMovieMotionMeeting.IWindow,
  ): IAutoMovieMotionMeeting.IMeeting {
    if (roles.length === 0 || roles.length > kind.roles.length)
      throw new HumanRefusal({
        kind: "participant",
        axis: "roles",
        value: roles.length,
        feasible: {
          kind: "range",
          minimum: 1,
          maximum: kind.roles.length,
          unit: "",
          whole: true,
        },
        reason: `a ${kind.name} meets ${kind.roles.length} roles at most and one at least, and ${roles.length} were given`,
        fix: `give between one and ${kind.roles.length} of its roles: ${kind.roles.join(", ")}`,
      });
    for (const role of roles)
      if (!kind.roles.includes(role.name))
        throw new HumanRefusal({
          kind: "participant",
          axis: "role",
          value: role.name,
          feasible: { kind: "alternatives", values: [...new Set(kind.roles)] },
          reason: `a ${kind.name} has no role "${role.name}"; its roles are ${kind.roles.join(", ")}`,
          fix: "name one of the kind's roles",
        });
    const ordered: IAutoMovieMotionMeeting.IRole[] = [...roles].sort((a: IAutoMovieMotionMeeting.IRole, b: IAutoMovieMotionMeeting.IRole): number =>
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
      (r: IAutoMovieMotionMeeting.IRole): IAutoMovieVector3 => ({
        x: r.posture.root.x,
        y: 0,
        z: r.posture.root.z,
      }),
    );
    const origin: IAutoMovieVector3 = mean(floors);

    // From the first role toward the others: the second role of two, and
    // the middle of the rest when more meet, so no later role's place alone
    // turns the frame.
    const across: IAutoMovieVector3 =
      ordered.length < 2
        ? { x: 0, y: 0, z: 0 }
        : Vector3.subtract(mean(floors.slice(1)), floors[0]!);
    const frame: IAutoMovieMotionHumanFrame.IFrame = {
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
              ([name, place]: [string, IAutoMovieMotionHumanTarget.IDefault]): [
                string,
                IAutoMovieVector3,
              ] => [
                name,
                mean(
                  ordered.map(
                    (r: IAutoMovieMotionMeeting.IRole): IAutoMovieVector3 =>
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
    const timings: IAutoMovieMotionMeeting.ITiming[] = ordered.map(
      (r: IAutoMovieMotionMeeting.IRole): IAutoMovieMotionMeeting.ITiming => kind.timing(r, world),
    );
    const latest = (key: keyof IAutoMovieMotionMeeting.ITiming): number =>
      context.start + Math.max(...timings.map((t: IAutoMovieMotionMeeting.ITiming): number => t[key]));

    // A window moves the whole meeting later to its start and holds the
    // contact to its end.
    const shift: number =
      window?.from === undefined
        ? 0
        : Math.max(0, window.from - latest("stroke"));
    const stroke: number = latest("stroke") + shift;
    if (window?.to !== undefined && !(window.to >= stroke - 1e-9))
      throw new HumanRefusal({
        kind: "parameter",
        axis: "window",
        value: window.to,
        feasible: { kind: "range", minimum: stroke, maximum: null, unit: "s" },
        reason: `the ${kind.name} cannot make its contact before ${stroke.toFixed(2)} s, so a window that ends at ${window.to.toFixed(2)} s holds nothing`,
        fix: "end the window later, or start the action earlier",
      });
    const instants: IAutoMovieMotionMeeting.ITiming = {
      ready: latest("ready") + shift,
      stroke,
      relax: window?.to ?? latest("relax") + shift,
    };

    // A coupling is the kind's, from the ordered roles, and only when every
    // role is present (#3437).
    const coupling: IAutoMovieMotionCoupling | undefined =
      solid && kind.couple !== undefined
        ? kind.couple(ordered, instants)
        : undefined;
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
      instants,
      roles: ordered.map(
        (r: IAutoMovieMotionMeeting.IRole): Pick<IAutoMovieMotionMeeting.IRole, "name" | "subject"> => ({
          name: r.name,
          subject: r.subject,
        }),
      ),
      solid,
      ...(coupling === undefined ? {} : { coupling }),
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
   * @throws {HumanRefusal} A `parameter` refusal on `contact` that lists the meeting's contacts, on a contact the meeting lacks.
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
    meeting: IAutoMovieMotionMeeting.IMeeting,
    contact: string,
    posture: Pick<IAutoMovieMotionHumanPosture, "root" | "yaw">,
  ): IAutoMovieMotionHumanTarget.IPlace {
    const local: IAutoMovieVector3 | undefined = meeting.contacts[contact];
    if (local === undefined)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "contact",
        value: contact,
        feasible: {
          kind: "alternatives",
          values: Object.keys(meeting.contacts),
        },
        reason: `the ${meeting.kind} has no contact "${contact}"; its contacts are ${Object.keys(meeting.contacts).join(", ")}`,
        fix: "name one of the meeting's contacts",
      });
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
  export function local(meeting: IAutoMovieMotionMeeting.IMeeting, start: number): IAutoMovieMotionMeeting.ITiming {
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
