import {
  type IAutoMovieSchedule,
  resolveAutoMovieFraming,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { CoverageLaw } from "../../laws/cinematography/CoverageLaw";
import { BoutLaws } from "../kickboxing/BoutLaws";
import type { IRingCast } from "../kickboxing/IRingCast";
import { RefereeTrack } from "../officiating/RefereeTrack";

/**
 * The camera's path through the film, resolved once at a fixed step: the
 * size follows the action (wide in resets, medium in exchanges, close on a
 * landed blow's receiver), each size holding at least the law's minimum; the
 * bearing orbits toward side-on, opposite the referee, at no more than the
 * law's rate; the framing comes from the subjects' bounding spheres by the
 * engine; the operator follows with lag; the lens stays inside the ropes.
 * From the screenplay's finish decision the camera widens to hold A, B and
 * the referee from its bearing then.
 *
 * ```ts
 * const track = CameraTrack.resolve(cast, schedule, referee, 180);
 * CameraTrack.at(track, 72.5); // { position, target, size }
 * ```
 *
 * @evidence docs/research/cinematography/fight-coverage.md#law The coverage law.
 * @evidence docs/body/settings/cinematography/ring-coverage.md#finish The finish view held to the end.
 */
export namespace CameraTrack {
  /** Resolution step, seconds: one frame of the film. */
  export const STEP: number = 1 / 30;

  /** Clearance of the lens inside the rope line, metres: a camera operator's body depth (film choice). */
  const LENS_MARGIN: number = 0.3;

  /** One resolved instant. */
  export interface ISample {
    /** Lens position, world metres. */
    position: IAutoMovieVector3;

    /** Look-at target, world metres. */
    target: IAutoMovieVector3;

    /** The size held. */
    size: CoverageLaw.Size;
  }

  /**
   * Resolve the path.
   *
   * @param cast The cast.
   * @param schedule The schedule.
   * @param referee The referee's resolved path.
   * @param duration Film seconds.
   * @returns Samples at every step.
   */
  export function resolve(cast: IRingCast, schedule: IAutoMovieSchedule, referee: RefereeTrack.ITrack, duration: number): ISample[] {
    const finish: number = schedule.entries.find((e) => e.intent.capability === "frame")?.start ?? Infinity;
    const landed: { contact: number; receiver: string }[] = schedule.entries
      .filter((e) => e.outcome === "landed")
      .map((e) => ({ contact: e.contact!, receiver: e.subject }));
    const exchanges: { start: number; end: number }[] = schedule.entries
      .filter((e) => e.intent.capability === "strike" || e.intent.capability === "answer")
      .map((e) => ({ start: e.start, end: e.end }));
    const height = (measure: { hip: number; shoulder: number; head: number }): { body: number; upper: number; bodyRadius: number; upperRadius: number } => ({
      body: measure.head / 2,
      upper: (measure.shoulder + measure.head) / 2,
      bodyRadius: measure.head / 2 + measure.head * 0.1,
      upperRadius: (measure.head - measure.hip) / 2,
    });
    const ha = height(cast.a.body.measure);
    const hb = height(cast.b.body.measure);
    const hr = height(cast.referee.body.measure);
    const samples: ISample[] = [];
    let size: CoverageLaw.Size = "wide";
    let since: number = 0;
    let bearing: number | undefined;
    let position: IAutoMovieVector3 | undefined;
    let target: IAutoMovieVector3 | undefined;
    for (let k: number = 0; k * STEP <= duration + 1e-9; k++) {
      const t: number = k * STEP;
      const a = BoutLaws.origin(schedule, cast.a.id, t, cast).point;
      const b = BoutLaws.origin(schedule, cast.b.id, t, cast).point;
      const r = RefereeTrack.at(referee, t).point;
      // The size the action asks for; it changes only after the hold.
      const hit = landed.find((l) => t >= l.contact && t < l.contact + CoverageLaw.HOLD);
      const wanted: CoverageLaw.Size =
        t >= finish ? "finish" : hit ? "close" : exchanges.some((x) => t >= x.start && t < x.end) ? "medium" : "wide";
      if (wanted !== size && (t - since >= CoverageLaw.HOLD || wanted === "finish")) {
        size = wanted;
        since = t;
      }
      const spheres: Record<string, { center: IAutoMovieVector3; radius: number }> = {
        a: { center: { x: a.x, y: ha.body, z: a.z }, radius: ha.bodyRadius },
        b: { center: { x: b.x, y: hb.body, z: b.z }, radius: hb.bodyRadius },
        referee: { center: { x: r.x, y: hr.body, z: r.z }, radius: hr.bodyRadius },
        "a-upper": { center: { x: a.x, y: ha.upper, z: a.z }, radius: ha.upperRadius },
        "b-upper": { center: { x: b.x, y: hb.upper, z: b.z }, radius: hb.upperRadius },
      };
      const subjects: string[] =
        size === "wide" || size === "finish"
          ? ["a", "b", "referee"]
          : size === "close"
            ? [hit?.receiver === cast.b.id ? "b-upper" : "a-upper", hit?.receiver === cast.b.id ? "a-upper" : "b-upper"]
            : ["a-upper", "b-upper"];
      const side: number = CoverageLaw.bearing(a, b, r);
      bearing = bearing === undefined ? side : size === "finish" && t > finish ? bearing : CoverageLaw.orbit(bearing, side, STEP);
      const frame = resolveAutoMovieFraming(CoverageLaw.goal(size, subjects, bearing), spheres);
      const limit: number = cast.ring.half - LENS_MARGIN;
      const wantedPosition: IAutoMovieVector3 = {
        x: Math.max(-limit, Math.min(limit, frame.position.x)),
        y: frame.position.y,
        z: Math.max(-limit, Math.min(limit, frame.position.z)),
      };
      const follow: number = k === 0 ? 1 : CoverageLaw.follow(STEP);
      position = position === undefined ? wantedPosition : lerp(position, wantedPosition, follow);
      target = target === undefined ? frame.target : lerp(target, frame.target, follow);
      samples.push({ position, target, size });
    }
    return samples;
  }

  /**
   * The camera at a second.
   *
   * @param samples The resolved path.
   * @param seconds Film seconds.
   * @returns The interpolated sample.
   */
  export function at(samples: readonly ISample[], seconds: number): ISample {
    const f: number = Math.max(0, Math.min(samples.length - 1, seconds / STEP));
    const i: number = Math.floor(f);
    const j: number = Math.min(samples.length - 1, i + 1);
    const w: number = f - i;
    return { position: lerp(samples[i]!.position, samples[j]!.position, w), target: lerp(samples[i]!.target, samples[j]!.target, w), size: samples[i]!.size };
  }

  function lerp(a: IAutoMovieVector3, b: IAutoMovieVector3, w: number): IAutoMovieVector3 {
    return { x: a.x + (b.x - a.x) * w, y: a.y + (b.y - a.y) * w, z: a.z + (b.z - a.z) * w };
  }
}


