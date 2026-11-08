import {
  type IAutoMovieSchedule,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { CoverageLaw } from "../../laws/cinematography/CoverageLaw";
import { KickboxingAction } from "../../laws/kickboxing/KickboxingAction";
import { KickboxingRange } from "../../laws/kickboxing/KickboxingRange";
import { KickboxingTechnique } from "../../laws/kickboxing/KickboxingTechnique";
import { CameraTrack } from "../cinematography/CameraTrack";
import type { BoutPerformance } from "./BoutPerformance";
import type { IRingCast } from "./IRingCast";
import { PictureTargets } from "./PictureTargets";

/**
 * The research's targets measured where the viewer meets them: on the
 * displayed bodies and the delivered lens at instants sampled across the
 * whole film. The schedule only labels each instant's phase; every number
 * comes from the displayed feet, knees, hands and the camera.
 *
 * ```ts
 * const samples = times.map((t) => ({ seconds: t, phase: PictureMeasures.phase(schedule, t, finish), bodies, lens }));
 * PictureMeasures.measure(samples, { close: 0.6, fieldOfView, aspect });
 * ```
 *
 * @evidence docs/research/kickboxing/ring-generalship.md#targets Distance by phase, close range, footwork travel and lateral share, idle share.
 * @evidence docs/research/kickboxing/ring-generalship.md#stance Stance knee flexion on the displayed legs.
 * @evidence docs/research/kickboxing/techniques.md#punch-timing Peak fist and foot speeds measured on the displayed limbs.
 * @evidence docs/research/cinematography/fight-coverage.md#targets Both fighters' feet in the delivered frame.
 */
export namespace PictureMeasures {
  /** The phase of the bout at an instant, from the schedule. */
  export type Phase =
    | "outside"
    | "entry"
    | "exchange"
    | "press"
    | "clinch"
    | "finish"
    | "down";

  /** Phases in which close range belongs to the action. */
  export const CLOSE_PHASES: readonly Phase[] = ["press", "clinch", "finish"];

  /** A hand or foot slower than this is still, metres per second: a guard's sway stays under a tenth of a metre per second (film reading of "idle"). */
  export const IDLE_SPEED: number = 0.1;

  /** One leg's joints on the displayed body, world metres. */
  export interface ILeg {
    /** Hip joint. */
    hip: IAutoMovieVector3;

    /** Knee joint. */
    knee: IAutoMovieVector3;

    /** Ankle joint. */
    ankle: IAutoMovieVector3;
  }

  /** A displayed fighter at one instant. */
  export interface IBody {
    /** Each leg. */
    legs: Record<"left" | "right", ILeg>;

    /** Each wrist. */
    hands: Record<"left" | "right", IAutoMovieVector3>;
  }

  /** One sampled instant. */
  export interface ISample {
    /** Film seconds. */
    seconds: number;

    /** The bout's phase then. */
    phase: Phase;

    /** Both fighters' displayed bodies. */
    bodies: [IBody, IBody];

    /** The delivered lens. */
    lens: { position: IAutoMovieVector3; target: IAutoMovieVector3 };
  }

  /** The measuring limits. */
  export interface ILimits {
    /** Stance-origin distance under which the pair is at close range, metres. */
    close: number;

    /** Vertical field of view, radians. */
    fieldOfView: number;

    /** Frame width over height. */
    aspect: number;
  }

  /**
   * The phase at an instant: down once a fighter falls; the finish from the
   * finishing strike's launch; then a clinch knee, a strike or answer, a
   * strike's entry, a press, or outside range.
   *
   * @param schedule The schedule.
   * @param seconds Film seconds.
   * @param finish The finishing strike's launch and the fall's start.
   * @returns The phase.
   */
  export function phase(
    schedule: IAutoMovieSchedule,
    seconds: number,
    finish: { start: number; fall: number },
  ): Phase {
    if (seconds >= finish.fall) return "down";
    if (seconds >= finish.start) return "finish";
    let found: Phase = "outside";
    const rank: Record<Phase, number> = {
      outside: 0,
      press: 1,
      entry: 2,
      exchange: 3,
      clinch: 4,
      finish: 5,
      down: 6,
    };
    for (const entry of schedule.entries) {
      if (entry.start > seconds || seconds >= entry.end) continue;
      const capability: string = entry.intent.capability;
      if (
        capability !== "strike" &&
        capability !== "answer" &&
        capability !== "move"
      )
        continue;
      const action = KickboxingAction.read(entry.intent);
      const here: Phase =
        action.kind === "strike"
          ? KickboxingTechnique.table[action.technique].family === "knee"
            ? "clinch"
            : "exchange"
          : action.kind === "answer"
            ? "exchange"
            : action.kind === "move" && entry.intent.anchor?.endsWith("/entry")
              ? "entry"
              : action.kind === "move" && action.movement === "press"
                ? "press"
                : "outside";
      if (rank[here] > rank[found]) found = here;
    }
    return found;
  }

  /**
   * The measures over the sampled instants.
   *
   * @param samples Instants in time order at a fixed step.
   * @param limits The measuring limits.
   * @returns Named measures: distances in metres, shares in [0, 1], knee flexion in degrees, foot travel in metres per fighter-minute.
   */
  export function measure(
    samples: readonly ISample[],
    limits: ILimits,
  ): Record<string, number> {
    const result: Record<string, number> = {};
    const standing: ISample[] = samples.filter((s) => s.phase !== "down");
    // Stance-origin distance by phase.
    const sums: Map<Phase, [number, number]> = new Map();
    let open: number = 0;
    let close: number = 0;
    for (const s of standing) {
      const d: number = distance(s);
      const [sum, n] = sums.get(s.phase) ?? [0, 0];
      sums.set(s.phase, [sum + d, n + 1]);
      if (CLOSE_PHASES.includes(s.phase)) continue;
      open++;
      if (d < limits.close) close++;
    }
    for (const [p, [sum, n]] of sums) result[`distance-${p}`] = sum / n;
    result["close-share"] = open === 0 ? 0 : close / open;
    // Stance knee flexion at outside range.
    const knees: number[] = standing
      .filter((s) => s.phase === "outside")
      .flatMap((s) =>
        s.bodies.flatMap((b) => [flexion(b.legs.left), flexion(b.legs.right)]),
      );
    if (knees.length > 0) result["knee-flexion"] = mean(knees);
    // Foot travel, its lateral share and idleness between consecutive standing instants.
    let travel: number = 0;
    let lateral: number = 0;
    let idle: number = 0;
    let pairs: number = 0;
    let seconds: number = 0;
    for (let k: number = 1; k < samples.length; k++) {
      const p: ISample = samples[k - 1]!;
      const q: ISample = samples[k]!;
      if (p.phase === "down" || q.phase === "down") continue;
      const dt: number = q.seconds - p.seconds;
      const line: { x: number; z: number } = unit(
        sub(origin(q.bodies[1]), origin(q.bodies[0])),
      );
      seconds += dt;
      for (const f of [0, 1] as const) {
        let fastest: number = 0;
        for (const side of ["left", "right"] as const) {
          const a: IAutoMovieVector3 = p.bodies[f].legs[side].ankle;
          const b: IAutoMovieVector3 = q.bodies[f].legs[side].ankle;
          const dx: number = b.x - a.x;
          const dz: number = b.z - a.z;
          const step: number = Math.hypot(dx, dz);
          travel += step;
          lateral += Math.abs(-dx * line.z + dz * line.x);
          fastest = Math.max(
            fastest,
            Math.hypot(dx, b.y - a.y, dz) / dt,
            speed(p.bodies[f].hands[side], q.bodies[f].hands[side], dt),
          );
        }
        pairs++;
        if (fastest < IDLE_SPEED) idle++;
      }
    }
    if (seconds > 0) {
      result["foot-travel-per-minute"] = (travel / 2 / seconds) * 60;
      result["foot-lateral-share"] = travel === 0 ? 0 : lateral / travel;
      result["idle-share"] = idle / pairs;
    }
    // Both fighters' feet inside the delivered frame.
    result["feet-in-frame"] =
      samples.filter((s) =>
        s.bodies.every((b) =>
          (["left", "right"] as const).every((side) =>
            inside(s.lens, b.legs[side].ankle, limits),
          ),
        ),
      ).length / Math.max(1, samples.length);
    return result;
  }

  /** Instants sampled per film second for the whole-film measures: a tenth of a second resolves every 0.35 s step. */
  export const SAMPLE_RATE: number = 10;

  /** Instants sampled per second along a strike for its peak speed: the 100 Hz motion capture of the measured kick study (ISBS 2012). */
  export const SPEED_RATE: number = 100;

  /** What the whole-film measure reads from the displayed film. */
  export interface IFilm {
    /** The schedule. */
    schedule: IAutoMovieSchedule;

    /** Running time, seconds. */
    duration: number;

    /** The finishing strike's launch and the fall's start. */
    finish: { start: number; fall: number };

    /** The measuring limits. */
    limits: ILimits;

    /** Both displayed fighters, in cast order, and the delivered lens at an instant. */
    read(seconds: number): Pick<ISample, "bodies" | "lens">;

    /** The displayed striking point of a fighter's technique at an instant: the glove's knuckles for a punch, the midfoot for a kick. */
    striking(
      subject: string,
      spec: KickboxingTechnique.ISpec,
      seconds: number,
    ): IAutoMovieVector3;
  }

  /**
   * The picture measures over the whole film: {@link measure} at
   * {@link SAMPLE_RATE}, plus the median peak speed of the evaluated limb
   * over every punch and every round kick from launch to contact at
   * {@link SPEED_RATE}: the fist's end point, the glove's knuckles, for a
   * punch; the midfoot for a round kick, where the measured kicks carry
   * their metatarsal markers.
   *
   * @param film The displayed film.
   * @returns Named measures.
   */
  export function film(film: IFilm): Record<string, number> {
    const samples: ISample[] = [];
    const count: number = Math.floor(film.duration * SAMPLE_RATE);
    for (let k: number = 0; k <= count; k++) {
      const seconds: number = k / SAMPLE_RATE;
      samples.push({
        seconds,
        phase: phase(film.schedule, seconds, film.finish),
        ...film.read(seconds),
      });
    }
    const result: Record<string, number> = measure(samples, film.limits);
    const peaks: Record<"punch" | "kick", number[]> = { punch: [], kick: [] };
    for (const entry of film.schedule.entries) {
      if (entry.intent.capability !== "strike" || entry.contact === undefined)
        continue;
      const action = KickboxingAction.read(entry.intent);
      if (action.kind !== "strike") continue;
      const spec: KickboxingTechnique.ISpec =
        KickboxingTechnique.table[action.technique];
      if (spec.shows || (spec.limb !== "arm" && spec.family !== "round-kick"))
        continue;
      const path: { seconds: number; point: IAutoMovieVector3 }[] = [];
      for (
        let t: number = entry.start;
        t <= entry.contact + 1e-9;
        t += 1 / SPEED_RATE
      )
        path.push({ seconds: t, point: film.striking(entry.subject, spec, t) });
      peaks[spec.limb === "arm" ? "punch" : "kick"].push(peak(path));
    }
    for (const [kind, list] of Object.entries(peaks))
      if (list.length > 0) result[`${kind}-peak-speed`] = median(list);
    return result;
  }

  /**
   * The picture measures of the mounted film, read from the displayed
   * fighters' segments and the delivered camera track, each ranged measure
   * with its research range beside it ({@link PictureTargets.annotate}).
   *
   * @param cast The cast.
   * @param schedule The schedule.
   * @param performance The displayed bodies.
   * @param camera The delivered camera track.
   * @param duration Running time, seconds.
   * @returns Named measures.
   */
  export function displayed(
    cast: IRingCast,
    schedule: IAutoMovieSchedule,
    performance: BoutPerformance,
    camera: CameraTrack.ISample[],
    duration: number,
  ): Record<string, number> {
    const fall = schedule.entries.find((e) => {
      if (e.intent.capability !== "phase") return false;
      const action = KickboxingAction.read(e.intent);
      return action.kind === "phase" && action.phase === "fall";
    });
    const joint = (
      subject: string,
      bone: string,
      seconds: number,
    ): IAutoMovieVector3 =>
      performance.at(seconds)[subject]!.segments[bone]!.position;
    const leg = (subject: string, side: "left" | "right", seconds: number) => ({
      hip: joint(subject, `${side}UpperLeg`, seconds),
      knee: joint(subject, `${side}LowerLeg`, seconds),
      ankle: joint(subject, `${side}Foot`, seconds),
    });
    const body = (subject: string, seconds: number): IBody => ({
      legs: {
        left: leg(subject, "left", seconds),
        right: leg(subject, "right", seconds),
      },
      hands: {
        left: joint(subject, "leftHand", seconds),
        right: joint(subject, "rightHand", seconds),
      },
    });
    const measured: Record<string, number> = film({
      schedule,
      duration,
      finish: {
        start: CameraTrack.strike(schedule)?.start ?? duration,
        fall: fall?.start ?? duration,
      },
      limits: {
        close: KickboxingRange.clinch(cast.a.body.measure, cast.b.body.measure),
        fieldOfView: CoverageLaw.FIELD_OF_VIEW,
        aspect: CoverageLaw.ASPECT,
      },
      read: (seconds: number) => {
        const shot = CameraTrack.at(camera, seconds);
        return {
          bodies: [body(cast.a.id, seconds), body(cast.b.id, seconds)],
          lens: { position: shot.position, target: shot.target },
        };
      },
      striking: (subject, spec, seconds) => {
        if (spec.limb !== "arm")
          return joint(subject, `${spec.side}Midfoot`, seconds);
        const fighter = subject === cast.a.id ? cast.a : cast.b;
        const fist = fighter.body.weapons[`knuckles-${spec.side}`]!;
        const s = performance.at(seconds)[subject]!.segments[fist.bone]!;
        return Vector3.add(
          s.position,
          Quaternion.rotateVector(s.rotation, fist.localPoint),
        );
      },
    });
    return PictureTargets.annotate(
      measured,
      PictureTargets.of(cast.a.body.measure, cast.b.body.measure),
    );
  }

  /**
   * The peak speed of a point along its sampled path.
   *
   * @param path Instants and the point's world position, in time order.
   * @returns Metres per second.
   */
  export function peak(
    path: readonly { seconds: number; point: IAutoMovieVector3 }[],
  ): number {
    let most: number = 0;
    for (let k: number = 1; k < path.length; k++)
      most = Math.max(
        most,
        speed(
          path[k - 1]!.point,
          path[k]!.point,
          path[k]!.seconds - path[k - 1]!.seconds,
        ),
      );
    return most;
  }

  /**
   * Knee flexion of a displayed leg: the angle between thigh and shank.
   *
   * @param leg The leg's joints.
   * @returns Degrees; 0 for a straight leg.
   */
  export function flexion(leg: ILeg): number {
    const t: IAutoMovieVector3 = Vector3.subtract(leg.knee, leg.hip);
    const s: IAutoMovieVector3 = Vector3.subtract(leg.ankle, leg.knee);
    const c: number =
      Vector3.dot(t, s) / (Vector3.length(t) * Vector3.length(s));
    return (Math.acos(Math.max(-1, Math.min(1, c))) * 180) / Math.PI;
  }

  /**
   * Whether a world point projects inside the delivered frame.
   *
   * @param lens The lens.
   * @param point The point.
   * @param limits The field of view and aspect.
   * @returns True inside the frame.
   */
  export function inside(
    lens: ISample["lens"],
    point: IAutoMovieVector3,
    limits: Pick<ILimits, "fieldOfView" | "aspect">,
  ): boolean {
    const forward: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(lens.target, lens.position),
    );
    const right: IAutoMovieVector3 = Vector3.normalize(
      Vector3.cross(forward, { x: 0, y: 1, z: 0 }),
    );
    const up: IAutoMovieVector3 = Vector3.cross(right, forward);
    const v: IAutoMovieVector3 = Vector3.subtract(point, lens.position);
    const depth: number = Vector3.dot(v, forward);
    if (depth <= 0) return false;
    const tan: number = Math.tan(limits.fieldOfView / 2);
    return (
      Math.abs(Vector3.dot(v, up) / depth) <= tan &&
      Math.abs(Vector3.dot(v, right) / depth) <= tan * limits.aspect
    );
  }

  function distance(s: ISample): number {
    const a = origin(s.bodies[0]);
    const b = origin(s.bodies[1]);
    return Math.hypot(b.x - a.x, b.z - a.z);
  }

  /** The stance origin of a displayed body: the floor midpoint of its ankles. */
  function origin(b: IBody): { x: number; z: number } {
    return {
      x: (b.legs.left.ankle.x + b.legs.right.ankle.x) / 2,
      z: (b.legs.left.ankle.z + b.legs.right.ankle.z) / 2,
    };
  }

  function speed(
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
    dt: number,
  ): number {
    return dt > 0 ? Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z) / dt : 0;
  }

  function median(values: readonly number[]): number {
    const sorted: number[] = [...values].sort((x, y) => x - y);
    const mid: number = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 1
      ? sorted[mid]!
      : (sorted[mid - 1]! + sorted[mid]!) / 2;
  }

  function mean(values: readonly number[]): number {
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  function sub(a: { x: number; z: number }, b: { x: number; z: number }) {
    return { x: a.x - b.x, z: a.z - b.z };
  }

  function unit(a: { x: number; z: number }): { x: number; z: number } {
    const l: number = Math.hypot(a.x, a.z);
    return l === 0 ? { x: 1, z: 0 } : { x: a.x / l, z: a.z / l };
  }
}
