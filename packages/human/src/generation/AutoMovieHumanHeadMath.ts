import { AutoMovieHumanSeam } from "../lofting/AutoMovieHumanSeam";
import type { IAutoMovieHumanHeadJet } from "./IAutoMovieHumanHeadJet";

/**
 * Shared mathematics of the head's pieces: the bells, the quintic smoothstep
 * and the cubic smooth maximum and minimum whose blends are C2, the Lame gauge
 * of a super-ellipse, the quintic hand-over between two owners' jets, and the
 * ray march that finds a convex body's outline. Every function is pure and
 * works in calibration millimetres unless it says otherwise.
 */
export namespace AutoMovieHumanHeadMath {
  /**
   * Share of a vault measure at a height: an ellipse over its centre's height,
   * continued under it by the parabola of the same curvature, so the share is C2
   * there, and held at a floor.
   */
  export function crownShare(
    y: number,
    centre: number,
    top: number,
    floor: number = -Infinity,
  ): number {
    const u: number = (y - centre) / Math.max(1e-6, top);
    if (u >= 0) return Math.sqrt(Math.max(0, 1 - u * u));
    return Math.max(floor, 1 - (u * u) / 2);
  }

  /**
   * Outermost root of `h(r) = 1` along a ray, for `h` the convex gauge of a
   * convex body: one bisection when the ray starts inside, else from the body's
   * nearest approach; nothing when the ray misses it.
   */
  export function outermost(h: (r: number) => number, reach: number): number {
    let lo: number = 0;
    let fl: number = h(0) - 1;
    if (!(fl < 0)) {
      // Golden-section search of the convex gauge's least value, stopped at
      // the first point inside the body: along a ray a convex body is one
      // interval, so every inside point leads to the same outer root.
      let a: number = 0;
      let b: number = reach;
      let inside: boolean = false;
      for (let i: number = 0; i < 40 && !inside; i++) {
        const c: number = b - 0.618034 * (b - a);
        const d: number = a + 0.618034 * (b - a);
        const hc: number = h(c);
        const hd: number = h(d);
        if (hc < 1 || hd < 1) {
          lo = hc <= hd ? c : d;
          fl = Math.min(hc, hd) - 1;
          inside = true;
        } else if (hc < hd) b = d;
        else a = c;
      }
      if (!inside) {
        lo = (a + b) / 2;
        fl = h(lo) - 1;
        if (!(fl < 0)) return 0;
      }
    }
    let hi: number = Math.max(lo + 1, reach);
    let fh: number = h(hi) - 1;
    while (fh < 0) {
      hi *= 2;
      fh = h(hi) - 1;
    }
    // The crossing by the Illinois rule (regula falsi halving the stale end's
    // value), the inside end returned as before, to 1e-10 mm.
    let side: number = 0;
    for (let i: number = 0; i < 100 && hi - lo > 1e-10; i++) {
      const m: number = (lo * fh - hi * fl) / (fh - fl);
      const fm: number = h(m) - 1;
      if (fm < 0) {
        lo = m;
        fl = fm;
        if (side === -1) fh /= 2;
        side = -1;
      } else {
        hi = m;
        fh = fm;
        if (side === 1) fl /= 2;
        side = 1;
      }
    }
    return lo;
  }

  /** A jet standing still: a landmark where its contour is level. */
  export function flat(value: number): IAutoMovieHumanHeadJet {
    return { value, slope: 0, curvature: 0 };
  }

  /**
   * A contour piece between two landmarks' heights `a` and `b`, joined to its
   * neighbours with the jets their owners give: the quintic Hermite span, C2 at
   * both ends, held at the ends' values beyond them.
   */
  export function joined(lo: IAutoMovieHumanHeadJet, hi: IAutoMovieHumanHeadJet, a: number, b: number, y: number): number {
    return AutoMovieHumanSeam.quintic(
      [[lo.value], [lo.slope], [lo.curvature]],
      [[hi.value], [hi.slope], [hi.curvature]],
      b - a,
      (y - a) / (b - a),
    )[0]!;
  }

  /**
   * Cubic smooth maximum over an absolute width: C2, since its correction
   * `w h^3 / 6` meets the plain maximum with zero slope and curvature where the
   * two differ by the width. The quadratic one is only C1, a line in the skin
   * at both edges of its blend.
   */
  export function softMax(a: number, b: number, width: number): number {
    const h: number = Math.max(width - Math.abs(a - b), 0) / width;
    return Math.max(a, b) + (h * h * h * width) / 6;
  }

  /** Lame field of a unit super-ellipse. */
  export function lame(a: number, b: number, n: number): number {
    return (Math.abs(a) ** n + Math.abs(b) ** n) ** (1 / n);
  }

  /** A flat-topped bell of unit height. */
  export function bell4(x: number): number {
    return Math.exp(-(x ** 4));
  }

  /** A bell of unit height. */
  export function bell(x: number): number {
    return Math.exp(-x * x);
  }

  /** A two-dimensional bell of unit height. */
  export function bell2(x: number, y: number): number {
    return Math.exp(-x * x - y * y);
  }

  /**
   * Quintic smoothstep clamped to [0, 1]: level in slope and curvature at both
   * ends, so a hand-over weighted by it is C2. The cubic smoothstep's curvature
   * steps by 6 at its ends, a line in the skin at both heights of every
   * hand-over it weighed.
   */
  export function smooth(x: number): number {
    const t: number = Math.min(1, Math.max(0, x));
    return t * t * t * (t * (6 * t - 15) + 10);
  }

  /**
   * Signed distance of the intersection of two regions given by signed
   * distances, its edge rounded at a radius: exact for two planes.
   */
  export function rounded(a: number, b: number, r: number): number {
    return (
      Math.min(-r, Math.max(a, b)) +
      Math.hypot(Math.max(a + r, 0), Math.max(b + r, 0))
    );
  }

  /** Cubic smooth minimum over an absolute width, C2 as {@link softMax}. */
  export function softMin(a: number, b: number, width: number): number {
    const h: number = Math.max(width - Math.abs(a - b), 0) / width;
    return Math.min(a, b) - (h * h * h * width) / 6;
  }

  /** Mean of a list. */
  export function mean(v: readonly number[]): number {
    return v.reduce((s: number, x: number): number => s + x, 0) / v.length;
  }

  /** Distance. */
  export function dist(a: Vec3, b: Vec3): number {
    return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  }

  /** Between two points. */
  export function mix(a: P2, b: P2, f: number): P2 {
    return [a[0] + f * (b[0] - a[0]), a[1] + f * (b[1] - a[1])];
  }

  /** Mean of a loop's points. */
  export function centroid(loop: readonly P2[]): P2 {
    return [
      mean(loop.map((p: P2): number => p[0])),
      mean(loop.map((p: P2): number => p[1])),
    ];
  }

  /** Difference. */
  export function sub(a: Vec3, b: Vec3): Vec3 {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  /**
   * Stations from `a` to `b`, `n` of them at uniform spacing, both ends
   * included: the layers of a span whose pitch is the same everywhere.
   *
   * @param a First station, millimetres.
   * @param b Last station, millimetres.
   * @param n Number of stations, at least 2.
   * @returns The stations, `a` first.
   */
  export function uniform(a: number, b: number, n: number): number[] {
    return Array.from(
      { length: n },
      (_: unknown, i: number): number => a + ((b - a) * i) / (n - 1),
    );
  }

  /** A section point on a side at a height. */
  export function lifted(p: P2, y: number, sign: 1 | -1): [number, number, number] {
    return [p[0], y, sign * p[1]];
  }
}

/** A point. */
type Vec3 = [number, number, number];

/** A point of a section. */
type P2 = [number, number];
