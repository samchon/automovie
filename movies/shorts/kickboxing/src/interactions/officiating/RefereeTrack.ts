import { type IAutoMovieSchedule, resolveAutoMovieZone } from "@automovie/engine";

import { KickboxingAction } from "../../laws/kickboxing/KickboxingAction";
import { KickboxingTechnique } from "../../laws/kickboxing/KickboxingTechnique";
import { RingFootwork } from "../../laws/kickboxing/RingFootwork";
import { StanceShape } from "../../laws/kickboxing/StanceShape";
import { KnockdownCount } from "../../laws/officiating/KnockdownCount";
import { RefereePosition } from "../../laws/officiating/RefereePosition";
import { BoutLaws } from "../kickboxing/BoutLaws";
import type { IRingCast } from "../kickboxing/IRingCast";

/**
 * The referee's path through the whole film, resolved once from the
 * schedule at a fixed step: while the fighters work he walks toward his
 * positioning law's point for where they were half a second earlier, closing
 * in on the ropes and in clinches; from the knockdown he walks to a point
 * beside the fallen fighter that keeps the far neutral corner in view. Every
 * second reads the resolved path, so playback, seeking and capture agree.
 *
 * ```ts
 * const track = RefereeTrack.resolve(cast, schedule, 180);
 * RefereeTrack.at(track, 12.4); // { point, look }
 * ```
 *
 * @evidence docs/research/officiating/referee.md#positioning The positioning law, walking speed and follow.
 * @evidence docs/research/officiating/referee.md#knockdown Beside the fallen fighter, the corner in view.
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
  export function resolve(cast: IRingCast, schedule: IAutoMovieSchedule, duration: number): ITrack {
    const measure = cast.referee.body.measure;
    const ring: RingFootwork.IRing = { half: cast.ring.half, margin: StanceShape.margin(measure), step: StanceShape.step(measure) };
    const fall: number = fallStart(schedule);
    const origin = (id: string, s: number): RingFootwork.IPoint => BoutLaws.origin(schedule, id, Math.max(0, s), cast).point;
    let side: 1 | -1 = 1;
    const start = RefereePosition.goal({ a: origin(cast.a.id, 0), b: origin(cast.b.id, 0), side, close: false, ring, reach: measure.armReach });
    let current: RingFootwork.IPoint = start.point;
    const points: RingFootwork.IPoint[] = [];
    const looks: RingFootwork.IPoint[] = [];
    for (let k: number = 0; k * STEP <= duration + 1e-9; k++) {
      const t: number = k * STEP;
      const a: RingFootwork.IPoint = origin(cast.a.id, t - RefereePosition.LAG);
      const b: RingFootwork.IPoint = origin(cast.b.id, t - RefereePosition.LAG);
      let target: RingFootwork.IPoint;
      let look: RingFootwork.IPoint;
      if (t >= fall) {
        const fallen: RingFootwork.IPoint = origin(cast.b.id, fall);
        const corner: RingFootwork.IPoint = KnockdownCount.corner(corners(cast), fallen);
        const toward: RingFootwork.IPoint = unit({ x: corner.x - fallen.x, z: corner.z - fallen.z });
        // Beside the fallen fighter, a step and an arm's reach off him on the
        // corner side, so both stay in view.
        const away: number = ring.step + measure.armReach;
        target = { x: fallen.x + toward.z * away + toward.x * away * 0.5, z: fallen.z - toward.x * away + toward.z * away * 0.5 };
        look = fallen;
      } else {
        const close: boolean = RingFootwork.onRopes(a, ring) || RingFootwork.onRopes(b, ring) || clinch(schedule, t);
        const goal = RefereePosition.goal({ a, b, side, close, ring, reach: measure.armReach });
        side = goal.side;
        target = goal.point;
        look = { x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 };
      }
      current = RefereePosition.walk(current, target, k === 0 ? 0 : STEP);
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
  export function at(track: ITrack, seconds: number): { point: RingFootwork.IPoint; look: RingFootwork.IPoint } {
    const f: number = Math.max(0, Math.min(track.points.length - 1, seconds / STEP));
    const i: number = Math.floor(f);
    const j: number = Math.min(track.points.length - 1, i + 1);
    const w: number = f - i;
    const lerp = (p: RingFootwork.IPoint, q: RingFootwork.IPoint): RingFootwork.IPoint => ({ x: p.x + (q.x - p.x) * w, z: p.z + (q.z - p.z) * w });
    return { point: lerp(track.points[i]!, track.points[j]!), look: lerp(track.looks[i]!, track.looks[j]!) };
  }

  /** The start of the knockdown fall, or infinity. */
  export function fallStart(schedule: IAutoMovieSchedule): number {
    const fall = schedule.entries.find((e) => {
      if (e.intent.capability !== "phase") return false;
      const action = KickboxingAction.read(e.intent);
      return action.kind === "phase" && action.phase === "fall";
    });
    return fall ? fall.start : Infinity;
  }

  function clinch(schedule: IAutoMovieSchedule, t: number): boolean {
    return schedule.entries.some((e) => {
      if (e.intent.capability !== "strike" || e.start > t || e.end < t) return false;
      const action = KickboxingAction.read(e.intent);
      return action.kind === "strike" && KickboxingTechnique.table[action.technique].family === "knee";
    });
  }

  function corners(cast: IRingCast): [RingFootwork.IPoint, RingFootwork.IPoint] {
    const p = (name: string): RingFootwork.IPoint => {
      const z = resolveAutoMovieZone(cast.ring.zones, "neutral-corners", name);
      return { x: z.x, z: z.z };
    };
    return [p("north-east"), p("south-west")];
  }

  function unit(v: RingFootwork.IPoint): RingFootwork.IPoint {
    const l: number = Math.hypot(v.x, v.z);
    return l === 0 ? { x: 1, z: 0 } : { x: v.x / l, z: v.z / l };
  }
}
