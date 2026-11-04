/**
 * The small vector and curve mathematics the hand's pieces share: three-vectors
 * as plain arrays, smooth steps, a rounded maximum and the taut-tape perimeter
 * of a planar point set. Every piece of the hand imports it, so no piece keeps
 * a private copy.
 */
export namespace AutoMovieHumanHandVector {
  /** A point or direction. */
  export type Vec3 = [number, number, number];

  /** A whole turn, radians. */
  export const TWO_PI: number = 2 * Math.PI;

  /** Difference. */
  export function sub(a: Vec3, b: Vec3): Vec3 {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  /** Sum. */
  export function plus(a: Vec3, b: Vec3): Vec3 {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  }

  /** Scalar multiple. */
  export function scale(a: Vec3, s: number): Vec3 {
    return [a[0] * s, a[1] * s, a[2] * s];
  }

  /** Dot product. */
  export function dot(a: Vec3, b: Vec3): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  /** Euclidean length. */
  export function norm(a: Vec3): number {
    return Math.hypot(a[0], a[1], a[2]);
  }

  /** Unit vector; zero stays zero. */
  export function unit(a: Vec3): Vec3 {
    const l: number = norm(a) || 1;
    return [a[0] / l, a[1] / l, a[2] / l];
  }

  /** The part of a vector across a unit heading, as a unit vector. */
  export function across(v: Vec3, t: Vec3): Vec3 {
    const k: number = dot(v, t);
    return unit([v[0] - k * t[0], v[1] - k * t[1], v[2] - k * t[2]]);
  }

  /** Cross product. */
  export function cross(a: Vec3, b: Vec3): Vec3 {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  }

  /** Mean of one coordinate of a ring of points. */
  export function mean(ring: Vec3[], c: number): number {
    return ring.reduce((s: number, p: Vec3): number => s + p[c]!, 0) / ring.length;
  }

  /** Smoothstep clamped to [0, 1]: no slope at either end. */
  export function smooth(x: number): number {
    const t: number = Math.min(1, Math.max(0, x));
    return t * t * (3 - 2 * t);
  }

  /** Quintic smoothstep clamped to [0, 1]: no slope and no curvature at either end. */
  export function smoother(x: number): number {
    const t: number = Math.min(1, Math.max(0, x));
    return t * t * t * (t * (6 * t - 15) + 10);
  }

  /**
   * Maximum of two radii with one tangent: exact where they differ by more
   * than `k`, and rounded within `k` of each other by a quarter of the
   * overlap's square over `k` (Quilez's polynomial smooth maximum).
   */
  export function softMax(a: number, b: number, k: number): number {
    const h: number = Math.max(k - Math.abs(a - b), 0) / k;
    return Math.max(a, b) + (h * h * k) / 4;
  }

  /**
   * Perimeter of the convex hull of points in a plane (Andrew's monotone
   * chain): a taut tape drawn round the section, the way a tape measure reads
   * a girth.
   */
  export function hull(points: readonly [number, number][]): number {
    const p: [number, number][] = [...points].sort(
      (u: [number, number], v: [number, number]): number => u[0] - v[0] || u[1] - v[1],
    );
    if (p.length < 3) return 0;

    const turn = (o: [number, number], a: [number, number], b: [number, number]): number =>
      (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const chain = (list: [number, number][]): [number, number][] => {
      const out: [number, number][] = [];
      for (const q of list) {
        while (out.length >= 2 && turn(out[out.length - 2]!, out[out.length - 1]!, q) <= 0) out.pop();
        out.push(q);
      }
      return out;
    };
    const ring: [number, number][] = [...chain(p).slice(0, -1), ...chain([...p].reverse()).slice(0, -1)];

    let sum: number = 0;
    ring.forEach((q: [number, number], i: number): void => {
      const r: [number, number] = ring[(i + 1) % ring.length]!;
      sum += Math.hypot(r[0] - q[0], r[1] - q[1]);
    });
    return sum;
  }
}
