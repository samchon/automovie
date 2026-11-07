import { BoutTechnique } from "../../../motion/choreography/BoutTechnique";
import { Blocking } from "../../../motion/defense/Blocking";
import { BoutRing } from "../../../motion/footwork/BoutRing";
import { RefereePosition } from "../../../motion/referee/RefereePosition";
import { FilmVector as Vec3 } from "../../../motion/rig/FilmVector";
import { BoutScript } from "./BoutScript";

/**
 * The bout camera as a relational operator, after the coverage recorded in
 * `docs/research/ring-craft.md`: a ringside camera that keeps a side view of
 * both fighters from across their line opposite the referee, frames wide
 * while they reset, medium while an exchange is live and pushes in on a clean
 * landing, holding each size at least {@link HOLD} seconds. It orbits around
 * the pair at a bounded angular speed instead of cutting through it, and its
 * position and aim follow with operator lag, so every move is motivated by
 * the action. One continuous take; the screenplay's 143 s widening and the
 * knockout hold belong to the film plan.
 */
export namespace BoutCamera {
  /** Shot size. */
  export type Size = "wide" | "medium" | "close";

  /** One shot size: distance from the pair's centre, lens height, aim height and horizontal field of view. */
  export interface IShot {
    /** Metres from the pair's centre. */ readonly distance: number;
    /** Lens height, metres. */ readonly height: number;
    /** Aim height, metres. */ readonly aim: number;
    /** Field of view, degrees. */ readonly fov: number;
  }

  /** Framing per size: wide shows both bodies and the referee, medium both full figures, close the receiver's upper body. */
  export const SHOTS: Readonly<Record<Size, IShot>> = {
    wide: { distance: 3.3, height: 1.75, aim: 1.0, fov: 54 },
    medium: { distance: 2.6, height: 1.55, aim: 1.05, fov: 46 },
    close: { distance: 2.0, height: 1.5, aim: 1.25, fov: 40 },
  };

  /** Shortest time a size is held before the next change, seconds. */
  export const HOLD: number = 2.4;

  /** Operator lag of the camera position and aim, seconds. */
  export const LAG: { readonly position: number; readonly aim: number } = { position: 0.45, aim: 0.15 };

  /** Fastest orbit around the pair, radians per second. */
  export const ORBIT: number = 0.9;

  /** Rope-line margin the lens keeps, metres. */
  export const MARGIN: number = 0.2;

  /** One sampled camera state. */
  export interface IState {
    /** Lens position, world metres. */ readonly position: Vec3.Value;
    /** Aim point, world metres. */ readonly target: Vec3.Value;
    /** Field of view, degrees. */ readonly fov: number;
    /** Current shot size. */ readonly size: Size;
  }

  /** Shot size the action asks for at a second, before the hold rule. */
  export function wanted(t: number): Size {
    for (const action of BoutScript.actions)
      if (action.defense === "hit" && t >= action.at - 0.15 && t <= action.at + 0.9) return "close";
    for (const [start, end] of EXCHANGES) if (t >= start && t <= end) return "medium";
    return "wide";
  }

  /** The simulated bout camera, one state per ring-generalship step from the bell to `until`. */
  export function track(until: number): readonly IState[] {
    if (cache && cache.until >= until) return cache.states;
    const states: IState[] = [];
    let size: Size = wanted(0);
    let held: number = 0;
    let angle: number | undefined;
    let position: Vec3.Value | undefined;
    let target: Vec3.Value | undefined;
    let fov: number = SHOTS[size].fov;
    for (let index: number = 0; index * BoutRing.STEP <= until + BoutRing.STEP; index++) {
      const t: number = index * BoutRing.STEP;
      const next: Size = wanted(t);
      held += BoutRing.STEP;
      if (next !== size && held >= HOLD) {
        size = next;
        held = 0;
      }
      const shot: IShot = SHOTS[size];
      const pair: Blocking.Pair = Blocking.pair(t);
      const centre: Vec3.Value = [pair.centre[0], 0, pair.centre[1]];
      // Opposite the referee across the fighters' line.
      const referee: Vec3.Value = RefereePosition.at(t);
      const across: Vec3.Value = Vec3.rotateY([0, 0, 1], pair.axis);
      const side: number = Vec3.dot(Vec3.sub(referee, centre), across) >= 0 ? -1 : 1;
      const desired: number = Math.atan2(across[2] * side, across[0] * side);
      if (angle === undefined) angle = desired;
      const turn: number = Math.atan2(Math.sin(desired - angle), Math.cos(desired - angle));
      angle += Math.max(-ORBIT * BoutRing.STEP, Math.min(ORBIT * BoutRing.STEP, turn * Math.min(1, BoutRing.STEP / LAG.position)));
      const lens: Vec3.Value = inside([centre[0] + Math.cos(angle) * shot.distance, shot.height, centre[2] + Math.sin(angle) * shot.distance]);
      const focus: Vec3.Value = [centre[0], shot.aim, centre[2]];
      position = position ? follow(position, lens, LAG.position) : lens;
      target = target ? follow(target, focus, LAG.aim) : focus;
      fov += (shot.fov - fov) * Math.min(1, BoutRing.STEP / LAG.position);
      states.push({ position, target, fov, size });
    }
    cache = { until, states: Object.freeze(states) };
    return cache.states;
  }

  /** Interpolated camera at a second. */
  export function at(t: number, until: number): IState {
    const states: readonly IState[] = track(until);
    const index: number = Math.max(0, Math.min(states.length - 1, t / BoutRing.STEP));
    const low: number = Math.min(states.length - 2, Math.floor(index));
    const u: number = index - low;
    const x: IState = states[low]!;
    const y: IState = states[low + 1]!;
    return {
      position: Vec3.lerp(x.position, y.position, u),
      target: Vec3.lerp(x.target, y.target, u),
      fov: x.fov + (y.fov - x.fov) * u,
      size: u < 0.5 ? x.size : y.size,
    };
  }

  /** Live exchange windows: from the first launch to the last return of each exchange. */
  const EXCHANGES: readonly (readonly [number, number])[] = (() => {
    const windows: Map<string, [number, number]> = new Map();
    for (const action of BoutScript.actions) {
      const start: number = action.at - BoutTechnique.get(action.technique).windup;
      const end: number = action.at + BoutTechnique.HOLD + action.parameters.recovery;
      const window: [number, number] | undefined = windows.get(action.exchange);
      windows.set(action.exchange, window ? [Math.min(window[0], start), Math.max(window[1], end)] : [start, end]);
    }
    return [...windows.values()];
  })();

  /** Move toward a goal with a first-order lag. */
  function follow(current: Vec3.Value, goal: Vec3.Value, lag: number): Vec3.Value {
    return Vec3.lerp(current, goal, Math.min(1, BoutRing.STEP / lag));
  }

  /** Keep the lens inside the rope line. */
  function inside(point: Vec3.Value): Vec3.Value {
    const limit: number = BoutRing.HALF - MARGIN;
    return [Math.max(-limit, Math.min(limit, point[0])), point[1], Math.max(-limit, Math.min(limit, point[2]))];
  }

  /** Computed states and their extent. */
  let cache: { until: number; states: readonly IState[] } | undefined;
}
