import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import { AutoMovieHumanEventJoinVector } from "./AutoMovieHumanEventJoinVector";

type Vec3 = AutoMovieHumanEventJoinVector.Vec3;
const { add, dot, norm, scale, smooth, sub } = AutoMovieHumanEventJoinVector;

/**
 * The parent's ring at an event as the event join reads it: sampled densely
 * by phase with its length along the ring, the weight of each phase on the
 * child's arcs (fading to zero over {@link TAPER} mm before each pinch), and
 * the nearest point of the ring to any point.
 */
export namespace AutoMovieHumanEventJoinRing {
  /** Fade length before a pinch, mm. */
  export const TAPER: number = 6;

  /** Dense parent ring at an event and the arc weight of a phase on it. */
  export interface IRing {
    /** The parent's station at the event, mm. */
    sp: number;

    /** The ring's samples at uniform phases, mm. */
    points: Vec3[];

    /** Length along the ring up to each sample, one more entry than the samples. */
    length: number[];

    /** Weight of a phase on the child's arcs, 0 off them and fading to 0 before each pinch. */
    weight: (t: number) => number;
  }

  /** Samples of the dense parent ring. */
  export const RING: number = 2048;

  /** The parent's ring at an event and the weight of its phases on the child's arcs. */
  export function parentRing(
    parent: IAutoMovieHumanLoftChain,
    direction: "down" | "up",
    arcs: [number, number][],
  ): IRing {
    const last: number = parent.layers.length - 1;
    const sp: number =
      direction === "down" ? parent.layers[0]!.y : parent.layers[last]!.y;
    const n: number = RING;
    const ring: Vec3[] = AutoMovieHumanLoftChain.ring(
      parent,
      sp,
      Array.from(
        { length: n },
        (_: unknown, i: number): number => (2 * Math.PI * i) / n,
      ),
    );
    const length: number[] = [0];
    for (let i: number = 1; i <= n; i++)
      length.push(length[i - 1]! + norm(sub(ring[i % n]!, ring[i - 1]!)));
    const at: (t: number) => number = (t: number): number => {
      const u: number = ((((t / (2 * Math.PI)) % 1) + 1) % 1) * n;
      const i: number = Math.floor(u);
      return length[i]! + (u - i) * (length[i + 1]! - length[i]!);
    };
    const perimeter: number = length[n]!;
    const whole: boolean = arcs.some(
      ([a, b]: [number, number]): boolean => b - a >= 2 * Math.PI - 1e-9,
    );
    const weight: (t: number) => number = (t: number): number => {
      if (whole) return 1;
      let best: number = 0;
      for (const [a, b] of arcs) {
        const la: number = at(a);
        const span: number = (at(b) - la + perimeter) % perimeter;
        const offset: number = (at(t) - la + perimeter) % perimeter;
        if (offset > span) continue;
        const edge: number = Math.min(offset, span - offset);
        best = Math.max(best, smooth(edge / TAPER));
      }
      return best;
    };
    return { sp, points: ring, length, weight };
  }

  /**
   * Nearest point of a dense ring to p: its phase, the point on the closer
   * neighbouring segment, the distance, and the nearest sample's index.
   * A caller walking a ring in order passes the sample it found last as
   * `guess`: its distance bounds the scan from the first step, so the arc
   * length bound passes over almost every sample.
   */
  export function nearest(ring: IRing, p: Vec3, guess?: number): [number, Vec3, number, number] {
    const n: number = ring.points.length;
    let best: number = 0;
    let distance: number = Infinity;
    let bound: number = Infinity;
    if (guess !== undefined && guess >= 0 && guess < n) {
      const g: Vec3 = ring.points[guess]!;
      const square: number = (g[0] - p[0]) ** 2 + (g[1] - p[1]) ** 2 + (g[2] - p[2]) ** 2;
      best = guess;
      distance = Math.sqrt(square);
      bound = square * (1 + 1e-9);
    }
    for (let j: number = 0; j < n; ) {
      const q: Vec3 = ring.points[j]!;
      const x: number = q[0] - p[0];
      const y: number = q[1] - p[1];
      const z: number = q[2] - p[2];

      // Only a sample that can beat the best pays for the exact length.
      const square: number = x * x + y * y + z * z;
      if (!(square > bound)) {
        const d: number = Math.hypot(x, y, z);
        if (d < distance) {
          distance = d;
          best = j;
          bound = square * (1 + 1e-9);
        }
      }

      // A sample closes on p by no more than the ring's length to it, so those
      // too near along the ring to come within the bound are passed over.
      const reach: number =
        ring.length[j]! + Math.sqrt(square) - Math.sqrt(bound) - 1e-6;
      let low: number = j + 1;
      let high: number = n;
      while (low < high) {
        const middle: number = (low + high) >> 1;
        if (ring.length[middle]! < reach) low = middle + 1;
        else high = middle;
      }
      j = low;
    }
    // Refine on the two segments beside the nearest sample.
    let point: Vec3 = ring.points[best]!;
    for (const other of [(best + n - 1) % n, (best + 1) % n]) {
      const a: Vec3 = ring.points[best]!;
      const d: Vec3 = sub(ring.points[other]!, a);
      const u: number = Math.max(
        0,
        Math.min(1, dot(sub(p, a), d) / Math.max(1e-12, dot(d, d))),
      );
      const q: Vec3 = add(a, scale(d, u));
      const e: number = norm(sub(q, p));
      if (e < distance) {
        distance = e;
        point = q;
      }
    }
    return [(2 * Math.PI * best) / n, point, distance, best];
  }
}