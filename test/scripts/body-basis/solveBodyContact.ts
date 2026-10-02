import {
  crossedCorners,
  surfaceOfSegment,
} from "./bodyContactGeometry";
import { type IBodyContactPlane, depthOfPlane } from "./bodyContactPlanes";

/**
 * The contact solver for two skin segments that cross in a pose.
 *
 * Each round reads the crossing corners of both segments and gives each a
 * target. Under the plane rule (a fold plane for an adjacent pair or the
 * contact plane between two bones) a crossed corner short of a clearance on
 * its own side moves onto that clearance. Under the surface rule (no plane) a
 * corner inside the other surface moves out along that surface's normal by
 * half its depth plus the clearance. The targets are spread as a smooth
 * displacement field: Laplacian relaxation over `RINGS` rings of neighbours
 * with the targets held at least at their distance, so the correction is a
 * dent with sloped sides and not a sheet, and nothing that is not a crossing
 * corner is pushed directly. Every vertex stays inside a tissue budget from
 * where it started, and when one side has spent its budget the plane slides a
 * millimetre toward the side with slack.
 *
 * Positions are metres in the body's frame and are mutated in place; the
 * displacement from `base` accumulates in a map keyed by basis vertex. A pair
 * the budget cannot part is reported unsolved and not pushed harder: a
 * corrective that must move skin further than tissue compresses describes a
 * pose the range should not reach.
 */

/** Clearance off the plane or past the entered surface, metres. */
export const CONTACT_CLEARANCE = 0.0015;

/** Rounds of push and relax before a pair is called unsolved. */
export const CONTACT_ROUNDS = 24;

/** Rings of neighbours around a pushed vertex that share the motion. */
export const CONTACT_RINGS = 8;

/** Relaxation sweeps per round. */
export const CONTACT_SWEEPS = 40;

/** How far the plane slides per round toward the side with slack, metres. */
export const CONTACT_SLIDE = 0.001;

/**
 * A separation one contact already gave a vertex: the direction it was pushed
 * along and how far it had to go. A segment between two contacts (the pelvis
 * between the thighs) is pushed by each in turn, and a relaxation that only
 * knows the pair in hand pulls the vertex back into the contact the previous
 * pair had just cleared. Every constraint a vertex carries is held at once.
 */
export interface IBodyStanding {
  direction: number[];
  distance: number;
}

/** What one round saw, for a probe that watches a pair fail. */
export interface IBodyContactTrace {
  round: number;
  crossedA: number;
  crossedB: number;
  starved: number;
}

const dot = (x: number[], y: number[]): number =>
  x[0] * y[0] + x[1] * y[1] + x[2] * y[2];

/**
 * Push segments `a` and `b` apart in `positions`, accumulating the
 * displacement from `base` in `displacement`. `plane`, when given, is the
 * separating plane with its normal toward `a`'s side; `owner` says which side
 * a vertex both segments touch belongs to (`1` for `a`); `repeated` pushes a
 * target again by its distance at every relaxation sweep, which climbs to the
 * budget in a crease whose neighbours are crossing corners too and parted the
 * elbow, the knee and the hip with a smooth dent where a single hold left
 * them crossing; `standing` carries the separations earlier contacts of the
 * same state won and receives this one's.
 */
export function solveBodyContact(
  positions: number[],
  base: number[],
  displacement: Map<number, number[]>,
  near: number[][],
  a: number[],
  b: number[],
  budget: number,
  plane: IBodyContactPlane | null,
  owner: Map<number, 1 | -1> = new Map(),
  trace: ((event: IBodyContactTrace) => void) | null = null,
  repeated = true,
  standing: Map<number, IBodyStanding[]> = new Map(),
): { solved: boolean; rounds: number } {
  const side = new Map<number, 1 | -1>();
  for (const v of b) side.set(v, -1);
  for (const v of a) side.set(v, 1);
  const inA = new Set(a);
  const inB = new Set(b);
  for (const v of b) if (inA.has(v)) side.set(v, owner.get(v) ?? 1);
  const starved = new Set<number>();
  const clamp = (vertex: number): void => {
    const delta = [0, 1, 2].map(
      (k) => positions[vertex * 3 + k] - base[vertex * 3 + k],
    );
    const far = Math.hypot(delta[0], delta[1], delta[2]);
    if (far > budget) {
      for (let k = 0; k < 3; k++)
        positions[vertex * 3 + k] =
          base[vertex * 3 + k] + (delta[k] / far) * budget;
      starved.add(vertex);
    }
    const kept = [0, 1, 2].map(
      (k) => positions[vertex * 3 + k] - base[vertex * 3 + k],
    );
    if (Math.hypot(kept[0], kept[1], kept[2]) > 1e-9)
      displacement.set(vertex, kept);
    else displacement.delete(vertex);
  };
  const live =
    plane === null
      ? null
      : { point: [...plane.point], normal: [...plane.normal] };
  const positionOf = (vertex: number): number[] => [
    positions[vertex * 3],
    positions[vertex * 3 + 1],
    positions[vertex * 3 + 2],
  ];
  for (let round = 0; round < CONTACT_ROUNDS; round++) {
    const hitA = crossedCorners(positions, a, b);
    const hitB = crossedCorners(positions, b, a);
    if (trace !== null)
      trace({
        round,
        crossedA: hitA.size,
        crossedB: hitB.size,
        starved: starved.size,
      });
    if (hitA.size + hitB.size === 0) return { solved: true, rounds: round };
    if (live !== null) {
      if (round === 0) {
        // centre the plane between the deepest of each side, measured from
        // the crossed corners and not from the joint
        let deepestA = Infinity;
        let deepestB = -Infinity;
        for (const v of hitA)
          if (side.get(v) === 1)
            deepestA = Math.min(deepestA, depthOfPlane(live, positions, v));
        for (const v of hitB)
          if (side.get(v) === -1)
            deepestB = Math.max(deepestB, depthOfPlane(live, positions, v));
        if (Number.isFinite(deepestA) && Number.isFinite(deepestB)) {
          const shift = (deepestA + deepestB) / 2;
          for (let k = 0; k < 3; k++) live.point[k] += shift * live.normal[k];
        }
      } else if (starved.size > 0) {
        let starvedA = 0;
        let starvedB = 0;
        for (const v of starved)
          if (side.get(v) === 1) starvedA++;
          else starvedB++;
        const toward =
          starvedA > 0 && starvedB === 0
            ? -1
            : starvedB > 0 && starvedA === 0
              ? 1
              : 0;
        for (let k = 0; k < 3; k++)
          live.point[k] += toward * CONTACT_SLIDE * live.normal[k];
      }
    }
    starved.clear();
    const targets = new Map<
      number,
      { direction: number[]; distance: number }
    >();
    if (live !== null) {
      for (const hit of [hitA, hitB])
        for (const vertex of hit) {
          const s = side.get(vertex)!;
          const depth = s * depthOfPlane(live, positions, vertex);
          if (depth >= CONTACT_CLEARANCE) continue;
          targets.set(vertex, {
            direction: live.normal.map((one) => s * one),
            distance: CONTACT_CLEARANCE - depth,
          });
        }
    } else {
      for (const [hit, into] of [
        [hitA, b],
        [hitB, a],
      ] as const) {
        const nearest = surfaceOfSegment(positions, into);
        const seam = into === b ? inB : inA;
        for (const vertex of hit) {
          // a seam vertex belongs to both segments and cannot be inside either
          if (seam.has(vertex)) continue;
          const { normal, away } = nearest(positionOf(vertex));
          if (away >= 0) continue;
          targets.set(vertex, {
            direction: normal,
            distance: 0.5 * -away + CONTACT_CLEARANCE,
          });
        }
      }
    }
    if (targets.size === 0) {
      // every crossing triangle already has its corners on their side: the
      // crossing is an edge sliver; nudge the corners by one clearance
      for (const [hit, into] of [
        [hitA, b],
        [hitB, a],
      ] as const) {
        const nearest = live === null ? surfaceOfSegment(positions, into) : null;
        for (const vertex of hit) {
          const s = side.get(vertex)!;
          const direction =
            live !== null
              ? live.normal.map((one) => s * one)
              : nearest!(positionOf(vertex)).normal;
          targets.set(vertex, { direction, distance: CONTACT_CLEARANCE });
        }
      }
    }
    const support = new Set<number>(targets.keys());
    let ring = new Set<number>(targets.keys());
    for (let depth = 0; depth < CONTACT_RINGS; depth++) {
      const next = new Set<number>();
      for (const vertex of ring)
        for (const neighbour of near[vertex])
          if (!support.has(neighbour)) {
            support.add(neighbour);
            next.add(neighbour);
          }
      ring = next;
    }
    const field = new Map<number, number[]>();
    for (const vertex of support)
      field.set(vertex, [...(displacement.get(vertex) ?? [0, 0, 0])]);
    const need = new Map<number, number>();
    for (const [vertex, target] of targets) {
      const worn = displacement.get(vertex) ?? [0, 0, 0];
      need.set(vertex, target.distance + dot(worn, target.direction));
    }
    const hold = (vertex: number): void => {
      const u = field.get(vertex);
      if (u === undefined) return;
      const target = targets.get(vertex);
      if (target !== undefined) {
        const along = dot(u, target.direction);
        const shortfall = repeated
          ? Math.max(need.get(vertex)! - along, target.distance)
          : need.get(vertex)! - along;
        if (shortfall > 0)
          for (let k = 0; k < 3; k++) u[k] += shortfall * target.direction[k];
      }
      // and every separation another contact of this state already gave it
      for (const held of standing.get(vertex) ?? []) {
        const shortfall = held.distance - dot(u, held.direction);
        if (shortfall > 0)
          for (let k = 0; k < 3; k++) u[k] += shortfall * held.direction[k];
      }
    };
    for (const vertex of targets.keys()) hold(vertex);
    for (let sweep = 0; sweep < CONTACT_SWEEPS; sweep++) {
      const before = new Map<number, number[]>();
      for (const [vertex, u] of field) before.set(vertex, [u[0], u[1], u[2]]);
      for (const vertex of support) {
        const list = near[vertex];
        const mean = [0, 0, 0];
        for (const neighbour of list) {
          const u = before.get(neighbour) ??
            displacement.get(neighbour) ?? [0, 0, 0];
          for (let k = 0; k < 3; k++) mean[k] += u[k];
        }
        const u = field.get(vertex)!;
        for (let k = 0; k < 3; k++) u[k] = mean[k] / list.length;
        hold(vertex);
      }
    }
    for (const [vertex, u] of field) {
      for (let k = 0; k < 3; k++)
        positions[vertex * 3 + k] = base[vertex * 3 + k] + u[k];
      clamp(vertex);
    }
    for (const [vertex, target] of targets) {
      const worn = displacement.get(vertex) ?? [0, 0, 0];
      const along = dot(worn, target.direction);
      if (along <= 0) continue;
      const list = standing.get(vertex) ?? [];
      const same = list.find((held) => dot(held.direction, target.direction) > 0.99);
      if (same === undefined)
        list.push({ direction: [...target.direction], distance: along });
      else same.distance = Math.max(same.distance, along);
      standing.set(vertex, list);
    }
  }
  return { solved: false, rounds: CONTACT_ROUNDS };
}
