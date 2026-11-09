import type { AutoMovieLoftFrame, AutoMovieViewAxis } from "@automovie/engine";
import type { AutoMovieConstructionOutlineParameter } from "@automovie/interface";

type Vec3 = [number, number, number];

/**
 * S00's section planes: level below the neck, turning smoothly over the neck
 * so the last plane is the neck-base plane, the plane through C7 and IJ that
 * holds the lateral axis (the ISO 8559-1 5.3.3 neck-base loop over C7, the
 * side neck points and IJ, taken planar: its girth's circle lies in it).
 *
 * The course is the planes' origin: a vertical line at `X = xs` (station =
 * height) up to the turn's start `yt`, then over a length `L` its direction
 * turns forward by the plane's tilt `theta` with the quintic smoothstep
 * `alpha(t) = theta (10 t^3 - 15 t^4 + 6 t^5)`, `t = (s - yt) / L`, so the
 * course and the planes are C2 (curvature zero at both ends of the turn).
 * Each plane is normal to the course: `w = (sin a, cos a, 0)`, chart `u =
 * (cos a, -sin a, 0)` (anterior), `v = +Z` (right). The course ends at the
 * neck-base centre, the midpoint of C7 and IJ, with `w` the plane's normal.
 *
 * `L` keeps the planes from crossing within the sections: the turn's peak
 * curvature `1.875 theta / L` times the section's largest offset on the
 * inner (anterior) side stays at most 0.8, the bound the arm's joint turns
 * use. The course's end position then fixes `xs = Xn - L A` and `yt = Yn - L
 * B`, with `A`, `B` the mean of `sin alpha` and `cos alpha` over the turn, by
 * eight-point Gauss-Legendre quadrature on four sub-intervals (the integrand
 * is analytic, so the error is far below a micrometre).
 */
export namespace AutoMovieHumanTrunkNeckTurn {
  /** The planes and their numbers. */
  export interface IOutput {
    /** The engine axis (frame and analytic jet at any station). */
    axis: AutoMovieViewAxis.IAxis;

    /** X of the vertical course below the turn, world mm. */
    xs: number;

    /** Station (= height) where the turn starts, mm. */
    start: number;

    /** The turn's length along the course, mm. */
    length: number;

    /** The top station, at the neck-base plane, mm. */
    top: number;

    /** The neck-base plane's tilt forward from level, radians. */
    theta: number;

    /** The neck-base centre (course end), world mm. */
    centre: Vec3;

    /** Plane origin and axes at a station. */
    frame(station: number): AutoMovieLoftFrame.IFrame;

    /** The station whose plane origin stands at a world height (the lateral guides' height there). */
    station(height: number): number;

    /** The origin's rise per mm of station there, `cos(alpha)`. */
    rise(station: number): number;

    /** The bottom turn ({@link floor}), when the planes turn into a tilted open bottom; absent, the bottom is level. */
    floor?: IFloor;
  }

  /** The bottom turn's numbers. */
  export interface IFloor {
    /** The bottom plane's station (the open end), mm of course arclength. */
    station: number;

    /** The station where the planes are level again (the turn's upper end, station = height above it), mm. */
    level: number;

    /** The turn's length along the course, mm. */
    length: number;

    /** The bottom plane's tilt from level, radians (front down). */
    theta: number;

    /** The bottom plane's origin, world mm. */
    origin: Vec3;
  }

  /** Peak-curvature bound times the inner offset (the arm's joint turns use the same 0.8). */
  export const REGULARITY: number = 0.8;

  /** Build the planes from C7, IJ and the largest anterior offset in the turn (mm). */
  export function create(c7: Vec3, ij: Vec3, inner: number): IOutput {
    // The C7-to-IJ line falls forward by theta below the horizontal; the plane
    // holding it and the lateral axis has its normal tilted forward by theta.
    const theta: number = Math.atan2(c7[1] - ij[1], ij[0] - c7[0]);
    const centre: Vec3 = [(c7[0] + ij[0]) / 2, (c7[1] + ij[1]) / 2, 0];
    const length: number = (1.875 * theta * inner) / REGULARITY;
    const [A, B]: [number, number] = means(theta);
    const xs: number = centre[0] - length * A;
    const start: number = centre[1] - length * B;
    const top: number = start + length;
    const alpha: (s: number) => [number, number, number] = (s: number): [number, number, number] => {
      if (s <= start) return [0, 0, 0];
      const t: number = Math.min(1, (s - start) / length);
      if (s >= top) return [theta, 0, 0];
      return [theta * (10 * t ** 3 - 15 * t ** 4 + 6 * t ** 5), (theta * (30 * t ** 2 - 60 * t ** 3 + 30 * t ** 4)) / length, (theta * (60 * t - 180 * t ** 2 + 120 * t ** 3)) / (length * length)];
    };
    const origin: (s: number) => Vec3 = (s: number): Vec3 => {
      if (s <= start) return [xs, s, 0];
      const [sx, cy]: [number, number] = integral(theta, length, Math.min(s, top) - start);
      const base: Vec3 = [xs + sx, start + cy, 0];
      if (s <= top) return base;
      return [base[0] + Math.sin(theta) * (s - top), base[1] + Math.cos(theta) * (s - top), 0];
    };
    const frame: (s: number) => AutoMovieLoftFrame.IFrame = (s: number): AutoMovieLoftFrame.IFrame => {
      const a: number = alpha(s)[0];
      return { origin: origin(s), u: [Math.cos(a), -Math.sin(a), 0], v: [0, 0, 1] };
    };
    const axis: AutoMovieViewAxis.IAxis = {
      at: frame,
      jet: (s: number, parameter?: AutoMovieConstructionOutlineParameter): { value: AutoMovieLoftFrame.IFrame; first: AutoMovieLoftFrame.IFrame; second: AutoMovieLoftFrame.IFrame } | null => {
        if (parameter !== undefined) return null;
        const [a, a1, a2]: [number, number, number] = alpha(s);
        const sin: number = Math.sin(a);
        const cos: number = Math.cos(a);
        return {
          value: frame(s),
          first: { origin: [sin, cos, 0], u: [-sin * a1, -cos * a1, 0], v: [0, 0, 0] },
          second: { origin: [cos * a1, -sin * a1, 0], u: [-sin * a2 - cos * a1 * a1, -cos * a2 + sin * a1 * a1, 0], v: [0, 0, 0] },
        };
      },
    };
    // Height to station: the origin's height rises monotonically (cos alpha > 0).
    const station: (height: number) => number = (height: number): number => {
      if (height <= start) return height;
      let lo: number = start;
      let hi: number = top + (height - centre[1]) / Math.cos(theta) + 1;
      for (let k: number = 0; k < 60; ++k) {
        const mid: number = (lo + hi) / 2;
        if (origin(mid)[1] < height) lo = mid;
        else hi = mid;
      }
      return (lo + hi) / 2;
    };
    return { axis, xs, start, length, top, theta, centre, frame, station, rise: (s: number): number => Math.cos(alpha(s)[0]) };
  }

  /**
   * Level planes all the way up (no turn): a vertical course at `X = xs`,
   * station = height, ending level at `top`. S00 uses this: the planar
   * C7-IJ end was tried and crushes the shoulder line (the ISO neck-base loop
   * is a saddle, its side neck points 34 mm above that plane).
   */
  export function level(xs: number, top: number): IOutput {
    const frame: (s: number) => AutoMovieLoftFrame.IFrame = (s: number): AutoMovieLoftFrame.IFrame => ({ origin: [xs, s, 0], u: [1, 0, 0], v: [0, 0, 1] });
    const axis: AutoMovieViewAxis.IAxis = {
      at: frame,
      jet: (s: number, parameter?: AutoMovieConstructionOutlineParameter): { value: AutoMovieLoftFrame.IFrame; first: AutoMovieLoftFrame.IFrame; second: AutoMovieLoftFrame.IFrame } | null =>
        parameter !== undefined
          ? null
          : { value: frame(s), first: { origin: [0, 1, 0], u: [0, 0, 0], v: [0, 0, 0] }, second: { origin: [0, 0, 0], u: [0, 0, 0], v: [0, 0, 0] } },
    };
    return { axis, xs, start: top, length: 0, top, theta: 0, centre: [xs, top, 0], frame, station: (height: number): number => height, rise: (): number => 1 };
  }

  /** A lower band of the course: from `from` to `to` (at most the upper band's start) it moves by the quintic smoothstep to `x`, and holds `x` up to the upper band. */
  export interface IVia {
    /** The course's X the band ends at, mm. */
    x: number;

    /** The band's lower height, mm. */
    from: number;

    /** The band's upper height, mm. */
    to: number;
  }

  /**
   * The course's X with its first two derivatives in height for
   * {@link shifted}: `xs0` up to `from`, then the quintic smoothstep (zero
   * slope and curvature at both ends) to `xs1` at `top`; with `via`, first
   * the same smoothstep from `xs0` to `via.x` over `[via.from, via.to]`, held
   * up to `from`. Every band ends with zero slope and curvature, so the
   * course stays C2 across them.
   */
  export function course(xs0: number, xs1: number, from: number, top: number, via?: IVia): (s: number) => [number, number, number] {
    const step: (a: number, b: number, y0: number, y1: number) => (s: number) => [number, number, number] =
      (a: number, b: number, y0: number, y1: number): ((s: number) => [number, number, number]) =>
      (s: number): [number, number, number] => {
        if (!(s > y0)) return [a, 0, 0];
        if (!(s < y1)) return [b, 0, 0];
        const L: number = y1 - y0;
        const t: number = (s - y0) / L;
        const d: number = b - a;
        return [a + d * (10 * t ** 3 - 15 * t ** 4 + 6 * t ** 5), (d * (30 * t ** 2 - 60 * t ** 3 + 30 * t ** 4)) / L, (d * (60 * t - 180 * t ** 2 + 120 * t ** 3)) / (L * L)];
      };
    if (via === undefined || !(via.from < via.to && via.to <= from)) return step(xs0, xs1, from, top);
    const lower: (s: number) => [number, number, number] = step(xs0, via.x, via.from, via.to);
    const upper: (s: number) => [number, number, number] = step(via.x, xs1, from, top);
    return (s: number): [number, number, number] => (s <= via.to ? lower(s) : upper(s));
  }

  /**
   * Level planes on a course that leaves the vertical at `xs0` above `from`
   * and ends at `xs1` at `top` by the quintic smoothstep ({@link course}),
   * so the planes' origins are C2 in height. S00 uses it to carry its
   * sections from the hip-centre vertical to the neck's centre above the
   * shoulder line: the side neck point lies at the neck's mid-depth in
   * profile, midway between C7 and the jugular notch. With `via`, the course
   * first moves to `via.x` over a lower band ({@link course}).
   */
  export function shifted(xs0: number, xs1: number, from: number, top: number, via?: IVia): IOutput {
    const x: (s: number) => [number, number, number] = course(xs0, xs1, from, top, via);
    const frame: (s: number) => AutoMovieLoftFrame.IFrame = (s: number): AutoMovieLoftFrame.IFrame => ({ origin: [x(s)[0], s, 0], u: [1, 0, 0], v: [0, 0, 1] });
    const axis: AutoMovieViewAxis.IAxis = {
      at: frame,
      jet: (s: number, parameter?: AutoMovieConstructionOutlineParameter): { value: AutoMovieLoftFrame.IFrame; first: AutoMovieLoftFrame.IFrame; second: AutoMovieLoftFrame.IFrame } | null => {
        if (parameter !== undefined) return null;
        const [, x1, x2] = x(s);
        return { value: frame(s), first: { origin: [x1, 1, 0], u: [0, 0, 0], v: [0, 0, 0] }, second: { origin: [x2, 0, 0], u: [0, 0, 0], v: [0, 0, 0] } };
      },
    };
    return { axis, xs: xs0, start: from, length: top - from, top, theta: 0, centre: [xs1, top, 0], frame, station: (height: number): number => height, rise: (): number => 1 };
  }

  /**
   * A bottom turn under level planes: the open bottom becomes the plane
   * through two given points (front and back, world mm, in the median
   * plane) holding the lateral axis, tilted front down by `theta = atan2(back
   * y - front y, front x - back x)`; going up the course, the planes turn
   * level by the quintic smoothstep over `L` (the neck turn's law, mirrored:
   * `alpha = theta S(tau / L)`, `tau` the course arclength down from the
   * turn's upper end), and above that they are `base`'s, which must be level
   * on a vertical course there. `L` keeps the planes from crossing within the
   * sections: the course bends backward going up, so the inner side is the
   * posterior one, and the peak curvature `1.875 theta / L` times its largest
   * offset `inner` stays at most {@link REGULARITY}. The turn's upper end
   * `s1` is the station whose turn ends exactly on the line through the two
   * points: with `A`, `B` the means of `sin alpha` and `cos alpha` over the
   * turn, the bottom origin `(xs - L A, s1 - L B)` lies on it. Stations stay
   * the course's arclength, so the bottom station is `s1 - L`, below its
   * origin's height.
   */
  export function floor(base: IOutput, front: Vec3, back: Vec3, inner: number): IOutput {
    const theta: number = Math.atan2(back[1] - front[1], front[0] - back[0]);
    const length: number = (1.875 * theta * inner) / REGULARITY;
    const [A, B]: [number, number] = means(theta);
    const m: number = (back[1] - front[1]) / (back[0] - front[0]);
    const xs: number = base.xs;
    const level: number = length * B + front[1] + m * (xs - length * A - front[0]);
    const bottom: number = level - length;
    // tau = level - s, alpha = theta S(tau / L): its derivatives in s carry the minus sign of d tau / ds.
    const alpha = (s: number): [number, number, number] => {
      const tau: number = Math.min(length, Math.max(0, level - s));
      const t: number = tau / length;
      return [theta * (10 * t ** 3 - 15 * t ** 4 + 6 * t ** 5), (-theta * (30 * t ** 2 - 60 * t ** 3 + 30 * t ** 4)) / length, (theta * (60 * t - 180 * t ** 2 + 120 * t ** 3)) / (length * length)];
    };
    const origin = (s: number): Vec3 => {
      const tau: number = Math.min(length, level - s);
      const [sx, cy]: [number, number] = integral(theta, length, tau);
      const base0: Vec3 = [xs - sx, level - cy, 0];
      if (s >= bottom) return base0;
      // Below the bottom plane (outside the part): straight on along the bottom's normal.
      return [base0[0] - Math.sin(theta) * (bottom - s), base0[1] - Math.cos(theta) * (bottom - s), 0];
    };
    const frame = (s: number): AutoMovieLoftFrame.IFrame => {
      if (s >= level) return base.frame(s);
      const a: number = alpha(s)[0];
      return { origin: origin(s), u: [Math.cos(a), -Math.sin(a), 0], v: [0, 0, 1] };
    };
    const axis: AutoMovieViewAxis.IAxis = {
      at: frame,
      jet: (s: number, parameter?: AutoMovieConstructionOutlineParameter): { value: AutoMovieLoftFrame.IFrame; first: AutoMovieLoftFrame.IFrame; second: AutoMovieLoftFrame.IFrame } | null => {
        if (s >= level) return base.axis.jet?.(s, parameter) ?? null;
        if (parameter !== undefined) return null;
        const [a, a1, a2]: [number, number, number] = alpha(s);
        const sin: number = Math.sin(a);
        const cos: number = Math.cos(a);
        return {
          value: frame(s),
          first: { origin: [sin, cos, 0], u: [-sin * a1, -cos * a1, 0], v: [0, 0, 0] },
          second: { origin: [cos * a1, -sin * a1, 0], u: [-sin * a2 - cos * a1 * a1, -cos * a2 + sin * a1 * a1, 0], v: [0, 0, 0] },
        };
      },
    };
    // Height to station: the origin's height rises monotonically (cos alpha > 0).
    const station = (height: number): number => {
      if (height >= level) return base.station(height);
      let lo: number = bottom - 400;
      let hi: number = level;
      for (let k: number = 0; k < 60; ++k) {
        const mid: number = (lo + hi) / 2;
        if (origin(mid)[1] < height) lo = mid;
        else hi = mid;
      }
      return (lo + hi) / 2;
    };
    return {
      ...base,
      axis,
      frame,
      station,
      rise: (s: number): number => (s >= level ? base.rise(s) : Math.cos(alpha(s)[0])),
      floor: { station: bottom, level, length, theta, origin: origin(bottom) },
    };
  }

  /** Means of sin and cos of the turn angle over the turn. */
  function means(theta: number): [number, number] {
    const [sx, cy]: [number, number] = integral(theta, 1, 1);
    return [sx, cy];
  }

  /** Integrals of (sin alpha, cos alpha) from the turn's start over `s` of a turn of length `length`. */
  function integral(theta: number, length: number, s: number): [number, number] {
    let sx: number = 0;
    let cy: number = 0;
    const parts: number = 4;
    const h: number = s / parts;
    for (let i: number = 0; i < parts; ++i)
      for (let g: number = 0; g < 8; ++g) {
        const tau: number = h * (i + (NODES[g]! + 1) / 2);
        const t: number = tau / length;
        const a: number = theta * (10 * t ** 3 - 15 * t ** 4 + 6 * t ** 5);
        sx += (h / 2) * WEIGHTS[g]! * Math.sin(a);
        cy += (h / 2) * WEIGHTS[g]! * Math.cos(a);
      }
    return [sx, cy];
  }

  /** Eight-point Gauss-Legendre nodes on [-1, 1]. */
  const NODES: readonly number[] = [-0.9602898564975363, -0.7966664774136267, -0.525532409916329, -0.1834346424956498, 0.1834346424956498, 0.525532409916329, 0.7966664774136267, 0.9602898564975363];

  /** Eight-point Gauss-Legendre weights. */
  const WEIGHTS: readonly number[] = [0.1012285362903763, 0.2223810344533745, 0.3137066458778873, 0.362683783378362, 0.362683783378362, 0.3137066458778873, 0.2223810344533745, 0.1012285362903763];
}
