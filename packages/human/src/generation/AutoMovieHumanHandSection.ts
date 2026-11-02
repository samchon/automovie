import type { AutoMovieHumanHandSectionSolve } from "./AutoMovieHumanHandSectionSolve";

/** Knuckle breadth and tape on the same triangulated palm section. */
export namespace AutoMovieHumanHandSection {
  /** A world-space point, in millimetres. */
  export type Point = readonly [number, number, number];

  /**
   * Cut mapped palm ring strips by the metacarpale II/V plane and read both
   * measures there. Each strip uses two linear triangles; diagonal crossings
   * matter when adjacent rings are not coplanar. Callers passing spline control
   * rings must still cross-check the independently tessellated final skin.
   */
  export function measure(
    rings: readonly (readonly Point[])[],
    origin: Point,
    normal: Point,
    across: Point,
  ): AutoMovieHumanHandSectionSolve.IMeasures {
    const normalLength: number = Math.hypot(...normal);
    const acrossLength: number = Math.hypot(...across);
    if (!(normalLength > 0 && acrossLength > 0)) throw new Error("A hand section needs two nonzero axes");
    const n: Point = [normal[0] / normalLength, normal[1] / normalLength, normal[2] / normalLength];
    const a: Point = [across[0] / acrossLength, across[1] / acrossLength, across[2] / acrossLength];
    if (Math.abs(dot(n, a)) > 1e-6) throw new Error("Hand breadth must lie in its measuring plane");
    const b: Point = [n[1] * a[2] - n[2] * a[1], n[2] * a[0] - n[0] * a[2], n[0] * a[1] - n[1] * a[0]];
    const points: [number, number][] = [];

    /** Add each edge-plane crossing in the measurement plane's orthonormal chart. */
    const edge: (p: Point, q: Point) => void = (p: Point, q: Point): void => {
      const fp: number = dot(sub(p, origin), n);
      const fq: number = dot(sub(q, origin), n);
      if (fp * fq > 0) return;
      if (fp === fq && fp !== 0) return;
      const t: number = fp === fq ? 0 : fp / (fp - fq);
      const d: Point = [p[0] + t * (q[0] - p[0]) - origin[0], p[1] + t * (q[1] - p[1]) - origin[1], p[2] + t * (q[2] - p[2]) - origin[2]];
      points.push([dot(d, a), dot(d, b)]);
      if (fp === fq) {
        const end: Point = sub(q, origin);
        points.push([dot(end, a), dot(end, b)]);
      }
    };

    for (let k: number = 1; k < rings.length; k++) {
      const previous: readonly Point[] = rings[k - 1]!;
      const current: readonly Point[] = rings[k]!;
      if (previous.length < 3 || previous.length !== current.length)
        throw new Error("Palm rings must have matching closed phase samples");
      for (let j: number = 0; j < current.length; j++) {
        const next: number = (j + 1) % current.length;
        edge(previous[j]!, current[j]!);
        edge(previous[j]!, previous[next]!);
        edge(current[j]!, current[next]!);
        edge(previous[next]!, current[j]!);
      }
    }
    if (points.length < 3) throw new Error("The knuckle plane misses the palm");
    points.sort((p: [number, number], q: [number, number]): number => p[0] - q[0] || p[1] - q[1]);

    /** A tape bridges concavities, so its perimeter belongs to the convex hull. */
    const half: (values: readonly [number, number][]) => [number, number][] = (values: readonly [number, number][]): [number, number][] => {
      const hull: [number, number][] = [];
      for (const p of values) {
        while (hull.length >= 2 && turn(hull[hull.length - 2]!, hull[hull.length - 1]!, p) <= 0) hull.pop();
        hull.push(p);
      }
      hull.pop();
      return hull;
    };
    const hull: [number, number][] = [...half(points), ...half([...points].reverse())];
    if (hull.length < 3) throw new Error("The knuckle section has no area");
    const girth: number = hull.reduce((sum: number, p: [number, number], i: number): number => {
      const q: [number, number] = hull[(i + 1) % hull.length]!;
      return sum + Math.hypot(q[0] - p[0], q[1] - p[1]);
    }, 0);
    return { breadth: points[points.length - 1]![0] - points[0]![0], girth };
  }
}

/** Dot product in the shared millimetre frame. */
function dot(a: AutoMovieHumanHandSection.Point, b: AutoMovieHumanHandSection.Point): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/** Displacement in the shared millimetre frame. */
function sub(a: AutoMovieHumanHandSection.Point, b: AutoMovieHumanHandSection.Point): AutoMovieHumanHandSection.Point {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

/** Signed turn in the measurement plane. */
function turn(a: readonly [number, number], b: readonly [number, number], c: readonly [number, number]): number {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}
