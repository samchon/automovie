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
 */
export namespace AutoMovieMotionMeeting {
  /** One performer's part in a meeting, as it stands when the meeting starts. */
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

  /** The three instants a meeting shares. */
  export interface ITiming {
    /** When the roles are ready to meet, seconds. */
    ready: number;

    /** When the contact is made, seconds. */
    stroke: number;

    /** When the contact is left, seconds. */
    relax: number;
  }

  /** A kind of mutual action: its roles, its contacts and its natural timing. */
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
     */
    place?(roles: readonly IRole[]): Record<string, IAutoMovieVector3>;
  }

  /** A meeting. */
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
