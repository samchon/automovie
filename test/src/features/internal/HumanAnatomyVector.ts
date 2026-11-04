/**
 * Vector arithmetic of the Human anatomy observers, on `[x, y, z]` tuples in
 * millimetres (frame: forward +X, up +Y, the body's left +Z). Reached through
 * `HumanAnatomy`, which re-exports every function by the same name.
 */
export namespace HumanAnatomyVector {
  /** A point or a direction. */
  export type V3 = [number, number, number];

  /** Difference. */
  export function sub(a: V3, b: V3): V3 {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  /** Sum. */
  export function add(a: V3, b: V3): V3 {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  }

  /** Scaled vector. */
  export function scale(a: V3, s: number): V3 {
    return [a[0] * s, a[1] * s, a[2] * s];
  }

  /** Dot product. */
  export function dot(a: V3, b: V3): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  /** Cross product. */
  export function cross(a: V3, b: V3): V3 {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }

  /** Distance. */
  export function dist(a: V3, b: V3): number {
    return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  }

  /** Unit vector. */
  export function unit(a: V3): V3 {
    const l: number = Math.hypot(a[0], a[1], a[2]);
    return [a[0] / l, a[1] / l, a[2] / l];
  }

  /** Point along a line. */
  export function lerp(a: V3, b: V3, s: number): V3 {
    return [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s, a[2] + (b[2] - a[2]) * s];
  }

  /** Two unit vectors completing a normal to an orthonormal frame. */
  export function basis(n: V3): [V3, V3] {
    const helper: V3 = Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    const u: V3 = unit(cross(n, helper));
    return [u, cross(n, u)];
  }

  /** The vector's part perpendicular to a unit axis. */
  export function reject(a: V3, axis: V3): V3 {
    return sub(a, scale(axis, dot(a, axis)));
  }

  /** Perimeter of the convex hull of planar points (Andrew's monotone chain). */
  export function hull(points: [number, number][]): number {
    const p: [number, number][] = [...points].sort((a: [number, number], b: [number, number]): number => a[0] - b[0] || a[1] - b[1]);
    if (p.length < 3) return 0;
    const cross2: (o: [number, number], a: [number, number], b: [number, number]) => number = (o: [number, number], a: [number, number], b: [number, number]): number =>
      (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lower: [number, number][] = [];
    for (const q of p) {
      while (lower.length >= 2 && cross2(lower[lower.length - 2]!, lower[lower.length - 1]!, q) <= 0) lower.pop();
      lower.push(q);
    }
    const upper: [number, number][] = [];
    for (let i: number = p.length - 1; i >= 0; i--) {
      const q: [number, number] = p[i]!;
      while (upper.length >= 2 && cross2(upper[upper.length - 2]!, upper[upper.length - 1]!, q) <= 0) upper.pop();
      upper.push(q);
    }
    const ring: [number, number][] = [...lower.slice(0, -1), ...upper.slice(0, -1)];
    let sum: number = 0;
    for (let i: number = 0; i < ring.length; i++) {
      const a: [number, number] = ring[i]!;
      const b: [number, number] = ring[(i + 1) % ring.length]!;
      sum += Math.hypot(b[0] - a[0], b[1] - a[1]);
    }
    return sum;
  }

  /** Exact distance from a point to a triangle (Ericson 2005, closest point by Voronoi regions). */
  export function triangleDistance(p: V3, a: V3, b: V3, c: V3): number {
    const ab: V3 = sub(b, a);
    const ac: V3 = sub(c, a);
    const ap: V3 = sub(p, a);
    const d1: number = dot(ab, ap);
    const d2: number = dot(ac, ap);
    if (d1 <= 0 && d2 <= 0) return dist(p, a);
    const bp: V3 = sub(p, b);
    const d3: number = dot(ab, bp);
    const d4: number = dot(ac, bp);
    if (d3 >= 0 && d4 <= d3) return dist(p, b);
    const vc: number = d1 * d4 - d3 * d2;
    if (vc <= 0 && d1 >= 0 && d3 <= 0) return dist(p, add(a, scale(ab, d1 / (d1 - d3))));
    const cp: V3 = sub(p, c);
    const d5: number = dot(ab, cp);
    const d6: number = dot(ac, cp);
    if (d6 >= 0 && d5 <= d6) return dist(p, c);
    const vb: number = d5 * d2 - d1 * d6;
    if (vb <= 0 && d2 >= 0 && d6 <= 0) return dist(p, add(a, scale(ac, d2 / (d2 - d6))));
    const va: number = d3 * d6 - d5 * d4;
    if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) return dist(p, add(b, scale(sub(c, b), (d4 - d3) / (d4 - d3 + (d5 - d6)))));
    const denom: number = 1 / (va + vb + vc);
    return dist(p, add(a, add(scale(ab, vb * denom), scale(ac, vc * denom))));
  }

  /** Rotate a vector by a unit quaternion `[x, y, z, w]`. */
  export function rotate(q: number[], v: V3): V3 {
    const x: number = q[0]!;
    const y: number = q[1]!;
    const z: number = q[2]!;
    const w: number = q[3]!;
    const t: V3 = [2 * (y * v[2] - z * v[1]), 2 * (z * v[0] - x * v[2]), 2 * (x * v[1] - y * v[0])];
    return [v[0] + w * t[0] + (y * t[2] - z * t[1]), v[1] + w * t[1] + (z * t[0] - x * t[2]), v[2] + w * t[2] + (x * t[1] - y * t[0])];
  }
}
