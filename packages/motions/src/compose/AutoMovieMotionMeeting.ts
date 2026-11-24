import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionCoupling,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanTarget,
  IAutoMovieMotionMeeting,
  IAutoMovieMotionMeetingKind,
  IAutoMovieMotionMeetingRole,
  IAutoMovieMotionMeetingTiming,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFrame } from "../posture/HumanFrame";
import { AutoMovieMotionHumanTarget } from "./AutoMovieMotionHumanTarget";

/** The alternatives of `PlacePosture`'s site. */
type PlacePosture = "root" | "yaw";

/** The alternatives of `OfResult`'s site. */
type OfResult = "name" | "subject";

/**
 * The meeting of an action two or more performers do together: one frame with
 * the place of each shared contact, and the film seconds all arrive at, hold
 * and leave.
 *
 * A meeting is computed once, by a pure function of where the roles stand when
 * it starts, and every role's law reads the same record, so no law derives its
 * partner's side of a contact. The roles are put in one order (by role name,
 * then by subject) before anything is computed, so the record is the same
 * whichever role asks first. A role with no performer is left out: the contacts
 * are then the present role's default places and the meeting is not solid, so
 * each role's law performs alone in the air.
 */
export namespace AutoMovieMotionMeeting {
  /**
   * The meeting of a mutual action.
   *
   * @param kind The kind.
   * @param roles The roles present, in any order.
   * @param context The film second the meeting starts at.
   * @param window The film seconds it holds over; its natural instants when
   *   absent.
   * @returns The meeting.
   * @throws {HumanRefusal} A `participant` refusal on `roles` with the kind's
   *   range of roles, with no role or more roles than the kind has; on `role`
   *   listing the kind's roles, for a role it does not name; and a `parameter`
   *   refusal on `window` when the window ends before the contact can be made.
   */
  export function of(
    kind: IAutoMovieMotionMeetingKind,
    roles: readonly IAutoMovieMotionMeetingRole[],
    context: IAutoMovieMotionMeeting.IOfContext,
    window?: IAutoMovieMotionMeeting.IWindow,
  ): IAutoMovieMotionMeeting {
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
    const ordered: IAutoMovieMotionMeetingRole[] = [...roles].sort(
      (
        a: IAutoMovieMotionMeetingRole,
        b: IAutoMovieMotionMeetingRole,
      ): number =>
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
      (r: IAutoMovieMotionMeetingRole): IAutoMovieVector3 => ({
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
    const frame: IAutoMovieMotionHumanFrame = {
      origin,
      yaw:
        Vector3.length(across) < 1e-9
          ? ordered[0]!.posture.yaw
          : (Math.atan2(across.x, across.z) * 180) / Math.PI,
    };
    const surfaces:
      | Record<string, IAutoMovieMotionMeetingKind.ISurface>
      | undefined = solid ? kind.surfaces?.(ordered) : undefined;
    let world: Record<string, IAutoMovieVector3>;
    let normals: Record<string, IAutoMovieVector3> | undefined;
    if (surfaces !== undefined) {
      const axes: IAutoMovieMotionHumanFrame = {
        origin: { x: 0, y: 0, z: 0 },
        yaw: frame.yaw,
      };
      world = {};
      normals = {};
      for (const [name, surface] of Object.entries(surfaces)) {
        world[name] = surface.point;
        normals[name] = HumanFrame.local(axes, surface.normal);
      }
    } else if (solid && kind.place !== undefined) world = kind.place(ordered);
    else
      world = Object.fromEntries(
        Object.entries(kind.contacts).map(
          ([name, place]: [string, IAutoMovieMotionHumanTarget.IDefault]): [
            string,
            IAutoMovieVector3,
          ] => [
            name,
            mean(
              ordered.map(
                (r: IAutoMovieMotionMeetingRole): IAutoMovieVector3 =>
                  AutoMovieMotionHumanTarget.fallback(r.body, r.posture, place)
                    .point,
              ),
            ),
          ],
        ),
      );
    const timings: IAutoMovieMotionMeetingTiming[] = ordered.map(
      (r: IAutoMovieMotionMeetingRole): IAutoMovieMotionMeetingTiming =>
        kind.timing(r, world),
    );
    const latest = (key: keyof IAutoMovieMotionMeetingTiming): number =>
      context.start +
      Math.max(
        ...timings.map((t: IAutoMovieMotionMeetingTiming): number => t[key]),
      );

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
    const instants: IAutoMovieMotionMeetingTiming = {
      ready: latest("ready") + shift,
      stroke,
      relax: window?.to ?? latest("relax") + shift,
    };

    // A coupling is the kind's, from the ordered roles, and only when every
    // role is present.
    const coupling: IAutoMovieMotionCoupling | undefined =
      solid && kind.couple !== undefined
        ? kind.couple(ordered, instants)
        : undefined;
    return {
      kind: kind.name,
      frame,
      ...(normals === undefined ? {} : { normals }),
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
        (
          r: IAutoMovieMotionMeetingRole,
        ): Pick<IAutoMovieMotionMeetingRole, OfResult> => ({
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
   * @throws {HumanRefusal} A `parameter` refusal on `contact` that lists the
   *   meeting's contacts, on a contact the meeting lacks.
   */
  export function place(
    meeting: IAutoMovieMotionMeeting,
    contact: string,
    posture: Pick<IAutoMovieMotionHumanPosture, PlacePosture>,
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
    const surface: IAutoMovieVector3 | undefined = meeting.normals?.[contact];
    if (surface !== undefined)
      return {
        point,
        solid: meeting.solid,
        normal: HumanFrame.point(
          { origin: { x: 0, y: 0, z: 0 }, yaw: meeting.frame.yaw },
          surface,
        ),
      };
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
   */
  export function local(
    meeting: IAutoMovieMotionMeeting,
    start: number,
  ): IAutoMovieMotionMeetingTiming {
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
