import type { IAutoMovieVector3 } from "@automovie/interface";

import type { Student } from "../../entities/cast/student/Student";
import type { IStageSet } from "../../entities/sets/IStageSet";
import { BodyFrame } from "../../laws/body/BodyFrame";
import type { IBodyState } from "../../laws/body/IBodyState";
import { EverydayLaw } from "../../laws/everyday/EverydayLaw";
import { Gait } from "../../laws/everyday/Gait";
import type { StageAction } from "../../laws/staging/StageAction";
import type { StageContext } from "../staging/StageContext";

/**
 * Where a walk goes: its end point and facing (beside a person at a
 * distance or offset, in front of a seat, or at a place), and the one bend
 * that takes it around another person standing in its straight line.
 *
 * ```ts
 * const end = WalkRoute.destination(action, from, context);
 * const via = WalkRoute.detour(from.position, end.position, action, context, carina);
 * ```
 *
 * @evidence docs/research/everyday/walking.md#transitions Stop at conversational or handing distance; a blocked line bends 0.6 m around the person in it.
 * @evidence docs/research/everyday/sitting.md#stand-to-sit The walk to a seat ends with the calves at its front edge, back to it.
 * @evidence contracts/development/behaviors.md#relational-goals The end and the bend resolve against the other people's positions.
 * @evidence contracts/development/common.md#meaningful-documentation States both rules.
 */
export namespace WalkRoute {
  /**
   * A point the walk bends through when its straight line would pass within
   * 0.5 m of another person on the ground (other than a person it walks to,
   * or one it starts or ends beside): 0.6 m from that person's centre on the
   * side the line already passes; undefined when the way is clear.
   *
   * @param from Start point.
   * @param to End point.
   * @param action The walk.
   * @param context The stage at the walk's start.
   * @param student The walker.
   * @returns The bend point, or undefined.
   */
  export function detour(
    from: IAutoMovieVector3,
    to: IAutoMovieVector3,
    action: Extract<StageAction.Action, { kind: "walk" }>,
    context: StageContext,
    student: Student,
  ): IAutoMovieVector3 | undefined {
    const dx: number = to.x - from.x;
    const dz: number = to.z - from.z;
    const length: number = Math.hypot(dx, dz);
    if (length < 0.3) return undefined;
    let nearest: { t: number; q: IAutoMovieVector3; c: IAutoMovieVector3; radius: number } | undefined;
    for (const id of context.world.students.keys()) {
      if (id === student.id || ("subject" in action.to && action.to.subject === id) || !context.entered(id)) continue;
      const q: IAutoMovieVector3 = context.body(id).position;

      // Riders are above the walk; a seated person's legs reach forward, so they get a wider berth.
      if (q.y > 1.0) continue;
      const seated: boolean = q.y > 0.3;
      const clear: number = seated ? 0.75 : 0.5;
      const t: number = Math.max(0, Math.min(1, ((q.x - from.x) * dx + (q.z - from.z) * dz) / (length * length)));
      const c: IAutoMovieVector3 = { x: from.x + dx * t, y: 0, z: from.z + dz * t };
      const d: number = Math.hypot(q.x - c.x, q.z - c.z);
      // A person beside the end is the one walked up to; one beside the start counts only if the walk passes them rather than leaving them behind.
      if (d >= clear || Math.hypot(q.x - to.x, q.z - to.z) < 0.45 || t <= 0.02) continue;
      if (!nearest || t < nearest.t) nearest = { t, q, c, radius: seated ? 0.85 : 0.6 };
    }
    if (!nearest) return undefined;
    const ox: number = nearest.c.x - nearest.q.x;
    const oz: number = nearest.c.z - nearest.q.z;
    const n: number = Math.hypot(ox, oz);
    // On the line's own side of the person, or to the walker's left when the line runs through the centre.
    const side = n > 1e-3 ? { x: ox / n, z: oz / n } : { x: dz / length, z: -dx / length };
    return { x: nearest.q.x + side.x * nearest.radius, y: 0, z: nearest.q.z + side.z * nearest.radius };
  }

  /**
   * Where a walk ends and which way it faces.
   *
   * @param action The walk.
   * @param from The walker's state.
   * @param context The stage at the walk's start.
   * @param at The second a person walked to is read at; the walk's start by default.
   * @returns End point and facing.
   */
  export function destination(
    action: Extract<StageAction.Action, { kind: "walk" }>,
    from: IBodyState,
    context: StageContext,
    at: number = context.time,
  ): { position: IAutoMovieVector3; heading: number } {
    let position: IAutoMovieVector3;
    if ("subject" in action.to && context.world.students.has(action.to.subject)) {
      const other: IBodyState = context.body(action.to.subject, at);
      if (action.offset !== undefined) {
        position = BodyFrame.toWorld(other.position, other.heading, { forward: action.offset.forward, left: action.offset.left, up: 0 });
      } else {
        const d: number = action.distance ?? EverydayLaw.CONVERSATION;
        const toward: number = BodyFrame.headingTo(other.position, from.position);
        position = BodyFrame.toWorld(other.position, toward, { forward: d, left: 0, up: 0 });
      }
    } else if ("place" in action.to && context.place(action.to.place).seat) {
      const place: IStageSet.IPlace = context.place(action.to.place);
      // Stand with the calves at the seat's front edge, back to the seat.
      position = BodyFrame.toWorld(place.point, place.seat!.facing, { forward: 0.25, left: 0, up: 0 });
    } else position = context.point(action.to);
    position = { x: position.x, y: 0, z: position.z };
    const travel: number = BodyFrame.headingTo(from.position, position);
    let heading: number = Math.hypot(position.x - from.position.x, position.z - from.position.z) > Gait.STILL ? travel : from.heading;
    if (action.facing !== undefined) heading = BodyFrame.headingTo(position, context.point(action.facing));
    else if ("subject" in action.to && context.world.students.has(action.to.subject)) heading = BodyFrame.headingTo(position, context.body(action.to.subject, at).position);
    else if ("place" in action.to) {
      const place: IStageSet.IPlace = context.place(action.to.place);
      if (place.seat) heading = place.seat.facing;
      else if (place.facing !== undefined) heading = place.facing;
    }
    return { position, heading };
  }
}
