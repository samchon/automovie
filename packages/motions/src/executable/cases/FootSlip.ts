import {
  type IAutoMovieResolvedBone,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../../body/IHumanBody";

/**
 * How far a planted foot slides, the one rule every capture case measures
 * foot slip by.
 *
 * A planted foot rolls through the rockers of stance (Perry and Burnfield):
 * on its heel, flat, then on its ball and its toe pad. Its contact at an
 * instant is therefore its lowest sole socket, the heel winning a tie within
 * a micrometre, then the ball, so a flat foot does not flicker between
 * sockets. A socket that is not the lowest is lifted and free to travel: a
 * ball a few millimetres up in the forefoot rocker turns about the toe pad
 * and is not sliding. The slip is the contact's horizontal distance from
 * where that socket first was the contact in the same plant window; the
 * anchor is kept for the whole window, so a socket that leaves the floor and
 * returns is still measured from where it first stood.
 */
export namespace FootSlip {
  /** A sole socket. */
  export type Socket = "heel" | "ball" | "toe";

  /** A sole socket's displayed place. */
  export interface IPoint {
    /** Which socket. */
    socket: Socket;

    /** Where it is, world metres. */
    point: IAutoMovieVector3;
  }

  /**
   * A foot's three sole sockets on displayed bones, heel first.
   *
   * @param body The body.
   * @param bones The displayed bones.
   * @param side The foot.
   * @returns The heel, the ball and the toe.
   */
  export function points(
    body: IHumanBody,
    bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    side: "left" | "right",
  ): IPoint[] {
    return (["heel", "ball", "toe"] as const).map((socket: Socket): IPoint => {
      const frame =
        body.surfaces.sockets[`${socket}${side === "left" ? "Left" : "Right"}`];
      return {
        socket,
        point: resolveAutoMovieHumanoidSurfaces.place(
          frame,
          bones.get(frame.bone)!,
        ).point,
      };
    });
  }

  /**
   * The contact of a foot: its lowest sole socket.
   *
   * @param sole The foot's sockets, in tie order.
   * @returns The lowest.
   */
  export function contact(sole: IPoint[]): IPoint {
    let lowest: IPoint = sole[0]!;
    for (const p of sole) if (p.point.y < lowest.point.y - 1e-6) lowest = p;
    return lowest;
  }

  /**
   * The slip of a contact within a plant window.
   *
   * @param anchors Where each socket first was the contact, per window; the caller keeps one map per measurement and this fills it.
   * @param window A key naming the foot and its plant window.
   * @param at The contact now.
   * @returns Its horizontal distance from its anchor, metres.
   */
  export function drift(
    anchors: Map<string, IAutoMovieVector3>,
    window: string,
    at: IPoint,
  ): number {
    const key: string = `${window} ${at.socket}`;
    const anchor: IAutoMovieVector3 = anchors.get(key) ?? at.point;
    anchors.set(key, anchor);
    return Math.hypot(at.point.x - anchor.x, at.point.z - anchor.z);
  }
}
