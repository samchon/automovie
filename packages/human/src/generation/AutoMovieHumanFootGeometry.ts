import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanFootGeometry,
} from "@automovie/interface";

/**
 * Vector and scalar helpers the foot's pieces share, so no piece carries its
 * own copy: points and directions in millimetres, the left foot's frame.
 */
export namespace AutoMovieHumanFootGeometry {
  /** A whole turn. */
  export const TWO_PI: number = 2 * Math.PI;

  /** A phase in [0, 2pi). */
  export function wrap(t: number): number {
    return ((t % TWO_PI) + TWO_PI) % TWO_PI;
  }

  /** A point on a side: z turned over on the right. */
  export function sided(
    p: Readonly<AutoMovieVector3Tuple>,
    sign: 1 | -1,
  ): AutoMovieVector3Tuple {
    return [p[0], p[1], sign * p[2]];
  }

  /** Smooth minimum with softness k. */
  export function softMin(a: number, b: number, k: number): number {
    const m: number = Math.min(a, b);
    return m - k * Math.log(Math.exp((m - a) / k) + Math.exp((m - b) / k));
  }

  /** Smoothstep on [0, 1], clamped. */
  export function smooth(x: number): number {
    const t: number = Math.min(1, Math.max(0, x));
    return t * t * (3 - 2 * t);
  }

  /** Distance from a point to a segment. */
  export function segmentDistance(
    p: AutoMovieVector3Tuple,
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
  ): number {
    const ab: AutoMovieVector3Tuple = sub(b, a);
    const f: number = Math.min(
      1,
      Math.max(0, dot(sub(p, a), ab) / dot(ab, ab)),
    );
    return Math.hypot(...sub(p, plus(a, scale(ab, f))));
  }

  /** `a + (b - a) f`. */
  export function lerp(
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
    f: number,
  ): AutoMovieVector3Tuple {
    return [
      a[0] + (b[0] - a[0]) * f,
      a[1] + (b[1] - a[1]) * f,
      a[2] + (b[2] - a[2]) * f,
    ];
  }

  /** `a + b`. */
  export function plus(
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
  ): AutoMovieVector3Tuple {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  }

  /** `a - b`. */
  export function sub(
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
  ): AutoMovieVector3Tuple {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  /** `a s`. */
  export function scale(
    a: AutoMovieVector3Tuple,
    s: number,
  ): AutoMovieVector3Tuple {
    return [a[0] * s, a[1] * s, a[2] * s];
  }

  /** Dot product. */
  export function dot(
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
  ): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  /** Cross product. */
  export function cross(
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
  ): AutoMovieVector3Tuple {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  }

  /** Unit vector; zero stays zero. */
  export function unit(a: AutoMovieVector3Tuple): AutoMovieVector3Tuple {
    return scale(a, 1 / (Math.hypot(a[0], a[1], a[2]) || 1));
  }

  /**
   * The least length in `[from, to]` where a condition, false before and true
   * after, first holds: a scan of {@link ROOT_SCAN} intervals brackets it and
   * bisection closes the bracket, so the answer moves continuously with the
   * inputs (a search stepped to a grid flips with them).
   *
   * @param holds The condition.
   * @param from Start of the range.
   * @param to End of the range.
   * @param fallback The answer when it never holds.
   */
  export function root(
    holds: IAutoMovieHumanFootGeometry.RootHolds,
    from: number,
    to: number,
    fallback: number,
  ): number {
    if (holds(from)) return from;
    let lo: number = from;
    let hi: number = Number.NaN;
    for (let i: number = 1; i <= ROOT_SCAN; i++) {
      const s: number = from + ((to - from) * i) / ROOT_SCAN;
      if (holds(s)) {
        hi = s;
        break;
      }
      lo = s;
    }
    if (Number.isNaN(hi)) return fallback;
    for (let i: number = 0; i < ROOT_BISECTIONS; i++) {
      const m: number = 0.5 * (lo + hi);
      if (holds(m)) hi = m;
      else lo = m;
    }

    return hi;
  }
}

/*
 * Intervals of a root's bracketing scan.
 */
const ROOT_SCAN: number = 64;

/*
 * Bisections that close a root's bracket.
 */
const ROOT_BISECTIONS: number = 40;
