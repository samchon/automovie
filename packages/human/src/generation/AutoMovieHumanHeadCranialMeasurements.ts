/** Independent polygonal observations of actual emitted cranial geometry. */
export namespace AutoMovieHumanHeadCranialMeasurements {
  /** Physical local forward/lateral coordinates. */
  export type Point = [number, number];
  /** Polygon measurements; no constructor parameters or solved keys enter. */
  export interface Measures {
    /** Actual forward range. */
    length: number;
    /** Actual lateral range. */
    breadth: number;
    /** Taut convex-hull tape length. */
    circumference: number;
    /** Lowest measured signed turn, positive for a convex ordered course. */
    minimumTurn: number;
  }
  /** Read a closed sampled skin course, tolerating an optionally repeated end. */
  export function read(points: readonly Point[]): Measures {
    const unique: Point[] = points.filter((p: Point, i: number): boolean => i === 0 || Math.hypot(p[0] - points[i - 1]![0], p[1] - points[i - 1]![1]) > 1e-10);
    if (unique.length > 1 && Math.hypot(unique[0]![0] - unique[unique.length - 1]![0], unique[0]![1] - unique[unique.length - 1]![1]) < 1e-10) unique.pop();
    const sorted: Point[] = [...unique].sort((a: Point, b: Point): number => a[0] - b[0] || a[1] - b[1]);
    const turn = (a: Point, b: Point, c: Point): number => (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
    const lower: Point[] = [];
    const upper: Point[] = [];
    for (const p of sorted) {
      while (lower.length > 1 && turn(lower[lower.length - 2]!, lower[lower.length - 1]!, p) <= 0) lower.pop();
      lower.push(p);
    }
    for (const p of [...sorted].reverse()) {
      while (upper.length > 1 && turn(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 0) upper.pop();
      upper.push(p);
    }
    const hull: Point[] = [...lower.slice(0, -1), ...upper.slice(0, -1)];
    return {
      length: Math.max(...unique.map((p: Point): number => p[0])) - Math.min(...unique.map((p: Point): number => p[0])),
      breadth: Math.max(...unique.map((p: Point): number => p[1])) - Math.min(...unique.map((p: Point): number => p[1])),
      circumference: hull.reduce((sum: number, p: Point, i: number): number => sum + Math.hypot(p[0] - hull[(i + 1) % hull.length]![0], p[1] - hull[(i + 1) % hull.length]![1]), 0),
      minimumTurn: Math.min(...unique.map((p: Point, i: number): number => turn(p, unique[(i + 1) % unique.length]!, unique[(i + 2) % unique.length]!))),
    };
  }
}
