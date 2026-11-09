import type { IAutoMovieSchedule } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { StageAction } from "../../laws/staging/StageAction";
import type { IStageWorld } from "../staging/IStageWorld";
import { PropTrack } from "../staging/PropTrack";
import type { StagePerformance } from "../staging/StagePerformance";

/**
 * The camera's path over the film, sampled at 24 per second from the shot
 * intents: each shot frames its subjects at its size on the 9:16 frame from
 * a set station or from the side of the action line that keeps the named
 * subject screen left, at its lens height; a cut jumps, a push, pull or arc
 * moves from the previous framing over its seconds; a follow tracks with an
 * operator's 0.5 s lag; alongside rides beside a rider. Distances come from
 * the frame's vertical and horizontal fields of view so a two-person frame
 * holds both bodies.
 *
 * ```ts
 * const camera = CameraTrack.resolve(world, schedule, performance, 60);
 * camera.at(12.5); // { position, target }
 * ```
 *
 * @evidence docs/research/cinematography/vertical-coverage.md#geometry Horizontal field 2·atan(tan(v/2)·9/16); profile or diagonal two-shots.
 * @evidence docs/research/cinematography/vertical-coverage.md#sizes Wide 35–55%, full 55–80%, medium head to hip.
 * @evidence docs/research/cinematography/vertical-coverage.md#movement Follows with lag, never shakes; alongside 4–10 m in flight.
 * @evidence docs/research/cinematography/vertical-coverage.md#eye-height Standing 1.2–1.6 m, seated 0.9–1.2 m.
 * @evidence docs/research/cinematography/vertical-coverage.md#cutting Screen direction held across cuts.
 * @evidence contracts/development/behaviors.md#relational-goals Frames named subjects from their positions at each sample.
 * @evidence contracts/development/behaviors.md#deterministic-evaluation Sampled once after the schedule resolves; `at` interpolates.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the film's samples times the framed subjects.
 * @evidence contracts/development/common.md#meaningful-documentation States the framing rules.
 */
export class CameraTrack {
  /** Samples per second. */
  public static readonly RATE: number = 24;

  /** Vertical field of view, radians (50°). */
  public static readonly FOV: number = (50 * Math.PI) / 180;

  private readonly samples: CameraTrack.ISample[];

  /** Second of each cut, by the index of the first sample after it. */
  private readonly cuts: ReadonlyMap<number, number>;

  private constructor(samples: CameraTrack.ISample[], cuts: ReadonlyMap<number, number>) {
    this.samples = samples;
    this.cuts = cuts;
  }

  /**
   * Sample the camera over a film.
   *
   * @param world The world.
   * @param schedule The schedule.
   * @param performance The students' performance.
   * @param duration Film seconds.
   * @param props The props' track, so a prop can be a shot's subject.
   * @returns The track.
   */
  public static resolve(world: IStageWorld, schedule: IAutoMovieSchedule, performance: StagePerformance, duration: number, props?: PropTrack): CameraTrack {
    const shots: { start: number; shot: StageAction.IShot }[] = schedule.entries
      .filter((e) => e.intent.capability === "shot")
      .map((e) => {
        const a = StageAction.read(e.intent);
        return { start: e.end, shot: (a as Extract<StageAction.Action, { kind: "shot" }>).shot };
      })
      .sort((a, b) => a.start - b.start);
    const n: number = Math.ceil(duration * CameraTrack.RATE) + 1;
    const samples: CameraTrack.ISample[] = [];
    const cuts: Map<number, number> = new Map();
    let current: CameraTrack.ISample | undefined;
    let shotStart: CameraTrack.ISample | undefined;
    let active: number = -1;
    for (let k = 0; k < n; k++) {
      const t: number = k / CameraTrack.RATE;
      let index: number = -1;
      for (let i = 0; i < shots.length; i++) if (shots[i]!.start <= t + 1e-9) index = i;
      const shot: StageAction.IShot | undefined = index >= 0 ? shots[index]!.shot : undefined;
      // The bearing the camera already has: kept by a single-subject push, pull or follow that names no side.
      const kept: number | undefined = current ? Math.atan2(current.position.x - current.target.x, current.position.z - current.target.z) : undefined;
      // A held shot frames everyone over its whole length, so a later arrival is not clipped.
      const end: number = index >= 0 && index + 1 < shots.length ? shots[index + 1]!.start : duration;
      const times: number[] = shot && shot.motion === "hold" && index >= 0 ? [0, 0.25, 0.5, 0.75, 1].map((q) => shots[index]!.start + q * Math.max(0, end - shots[index]!.start - 0.05)) : [t];
      const goal: CameraTrack.ISample = shot ? frame(world, performance, shot, t, times, kept, props) : fallback(world, performance, t);
      if (index !== active) {
        active = index;
        shotStart = current;
        if (!current || !shot || shot.cut || shot.motion === "hold") {
          if (current && index >= 0) cuts.set(k, shots[index]!.start);
          current = goal;
        }
      }
      if (shot && !shot.cut && shotStart && (shot.motion === "push" || shot.motion === "pull" || shot.motion === "arc")) {
        const u: number = Math.min(1, (t - shots[index]!.start) / Math.max(0.1, shot.seconds ?? 1.5));
        const e: number = u * u * (3 - 2 * u);
        current = { position: lerp(shotStart.position, goal.position, e), target: lerp(shotStart.target, goal.target, e) };
      } else if (shot && shot.motion === "hold") {
        // A held shot keeps its first framing.
      } else if (shot && shot.motion === "alongside") current = goal;
      else {
        // Follow with an operator's lag: exponential approach with a 0.5 s time constant.
        const a: number = 1 - Math.exp(-1 / (CameraTrack.RATE * 0.5));
        current = current ? { position: lerp(current.position, goal.position, a), target: lerp(current.target, goal.target, a) } : goal;
      }
      samples.push(clear(current!, shot, performance, t));
    }
    return new CameraTrack(samples, cuts);
  }

  /** The camera at a second. */
  public at(seconds: number): CameraTrack.ISample {
    const x: number = Math.max(0, seconds * CameraTrack.RATE);
    const k: number = Math.min(this.samples.length - 1, Math.floor(x));
    const a: CameraTrack.ISample = this.samples[k]!;
    const b: CameraTrack.ISample = this.samples[Math.min(this.samples.length - 1, k + 1)]!;
    // Across a cut the lens jumps at the cut's second; nothing in between is drawn.
    const cut: number | undefined = this.cuts.get(k + 1);
    if (cut !== undefined) return seconds < cut - 1e-9 ? a : b;
    const u: number = x - k;
    return { position: lerp(a.position, b.position, u), target: lerp(a.target, b.target, u) };
  }
}
export namespace CameraTrack {
  /** A lens placement. */
  export interface ISample {
    /** Lens position, world metres. */
    position: IAutoMovieVector3;

    /** Look-at point, world metres. */
    target: IAutoMovieVector3;
  }
}

/** Fill of the frame height by size. */
const FILL: Record<StageAction.IShot["size"], number> = { wide: 0.45, full: 0.68, medium: 0.78, close: 0.85 };

/** The framing a shot asks for at a second. */
function frame(world: IStageWorld, performance: StagePerformance, shot: StageAction.IShot, t: number, times: number[] = [t], kept?: number, props?: PropTrack): CameraTrack.ISample {
  // A shot of props alone (an insert of a ball in flight) frames the props themselves.
  if (props !== undefined && shot.subjects.length > 0 && shot.subjects.every((id) => world.props.has(id))) return insert(world, performance, props, shot, t, kept);
  // A hanging rider's body reaches about 1.4 m below the seat point the position gives, so its lower extent joins the subjects.
  const points: IAutoMovieVector3[] = times.flatMap((at: number) =>
    shot.subjects.flatMap((id): IAutoMovieVector3[] => {
      const p: IAutoMovieVector3 | undefined = performance.position(id, at) ?? (props !== undefined && world.props.has(id) ? propAt(performance, props, id, at) : undefined) ?? world.set.places[id]?.point;
      if (p === undefined) return [];
      return performance.entry(id, at)?.step.to.support === "hang" ? [p, { x: p.x, y: p.y - 1.4, z: p.z }] : [p];
    }),
  );
  if (points.length === 0) return fallback(world, performance, t);
  const statures: number[] = shot.subjects.map((id) => world.students.get(id)?.measure.stature ?? 1.0);
  const stature: number = Math.max(...statures);
  const airborne: boolean = points.some((p) => p.y > 0.4);
  const centreXZ = { x: points.reduce((s, p) => s + p.x, 0) / points.length, z: points.reduce((s, p) => s + p.z, 0) / points.length };
  const baseY: number = points.reduce((s, p) => s + p.y, 0) / points.length;
  const seated: boolean = shot.height === "seated";
  const bodyHeight: number = airborne ? stature * 0.7 : seated ? stature * 0.72 : stature;
  // Keeping the hands frames the chest-to-hip band where hands handle things, tighter than the head-to-hips medium.
  const hands: boolean = shot.keep === "hands";
  const span: number =
    shot.size === "medium" ? bodyHeight * (hands ? 0.36 : 0.5) : shot.size === "close" ? bodyHeight * (hands ? 0.3 : 0.3) : bodyHeight;
  const centreY: number =
    (airborne ? baseY : 0) +
    (shot.size === "medium"
      ? bodyHeight * (hands ? 0.6 : 0.72)
      : shot.size === "close"
        ? hands
          ? bodyHeight * 0.58
          : bodyHeight * 0.85
        : bodyHeight * 0.5);
  const target: IAutoMovieVector3 = { x: centreXZ.x, y: centreY, z: centreXZ.z };
  let bearing: number = bearingOf(world, shot, target, points, performance, t, kept);
  // Spread of the subjects across the frame: their extent along the lens's right axis plus a body's width.
  const right = { x: Math.cos(bearing), z: -Math.sin(bearing) };
  const across: number[] = points.map((p) => (p.x - centreXZ.x) * right.x + (p.z - centreXZ.z) * right.z);
  const spread: number = Math.max(0.6, Math.max(...across) - Math.min(...across) + 0.7);
  const vertical: number = span / (FILL[shot.size] * Math.tan(CameraTrack.FOV / 2) * 2);
  const hfov: number = 2 * Math.atan(Math.tan(CameraTrack.FOV / 2) * (9 / 16));
  const horizontal: number = spread / (0.85 * 2 * Math.tan(hfov / 2));
  const distance: number = Math.max(vertical, horizontal, shot.motion === "alongside" ? (shot.alongside?.distance ?? 6) : 0.8);
  if (shot.motion === "alongside" && shot.alongside) {
    const rider: string = shot.subjects[0]!;
    // The rider's heading averaged over the last 0.3 s, so a turn onto a new route swings the camera round instead of snapping it.
    const headings: number[] = [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3].map((back) => performance.broom(rider, Math.max(0, t - back))?.heading ?? performance.entry(rider, t)?.step.to.heading ?? 0);
    const heading: number = Math.atan2(headings.reduce((s, h) => s + Math.sin(h), 0), headings.reduce((s, h) => s + Math.cos(h), 0));
    const side: number = shot.alongside.side === "left" ? Math.PI / 2 : -Math.PI / 2;
    const view: number = shot.alongside.view === "front" ? -0.6 : shot.alongside.view === "rear" ? 0.6 : 0;
    bearing = heading + side + Math.sign(side) * view;
    if (shot.alongside.view === "behind") {
      // Straight behind the riders and a little above, looking along their heading so what lies ahead stays in frame.
      const behind: number = shot.alongside.distance;
      const above: number = shot.alongside.above ?? 1.5;
      const ahead = { x: Math.sin(heading), z: Math.cos(heading) };
      return {
        position: { x: target.x - ahead.x * behind, y: baseY + above, z: target.z - ahead.z * behind },
        target: { x: target.x + ahead.x * 30, y: baseY + 0.5, z: target.z + ahead.z * 30 },
      };
    }
  }
  const lens: number = shot.height === "seated" ? 1.05 : shot.height === "low" ? 0.65 : shot.height === "high" ? 3.2 : 1.4;
  const station: IAutoMovieVector3 | undefined = shot.from !== undefined ? world.set.stations[shot.from] : undefined;
  // A wide shot from a station keeps the station's bearing and height and moves in to the distance its subjects need; every shot keeps the lens inside the set's walls.
  // An alongside shot may stand higher than the riders by `above`, which separates two riders flying level side by side.
  const raise: number = shot.motion === "alongside" ? (shot.alongside?.above ?? 0) : 0;
  const heightAt = (far: number): number => (airborne ? centreY + far * 0.12 + raise : Math.max(0.3, station !== undefined && shot.size === "wide" ? station.y : lens));
  const eyeAt = (far: number, b: number = bearing): IAutoMovieVector3 => ({ x: target.x + Math.sin(b) * far, y: heightAt(far), z: target.z + Math.cos(b) * far });
  // The fit above treats every subject as equally far; a near subject takes more of the frame, so move out until each body's sides,
  // and for whole-body sizes its head and feet, sit inside 6% margins of the frame as the lens projects them.
  let far: number = distance;
  for (let k = 0; k < 30 && shot.size !== "close" && !fits(eyeAt(far), target, points, bodyHeight, shot.size === "wide" || shot.size === "full", hfov); k++) far *= 1.06;
  const box = world.set.lens;
  const boxes = box === undefined ? [] : "minX" in box ? [box] : box;
  const within = (x: number, z: number): boolean => boxes.some((b) => x >= b.minX - 1e-9 && x <= b.maxX + 1e-9 && z >= b.minZ - 1e-9 && z <= b.maxZ + 1e-9);
  // A station placed outside the walls (a lens looking in through a window) is the author's choice and is not pulled back in.
  const outside: boolean = station !== undefined && boxes.length > 0 && !within(station.x, station.z);
  // The lens comes back along its line to the target as far as it must to stay in the room the set's bounds make together.
  const inside = (eye: IAutoMovieVector3): IAutoMovieVector3 => {
    if (boxes.length === 0 || outside || !within(target.x, target.z)) return eye;
    const at = (u: number): boolean => within(target.x + (eye.x - target.x) * u, target.z + (eye.z - target.z) * u);
    let lo: number = 0;
    for (let i = 1; i <= 64 && at(i / 64); i++) lo = i / 64;
    let hi: number = Math.min(1, lo + 1 / 64);
    for (let i = 0; i < 12; i++) {
      const mid: number = (lo + hi) / 2;
      if (at(mid)) lo = mid;
      else hi = mid;
    }
    return { x: target.x + (eye.x - target.x) * lo, y: eye.y, z: target.z + (eye.z - target.z) * lo };
  };
  let position: IAutoMovieVector3 = inside(eyeAt(far));
  // When a wall pulls a lone subject's lens in close, swing the bearing (up to half a turn either way) to where the room lets it stand back.
  const back = (eye: IAutoMovieVector3): number => Math.hypot(eye.x - target.x, eye.z - target.z);
  if (station === undefined && shot.subjects.length === 1 && shot.motion !== "alongside" && back(position) < 0.8 * far)
    for (const turn of [20, -20, 40, -40, 60, -60, 90, -90, 120, -120, 150, -150, 180]) {
      const candidate: IAutoMovieVector3 = inside(eyeAt(far, bearing + (turn * Math.PI) / 180));
      if (back(candidate) > back(position) + 0.05) position = candidate;
      if (back(position) >= 0.95 * far) break;
    }

  // The lens never stands inside a person on the ground: when it is within 0.5 m of anyone, swing the bearing the least turn that clears everyone.
  const clearance = (eye: IAutoMovieVector3): number => {
    let nearest: number = Infinity;
    for (const id of world.students.keys()) {
      const p: IAutoMovieVector3 | undefined = performance.position(id, t);
      if (p !== undefined && p.y < 1.0 && eye.y < 2.0) nearest = Math.min(nearest, Math.hypot(eye.x - p.x, eye.z - p.z));
    }
    return nearest;
  };
  if (shot.motion !== "alongside" && clearance(position) < 0.5)
    for (const turn of [15, -15, 30, -30, 45, -45, 60, -60, 90, -90, 120, -120, 150, -150, 180]) {
      const candidate: IAutoMovieVector3 = inside(eyeAt(far, bearing + (turn * Math.PI) / 180));
      if (clearance(candidate) >= 0.5) {
        position = candidate;
        break;
      }
    }
  return { position, target };
}

/**
 * Whether every subject's body projects inside the frame with 6% margins at
 * the sides (and 3% at top and bottom when the whole body is asked for): its
 * sides 0.35 m either way of its point at mid height for a whole body, its
 * shoulders 0.22 m either way at chest height for a medium, its feet and the
 * top of its head.
 */
function fits(eye: IAutoMovieVector3, target: IAutoMovieVector3, points: IAutoMovieVector3[], bodyHeight: number, whole: boolean, hfov: number): boolean {
  const l = { x: target.x - eye.x, y: target.y - eye.y, z: target.z - eye.z };
  const ll: number = Math.hypot(l.x, l.y, l.z);
  if (ll < 1e-6) return false;
  const look = { x: l.x / ll, y: l.y / ll, z: l.z / ll };
  const rl: number = Math.max(1e-6, Math.hypot(look.x, look.z));
  const right = { x: -look.z / rl, y: 0, z: look.x / rl };
  const up = { x: -right.z * look.y, y: right.z * look.x - right.x * look.z, z: right.x * look.y };
  const tanH: number = Math.tan(hfov / 2) * 0.88;
  const tanV: number = Math.tan(CameraTrack.FOV / 2) * 0.94;
  const inside = (c: IAutoMovieVector3, vertical: boolean): boolean => {
    const v = { x: c.x - eye.x, y: c.y - eye.y, z: c.z - eye.z };
    const depth: number = v.x * look.x + v.y * look.y + v.z * look.z;
    if (depth < 0.2) return false;
    if (Math.abs((v.x * right.x + v.z * right.z) / depth) > tanH) return false;
    return !vertical || Math.abs((v.x * up.x + v.y * up.y + v.z * up.z) / depth) <= tanV;
  };
  return points.every((p) => {
    const low: number = p.y > 0.4 ? p.y - 0.5 : p.y;
    const mid: number = whole ? low + bodyHeight / 2 : low + bodyHeight * 0.72;
    const half: number = whole ? 0.35 : 0.22;
    const side = (s: number): IAutoMovieVector3 => ({ x: p.x + right.x * half * s, y: mid, z: p.z + right.z * half * s });
    if (!inside(side(1), false) || !inside(side(-1), false)) return false;
    return !whole || (inside({ x: p.x, y: low, z: p.z }, true) && inside({ x: p.x, y: low + bodyHeight, z: p.z }, true));
  });
}

/** Where a prop is at a second: in its holder's hand, or resting, falling or flying. */
function propAt(performance: StagePerformance, props: PropTrack, id: string, t: number): IAutoMovieVector3 | undefined {
  const segment: PropTrack.ISegment | undefined = props.at(id, t);
  if (segment === undefined) return undefined;
  if (segment.kind === "held") return performance.posture(segment.subject, t)?.hands[segment.hand].point;
  return PropTrack.point(segment, t);
}

/**
 * An insert of props alone: the lens level with them on the kept (or
 * station's) bearing, at the distance their size asks for (a close insert
 * frames 0.25 m, a medium 0.6 m, a full 1.2 m, a wide 3 m), looking at them.
 */
function insert(world: IStageWorld, performance: StagePerformance, props: PropTrack, shot: StageAction.IShot, t: number, kept?: number): CameraTrack.ISample {
  const points: IAutoMovieVector3[] = shot.subjects.map((id) => propAt(performance, props, id, t)).filter((p): p is IAutoMovieVector3 => p !== undefined);
  if (points.length === 0) return fallback(world, performance, t);
  const target: IAutoMovieVector3 = { x: points.reduce((s, p) => s + p.x, 0) / points.length, y: points.reduce((s, p) => s + p.y, 0) / points.length, z: points.reduce((s, p) => s + p.z, 0) / points.length };
  const span: number = shot.size === "close" ? 0.25 : shot.size === "medium" ? 0.6 : shot.size === "full" ? 1.2 : 3;
  const far: number = Math.max(0.15, span / (FILL[shot.size] * Math.tan(CameraTrack.FOV / 2) * 2));
  const station: IAutoMovieVector3 | undefined = shot.from !== undefined ? world.set.stations[shot.from] : undefined;
  const bearing: number = station !== undefined ? Math.atan2(station.x - target.x, station.z - target.z) : (kept ?? 0);
  return { position: { x: target.x + Math.sin(bearing) * far, y: target.y, z: target.z + Math.cos(bearing) * far }, target };
}
/** Keep the lens at least 0.9 m from every framed subject's floor point, pushing it out radially, so a push or arc never enters a body. */
function clear(sample: CameraTrack.ISample, shot: StageAction.IShot | undefined, performance: StagePerformance, t: number): CameraTrack.ISample {
  if (!shot) return sample;
  let p: IAutoMovieVector3 = sample.position;
  for (const id of shot.subjects) {
    const s: IAutoMovieVector3 | undefined = performance.position(id, t);
    if (!s) continue;
    const dx: number = p.x - s.x;
    const dz: number = p.z - s.z;
    const d: number = Math.hypot(dx, dz);
    if (d < 0.9 && Math.abs(p.y - s.y) < 2.5) p = d < 1e-6 ? { ...p, z: s.z + 0.9 } : { x: s.x + (dx / d) * 0.9, y: p.y, z: s.z + (dz / d) * 0.9 };
  }
  return { position: p, target: sample.target };
}

/** The bearing from the target to the lens: the station's, mirrored if it breaks the screen order, or the side of the action line that keeps it. */
function bearingOf(world: IStageWorld, shot: StageAction.IShot, target: IAutoMovieVector3, points: IAutoMovieVector3[], performance: StagePerformance, t: number, kept?: number): number {
  // Two subjects without a named order read in the order given, left then right.
  const screen: StageAction.IShot["screen"] = shot.screen ?? (shot.subjects.length >= 2 ? { left: shot.subjects[0]!, right: shot.subjects[1]! } : undefined);
  const station: IAutoMovieVector3 | undefined = shot.from !== undefined ? world.set.stations[shot.from] : undefined;
  let bearing: number = station ? Math.atan2(station.x - target.x, station.z - target.z) : 0;
  if (screen) {
    const a: IAutoMovieVector3 | undefined = performance.position(screen.left, t);
    const b: IAutoMovieVector3 | undefined = performance.position(screen.right, t);
    if (a && b) {
      const line: number = Math.atan2(b.x - a.x, b.z - a.z);
      const candidates: number[] = [line + Math.PI / 2, line - Math.PI / 2];
      // The lens looks along -d; screen right is look × up; the right subject must lie on it.
      const ok = (bear: number): boolean => {
        const look = { x: -Math.sin(bear), z: -Math.cos(bear) };
        const right = { x: -look.z, z: look.x };
        return (b.x - a.x) * right.x + (b.z - a.z) * right.z > 0;
      };
      if (!station) bearing = candidates.find(ok) ?? candidates[0]!;
      else if (!ok(bearing)) bearing = 2 * line - bearing;
      // Two people seen nearly along their line hide each other: keep the lens at least 35° off it, on its side.
      const off: number = Math.atan2(Math.sin(bearing - line), Math.cos(bearing - line));
      const least: number = (35 * Math.PI) / 180;
      if (Math.abs(Math.sin(off)) < Math.sin(least)) {
        const side: number = Math.sin(off) >= 0 ? 1 : -1;
        const near: number = Math.cos(off) >= 0 ? least : Math.PI - least;
        bearing = line + side * near;
        if (!ok(bearing)) bearing = line - side * near;
      }
    }
  } else if (!station && kept !== undefined) {
    bearing = kept;
  } else if (!station && points.length >= 1) {
    const found = performance.entry(shot.subjects[0]!, t);
    if (found) bearing = found.step.to.heading + 0.5;
  }
  return bearing;
}

/** A neutral framing of everyone on stage when no shot has started. */
function fallback(world: IStageWorld, performance: StagePerformance, t: number): CameraTrack.ISample {
  const points: IAutoMovieVector3[] = performance.subjects().map((id) => performance.position(id, t)).filter((p): p is IAutoMovieVector3 => p !== undefined);
  const station: IAutoMovieVector3 | undefined = Object.values(world.set.stations)[0];
  const target: IAutoMovieVector3 = points.length > 0 ? { x: points.reduce((s, p) => s + p.x, 0) / points.length, y: 0.9, z: points.reduce((s, p) => s + p.z, 0) / points.length } : { x: 0, y: 0.9, z: 0 };
  return { position: station ?? { x: target.x, y: 1.5, z: target.z + 6 }, target };
}

function lerp(a: IAutoMovieVector3, b: IAutoMovieVector3, k: number): IAutoMovieVector3 {
  return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, z: a.z + (b.z - a.z) * k };
}
