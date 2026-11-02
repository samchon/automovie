import type { AutoMovieHumanTapeProfile } from "./AutoMovieHumanTapeProfile";

/** Taut sections and positive, constraint-preserving trunk dimensions. */
export namespace AutoMovieHumanTrunkTapes {
  /** Forward and lateral section coordinates in millimetres. */
  export type Point = readonly [number, number];

  /** Physical station and its requested taut circumference. */
  export type IKey = AutoMovieHumanTapeProfile.IKey;

  /**
   * A whole torso section from its front-to-back left half outline.
   * The closed half alone is a thigh's crotch loop, whose midline chord is
   * part of its tape; a torso tape instead wraps both reflected halves.
   */
  export function mirror(half: readonly Point[]): Point[] {
    return [...half, ...half.map((p: Point): Point => [p[0], -p[1]])];
  }

  /** Convex-hull perimeter, including the closure across a section's hollows. */
  export function perimeter(points: readonly Point[]): number {
    const sorted: Point[] = [...points].sort(
      (a: Point, b: Point): number => a[0] - b[0] || a[1] - b[1],
    );
    const half: (values: readonly Point[]) => Point[] = (
      values: readonly Point[],
    ): Point[] => {
      const result: Point[] = [];
      for (const p of values) {
        while (
          result.length > 1 &&
          turn(result[result.length - 2]!, result[result.length - 1]!, p) <= 0
        ) result.pop();
        result.push(p);
      }
      result.pop();
      return result;
    };
    const hull: Point[] = [...half(sorted), ...half([...sorted].reverse())];
    return hull.reduce((sum: number, p: Point, i: number): number => {
      const q: Point = hull[(i + 1) % hull.length]!;
      return sum + Math.hypot(p[0] - q[0], p[1] - q[1]);
    }, 0);
  }

  /**
   * Positive monotone C2 tape law with horizontal tangents only at extrema.
   * A monotone quintic Bernstein polygon preserves each key and cannot add a
   * belly. The high-hip and underbust keys retain progress instead of making
   * every named tape a flat place on the trunk. Second derivatives vanish at
   * keys; harmonic first derivatives are bounded by the two adjacent secants.
   */
  export function girth(keys: readonly IKey[], station: number): number {
    if (keys.length === 0) throw new Error("A trunk tape law needs a key");
    if (station <= keys[0]!.station) return keys[0]!.girth;
    const secant: (i: number) => number = (i: number): number => (keys[i + 1]!.girth - keys[i]!.girth) / (keys[i + 1]!.station - keys[i]!.station);
    const slope: (i: number) => number = (i: number): number => {
      if (i === 0 || i === keys.length - 1) return 0;
      const a: number = secant(i - 1);
      const b: number = secant(i);
      if (a * b <= 0) return 0;

      // The two inner Bernstein handles must stay ordered: each slope is at
      // most 5/4 of the interval's secant, so their sum is at most 5/2 of it.
      return Math.sign(a) * Math.min(2 * Math.abs(a * b / (a + b)), (5 / 4) * Math.min(Math.abs(a), Math.abs(b)));
    };
    for (let i: number = 1; i < keys.length; i++) {
      const b: IKey = keys[i]!;
      if (station > b.station) continue;
      const a: IKey = keys[i - 1]!;
      const h: number = b.station - a.station;
      const t: number = (station - a.station) / h;
      const u: number = 1 - t;
      const first: number = h * slope(i - 1) / 5;
      const last: number = h * slope(i) / 5;
      return a.girth * u ** 5 + 5 * (a.girth + first) * u ** 4 * t + 10 * (a.girth + 2 * first) * u ** 3 * t ** 2 + 10 * (b.girth - 2 * last) * u ** 2 * t ** 3 + 5 * (b.girth - last) * u * t ** 4 + b.girth * t ** 5;
    }
    return keys[keys.length - 1]!.girth;
  }

  /**
   * Close a finished section whose width and depth share one positive scale.
   * Features can have their own physical size, so homogeneity is not assumed.
   * The bracket expands before bisection rather than silently clipping a tape.
   */
  export function scale(target: number, outline: (scale: number) => readonly Point[]): number {
    if (!(target > 0 && Number.isFinite(target)))
      throw new Error("A trunk tape must be finite and positive");
    let low: number = 0;
    let high: number = 1;
    for (let k: number = 0; perimeter(outline(high)) < target; k++) {
      if (k === 32) throw new Error("Trunk tape has no finite scale bracket");
      high *= 2;
    }
    for (let k: number = 0; k < 28; k++) {
      const mid: number = (low + high) / 2;
      if (perimeter(outline(mid)) < target) low = mid;
      else high = mid;
    }
    return (low + high) / 2;
  }
}

/** Signed turn for the monotone-chain convex hull. */
function turn(a: AutoMovieHumanTrunkTapes.Point, b: AutoMovieHumanTrunkTapes.Point, c: AutoMovieHumanTrunkTapes.Point): number {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}
