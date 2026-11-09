import type { IAutoMovieSchedule } from "@automovie/engine";

import { KickboxingAction } from "../../laws/kickboxing/KickboxingAction";
import { KickboxingTechnique } from "../../laws/kickboxing/KickboxingTechnique";
import { KnockdownShape } from "../../laws/kickboxing/KnockdownShape";
import { RingFootwork } from "../../laws/kickboxing/RingFootwork";
import { StanceShape } from "../../laws/kickboxing/StanceShape";
import { OfficiatingAction } from "../../laws/officiating/OfficiatingAction";
import { RefereePosition } from "../../laws/officiating/RefereePosition";
import { BoutLaws } from "../kickboxing/BoutLaws";
import type { IRingCast } from "../kickboxing/IRingCast";

/**
 * The referee's path through the whole film, resolved once from the
 * schedule at a fixed step: while the fighters work he walks toward his
 * positioning law's point for where they were half a second earlier, closing
 * in on the ropes and in clinches; from the knockdown he walks around the
 * lying body, never closer than a step, to the point a step beyond it from
 * the standing fighter, and faces the fallen man with the other ahead of
 * him. Every second reads the resolved path, so playback, seeking and
 * capture agree.
 *
 * ```ts
 * const track = RefereeTrack.resolve(cast, schedule, 180);
 * RefereeTrack.at(track, 12.4); // { point, look }
 * ```
 *
 * @evidence docs/research/officiating/referee.md#positioning The positioning law, walking speed and follow.
 * @evidence docs/research/officiating/referee.md#knockdown A step clear of the fallen fighter, the standing fighter and the corner in view.
 * @evidence docs/body/settings/cast/referee.md#closing He closes in on the ropes and in clinches.
 */
export namespace RefereeTrack {
  /** Resolution step, seconds: one frame of the 30 fps film. */
  export const STEP: number = 1 / 30;

  /** A resolved path. */
  export interface ITrack {
    /** Positions at every step from zero. */
    points: readonly RingFootwork.IPoint[];

    /** Points he looks toward at every step. */
    looks: readonly RingFootwork.IPoint[];
  }

  /**
   * Resolve the path.
   *
   * @param cast The cast.
   * @param schedule The schedule.
   * @param duration Film seconds to resolve.
   * @returns The path.
   */
  export function resolve(
    cast: IRingCast,
    schedule: IAutoMovieSchedule,
    duration: number,
  ): ITrack {
    const measure = cast.referee.body.measure;
    const ring: RingFootwork.IRing = {
      half: cast.ring.half,
      margin: StanceShape.margin(measure),
      step: StanceShape.step(measure),
    };
    const fall: number = fallStart(schedule);
    const origin = (id: string, s: number): RingFootwork.IPoint =>
      BoutLaws.origin(schedule, id, Math.max(0, s), cast).point;
    const body: KnockdownShape.IFootprint = footprint(cast, schedule, fall);
    const clear: number = clearance(cast);
    let side: 1 | -1 = 1;
    const start = RefereePosition.goal({
      a: origin(cast.a.id, 0),
      b: origin(cast.b.id, 0),
      side,
      close: false,
      ring,
      reach: measure.armReach,
    });
    let current: RingFootwork.IPoint = start.point;
    const points: RingFootwork.IPoint[] = [];
    const looks: RingFootwork.IPoint[] = [];
    for (let k: number = 0; k * STEP <= duration + 1e-9; k++) {
      const t: number = k * STEP;
      const a: RingFootwork.IPoint = origin(cast.a.id, t - RefereePosition.LAG);
      const b: RingFootwork.IPoint = origin(cast.b.id, t - RefereePosition.LAG);
      let target: RingFootwork.IPoint;
      let look: RingFootwork.IPoint;
      const up: string | undefined = winner(cast, schedule);
      if (
        up !== undefined &&
        OfficiatingAction.active(schedule, t, "knockout") !== undefined
      ) {
        // Waving it off, he steps between the standing fighter and the
        // fallen man, a step clear of the body, facing the standing fighter
        // to keep him off.
        const standing: RingFootwork.IPoint = origin(up, t);
        const middle: RingFootwork.IPoint = centre(body);
        target = RefereePosition.clear(
          {
            x: (standing.x + middle.x) / 2,
            z: (standing.z + middle.z) / 2,
          },
          body,
          clear,
        );
        look = standing;
      } else if (
        up !== undefined &&
        OfficiatingAction.active(schedule, t, "winner") !== undefined
      ) {
        // He goes to the winner and stands beside him to raise his arm.
        target = beside(cast, schedule, t)!;
        look = origin(up, t);
      } else if (t >= fall) {
        // A step clear of the lying body, beyond it from the standing
        // fighter, facing the fallen man with the other ahead of him.
        target = attendPoint(cast, schedule, t)!;
        look = {
          x: (body.from.x + body.to.x) / 2,
          z: (body.from.z + body.to.z) / 2,
        };
      } else {
        const close: boolean =
          RingFootwork.onRopes(a, ring) ||
          RingFootwork.onRopes(b, ring) ||
          clinch(schedule, t);
        const goal = RefereePosition.goal({
          a,
          b,
          side,
          close,
          ring,
          reach: measure.armReach,
        });
        side = goal.side;
        target = goal.point;
        look = { x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 };
      }
      current =
        t >= fall
          ? RefereePosition.clear(
              RefereePosition.walk(current, target, STEP),
              body,
              clear,
            )
          : RefereePosition.walk(
              current,
              around(current, target, a, b, ring.step + measure.armReach),
              k === 0 ? 0 : STEP,
            );
      points.push(current);
      looks.push(look);
    }
    return { points, looks };
  }

  /**
   * The referee's position and look point at a second.
   *
   * @param track The resolved path.
   * @param seconds Film seconds.
   * @returns Interpolated position and look point.
   */
  export function at(
    track: ITrack,
    seconds: number,
  ): { point: RingFootwork.IPoint; look: RingFootwork.IPoint } {
    const f: number = Math.max(
      0,
      Math.min(track.points.length - 1, seconds / STEP),
    );
    const i: number = Math.floor(f);
    const j: number = Math.min(track.points.length - 1, i + 1);
    const w: number = f - i;
    const lerp = (
      p: RingFootwork.IPoint,
      q: RingFootwork.IPoint,
    ): RingFootwork.IPoint => ({
      x: p.x + (q.x - p.x) * w,
      z: p.z + (q.z - p.z) * w,
    });
    return {
      point: lerp(track.points[i]!, track.points[j]!),
      look: lerp(track.looks[i]!, track.looks[j]!),
    };
  }

  /**
   * The floor the fallen fighter's lying body covers, from his origin and
   * facing when he falls (toward his opponent then).
   *
   * @param cast The cast.
   * @param schedule The schedule.
   * @param fall The fall's start.
   * @returns The footprint; a point at B's origin when nobody falls.
   */
  export function footprint(
    cast: IRingCast,
    schedule: IAutoMovieSchedule,
    fall: number,
  ): KnockdownShape.IFootprint {
    const at: number = Number.isFinite(fall) ? fall : 0;
    const down = fallEntry(schedule)?.subject === cast.a.id ? cast.a : cast.b;
    const up = down === cast.a ? cast.b : cast.a;
    const fallen = BoutLaws.origin(schedule, down.id, at, cast).point;
    const opponent = BoutLaws.origin(schedule, up.id, at, cast).point;
    return KnockdownShape.footprint(
      down.body.measure,
      fallen,
      unit({ x: opponent.x - fallen.x, z: opponent.z - fallen.z }),
    );
  }

  /** The start of the knockdown fall, or infinity. */
  export function fallStart(schedule: IAutoMovieSchedule): number {
    return fallEntry(schedule)?.start ?? Infinity;
  }

  /**
   * The next point toward a target on the other side of the fighters' line:
   * past the end of their segment nearer to him, a step and an arm's reach
   * beyond the fighter there, so he goes around and never between them.
   */
  function around(
    current: RingFootwork.IPoint,
    target: RingFootwork.IPoint,
    a: RingFootwork.IPoint,
    b: RingFootwork.IPoint,
    clearance: number,
  ): RingFootwork.IPoint {
    const ux: number = b.x - a.x;
    const uz: number = b.z - a.z;
    const side = (p: RingFootwork.IPoint): number =>
      Math.sign(ux * (p.z - a.z) - uz * (p.x - a.x));
    if (side(current) === side(target) || side(current) === 0) return target;
    const length: number = Math.hypot(ux, uz) || 1;
    const end: RingFootwork.IPoint =
      Math.hypot(current.x - a.x, current.z - a.z) <=
      Math.hypot(current.x - b.x, current.z - b.z)
        ? a
        : b;
    const outward: number = end === a ? -1 : 1;
    return {
      x: end.x + (outward * ux * clearance) / length,
      z: end.z + (outward * uz * clearance) / length,
    };
  }

  /**
   * The fighter left standing after a knockdown: the one who did not fall.
   *
   * @param cast The cast.
   * @param schedule The schedule.
   * @returns His id, or undefined while nobody has fallen.
   */
  export function winner(
    cast: IRingCast,
    schedule: IAutoMovieSchedule,
  ): string | undefined {
    const fall = fallEntry(schedule);
    if (fall === undefined) return undefined;
    return fall.subject === cast.a.id ? cast.b.id : cast.a.id;
  }

  /**
   * Where the referee attends the fallen man at a second: a step clear of
   * the lying body, beyond it from the standing fighter as he stood half a
   * second earlier.
   *
   * @param cast The cast.
   * @param schedule The schedule.
   * @param seconds Film seconds.
   * @returns The point, or undefined while nobody has fallen.
   */
  export function attendPoint(
    cast: IRingCast,
    schedule: IAutoMovieSchedule,
    seconds: number,
  ): RingFootwork.IPoint | undefined {
    const up: string | undefined = winner(cast, schedule);
    if (up === undefined) return undefined;
    const body = footprint(cast, schedule, fallStart(schedule));
    const standing = BoutLaws.origin(
      schedule,
      up,
      Math.max(0, seconds - RefereePosition.LAG),
      cast,
    ).point;
    return RefereePosition.attend(body, standing, clearance(cast));
  }

  /**
   * Where the referee stands to raise the winner's arm at a second: beside
   * the winner toward the fallen man, the referee's shoulder half-width
   * and half his arm's reach off the winner's origin, kept a step clear of
   * the lying body.
   *
   * @param cast The cast.
   * @param schedule The schedule.
   * @param seconds Film seconds.
   * @returns The point, or undefined while nobody has fallen.
   */
  export function beside(
    cast: IRingCast,
    schedule: IAutoMovieSchedule,
    seconds: number,
  ): RingFootwork.IPoint | undefined {
    const up: string | undefined = winner(cast, schedule);
    if (up === undefined) return undefined;
    const measure = cast.referee.body.measure;
    const body = footprint(cast, schedule, fallStart(schedule));
    const standing = BoutLaws.origin(schedule, up, seconds, cast).point;
    const middle: RingFootwork.IPoint = centre(body);
    const u: RingFootwork.IPoint = unit({
      x: middle.x - standing.x,
      z: middle.z - standing.z,
    });
    const off: number = measure.shoulderHalfWidth + measure.armReach / 2;
    return RefereePosition.clear(
      { x: standing.x + u.x * off, z: standing.z + u.z * off },
      body,
      clearance(cast),
    );
  }

  /**
   * Progress of the winner's raise at a second: negative while the referee
   * still walks from the fallen man to the winner at his brisk pace, then
   * from 0 at his arrival to 1 at the signal's end.
   *
   * @param cast The cast.
   * @param schedule The schedule.
   * @param seconds Film seconds.
   * @returns The progress, or null outside a winner signal.
   * @throws When the referee's walk outlasts the signal, so the raise would never show.
   */
  export function raising(
    cast: IRingCast,
    schedule: IAutoMovieSchedule,
    seconds: number,
  ): number | null {
    const entry = OfficiatingAction.active(schedule, seconds, "winner");
    if (entry === undefined) return null;
    const arrival: number | undefined = arrived(cast, schedule, entry);
    if (arrival === undefined) return null;
    if (arrival >= entry.end)
      throw new Error(
        `The winner signal from ${entry.start} s needs more than ${(arrival - entry.start).toFixed(2)} s: the referee's walk to the winner outlasts it`,
      );
    return (seconds - arrival) / (entry.end - arrival);
  }

  /**
   * Seconds since the referee arrived beside the winner and began the raise.
   *
   * @param cast The cast.
   * @param schedule The schedule.
   * @param seconds Film seconds.
   * @returns Seconds since the raise began, negative before it, or null outside a winner signal.
   */
  export function raisedFor(
    cast: IRingCast,
    schedule: IAutoMovieSchedule,
    seconds: number,
  ): number | null {
    const entry = OfficiatingAction.active(schedule, seconds, "winner");
    if (entry === undefined) return null;
    const arrival: number | undefined = arrived(cast, schedule, entry);
    return arrival === undefined ? null : seconds - arrival;
  }

  /** When the referee, walking at his brisk pace from the fallen man, arrives beside the winner during a winner signal. */
  function arrived(
    cast: IRingCast,
    schedule: IAutoMovieSchedule,
    entry: IAutoMovieSchedule.IEntry,
  ): number | undefined {
    const from = attendPoint(cast, schedule, entry.start);
    const to = beside(cast, schedule, entry.start);
    if (from === undefined || to === undefined) return undefined;
    return (
      entry.start +
      Math.hypot(to.x - from.x, to.z - from.z) / RefereePosition.BRISK
    );
  }

  /** The referee's feet, not only his origin, keep a step clear of a lying body: a step beyond his own stance half-width and half a foot. */
  function clearance(cast: IRingCast): number {
    const measure = cast.referee.body.measure;
    return StanceShape.step(measure) + measure.hipHalfWidth + measure.foot / 2;
  }

  /** The centre of a lying body's floor capsule. */
  function centre(body: KnockdownShape.IFootprint): RingFootwork.IPoint {
    return {
      x: (body.from.x + body.to.x) / 2,
      z: (body.from.z + body.to.z) / 2,
    };
  }

  /** The knockdown fall's entry, if any. */
  function fallEntry(
    schedule: IAutoMovieSchedule,
  ): IAutoMovieSchedule.IEntry | undefined {
    return schedule.entries.find((e) => {
      if (e.intent.capability !== "phase") return false;
      const action = KickboxingAction.read(e.intent);
      return action.kind === "phase" && action.phase === "fall";
    });
  }

  function clinch(schedule: IAutoMovieSchedule, t: number): boolean {
    return schedule.entries.some((e) => {
      if (e.intent.capability !== "strike" || e.start > t || e.end < t)
        return false;
      const action = KickboxingAction.read(e.intent);
      return (
        action.kind === "strike" &&
        KickboxingTechnique.table[action.technique].family === "knee"
      );
    });
  }

  function unit(v: RingFootwork.IPoint): RingFootwork.IPoint {
    const l: number = Math.hypot(v.x, v.z);
    return l === 0 ? { x: 1, z: 0 } : { x: v.x / l, z: v.z / l };
  }
}
