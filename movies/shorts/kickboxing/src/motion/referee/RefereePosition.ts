import { BoutScript } from "../../shots/kickboxing/ring-bout/BoutScript";
import { BoutTechnique } from "../choreography/BoutTechnique";
import { Blocking } from "../defense/Blocking";
import { BoutRing } from "../footwork/BoutRing";
import { RefereeCues } from "./RefereeCues";
import { FilmVector as V } from "../rig/FilmVector";

/**
 * The referee's continuous positioning while the fighters work, from the
 * officiating mechanics in `docs/research/ring-craft.md`: he keeps a side view
 * of both fighters across their line, as far from them as the ring allows,
 * keeps the pace of the circling pair, never stands behind a fighter or
 * between a fighter and the ropes, and shortens his distance when they work
 * on the ropes or clinch. He walks, never bounces: his position follows the
 * desired point at no more than walking speed.
 */
export namespace RefereePosition {
  /** Pair as seen by the referee at one second. */
  export interface IPair {
    /** Stance origin of A, world point at canvas height. */ readonly a: V.Value;
    /** Stance origin of B. */ readonly b: V.Value;
    /** Whether the fighters are clinched or about to be. */ readonly clinch: boolean;
  }

  /** Farthest working distance from the pair's centre, metres. */
  export const FAR: number = 2.1;

  /** Shortened distance on the ropes and in the clinch, metres. */
  export const NEAR: number = 1.3;

  /** Body margin from the rope line, metres. */
  export const MARGIN: number = 0.4;

  /** Walking speed limit, metres per second. */
  export const WALK: number = 1.2;

  /** Time constant with which he closes on the desired point, seconds. */
  export const LAG: number = 0.6;

  /** Last second of the bout positioning: the knockdown cues take over from here. */
  export const UNTIL: number = RefereeCues.knockdownStart;

  /** The bout's positions, one per ring-generalship step from the bell, computed once from the composed bout. */
  export function bout(): readonly V.Value[] {
    if (cache) return cache;
    const clinches: readonly (readonly [number, number])[] = BoutScript.actions
      .filter((action: BoutScript.Action): boolean => BoutTechnique.get(action.technique).guard === "clinch")
      .map((action: BoutScript.Action): readonly [number, number] => [
        action.at - BoutTechnique.get(action.technique).windup - LAG,
        action.at + BoutTechnique.HOLD + action.parameters.recovery,
      ]);
    const pairs: IPair[] = [];
    for (let index: number = 0; index * BoutRing.STEP <= UNTIL + BoutRing.STEP; index++) {
      const t: number = index * BoutRing.STEP;
      const pair: Blocking.Pair = Blocking.pair(t);
      pairs.push({
        a: [pair.a.origin[0], 0, pair.a.origin[1]],
        b: [pair.b.origin[0], 0, pair.b.origin[1]],
        clinch: clinches.some((window: readonly [number, number]): boolean => t >= window[0] && t <= window[1]),
      });
    }
    cache = Object.freeze(simulate(pairs, desired(pairs[0]!, -1)));
    return cache;
  }

  /** Interpolated bout position at a second. */
  export function at(t: number): V.Value {
    const track: readonly V.Value[] = bout();
    const index: number = Math.max(0, Math.min(track.length - 1, t / BoutRing.STEP));
    const low: number = Math.min(track.length - 2, Math.floor(index));
    return V.lerp(track[low]!, track[low + 1]!, index - low);
  }

  /** Simulate his ground position at {@link BoutRing.STEP} from a start point. */
  export function simulate(pairs: readonly IPair[], start: V.Value): V.Value[] {
    const positions: V.Value[] = [start];
    let side: number = sideOf(pairs[0]!, start);
    let position: V.Value = start;
    for (const pair of pairs.slice(1)) {
      // Keep his side of the line unless that side has no room left.
      if (reach(pair, side) < NEAR && reach(pair, -side) > reach(pair, side)) side = -side;
      const wanted: V.Value = desired(pair, side);
      const delta: V.Value = V.sub(wanted, position);
      const distance: number = V.length(delta);
      const travel: number = Math.min(distance, WALK * BoutRing.STEP, (distance * BoutRing.STEP) / LAG);
      position = inside(distance > 0 ? V.add(position, V.scale(delta, travel / distance)) : position);
      positions.push(position);
    }
    return positions;
  }

  /** Desired point on one side of the fighters' line. */
  export function desired(pair: IPair, side: number): V.Value {
    const centre: V.Value = V.lerp(pair.a, pair.b, 0.5);
    const across: V.Value = normal(pair, side);
    const ropes: boolean = BoutRing.room(pair.a) < BoutRing.ROPES || BoutRing.room(pair.b) < BoutRing.ROPES;
    const distance: number = pair.clinch || ropes ? NEAR : Math.max(NEAR, Math.min(FAR, reach(pair, side)));
    return V.add(centre, V.scale(across, distance));
  }

  /** Room from the pair's centre toward the ropes along one side of the line, less his margin. */
  export function reach(pair: IPair, side: number): number {
    const centre: V.Value = V.lerp(pair.a, pair.b, 0.5);
    const across: V.Value = normal(pair, side);
    const limit: number = BoutRing.HALF - MARGIN;
    let best: number = Infinity;
    for (const axis of [0, 2] as const)
      if (Math.abs(across[axis]) > 1e-9)
        best = Math.min(best, ((across[axis] > 0 ? limit : -limit) - centre[axis]) / across[axis]);
    return best;
  }

  /** Unit horizontal normal of the fighters' line toward one side. */
  function normal(pair: IPair, side: number): V.Value {
    const line: V.Value = V.normalize([pair.b[0] - pair.a[0], 0, pair.b[2] - pair.a[2]]);
    return V.scale([-line[2], 0, line[0]], side);
  }

  /** Side of the line a point lies on. */
  function sideOf(pair: IPair, point: V.Value): number {
    const across: V.Value = normal(pair, 1);
    return V.dot(V.sub(point, V.lerp(pair.a, pair.b, 0.5)), across) >= 0 ? 1 : -1;
  }

  /** Keep a point inside the ropes by his margin. */
  function inside(point: V.Value): V.Value {
    const limit: number = BoutRing.HALF - MARGIN;
    return [Math.max(-limit, Math.min(limit, point[0])), point[1], Math.max(-limit, Math.min(limit, point[2]))];
  }
}

/** Bout positions once computed. */
let cache: readonly V.Value[] | undefined;
