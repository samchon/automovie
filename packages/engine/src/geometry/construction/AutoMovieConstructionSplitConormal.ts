import type {
  AutoMovieVector3Tuple,
  IAutoMovieConstructionSplitBand,
  IAutoMovieConstructionSplitSeam,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

import { AutoMovieNaturalSpline as Spline } from "./AutoMovieNaturalSpline";
import { AutoMovieLoftAdmissionError } from "./AutoMovieLoftAdmissionError";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";
import { AutoMovieSplineCurve } from "./AutoMovieSplineCurve";

type Vec3 = AutoMovieVector3Tuple;
type Jet = { p: Vec3; d1: Vec3; d2: Vec3 };
type Scalar = [number, number, number];
const { combine, cross, dot, norm, scale, unit } = AutoMovieSolidVector;

/** One seam's tangent planes, shared by both incident branches. */
export namespace AutoMovieConstructionSplitConormal {
  /** The directed cross and tangent vectors at the two forks, in seam order. */
  export type Forks = readonly [
    IAutoMovieConstructionSplitSeam.IFork,
    IAutoMovieConstructionSplitSeam.IFork,
  ];

  /** Each fork inherits the actual parent's tangent plane. */
  export function forks(
    host: IAutoMovieSolidSurface,
    station: number,
    phases: [number, number],
    seam: IAutoMovieConstructionSplitSeam.ISeam,
  ): Forks | string {
    const end = (phase: number, share: number): Forks[number] | null => {
      const jet = host.jet(station, phase);
      const tangent = seam.at(share).tangent;
      const across = unit(cross(cross(jet.u, jet.v), tangent));
      return across === null
        ? null
        : {
            across: scale(across, dot(across, seam.normal) < 0 ? -1 : 1),
            tangent,
          };
    };
    const first = end(phases[0], 0);
    const last = end(phases[1], 1);
    return first === null || last === null
      ? "a fork has no regular parent tangent plane"
      : [first, last];
  }

  /** Read the exact uncorrected cross ribbon of the published cubic strip. */
  export function baseline(
    band: IAutoMovieConstructionSplitBand.IStrip,
  ): (c: number) => Jet {
    const { order, layers } = band.chain;
    const { slopes, liftSlopes } = layers[0]!;
    return (c: number): Jet => {
      const [x, z, dx, dz, ddx, ddz] = AutoMovieSplineCurve.jet(
        slopes!,
        order,
        c,
      );
      const [y, dy, ddy] = AutoMovieSplineCurve.scalarJet(
        liftSlopes!,
        order,
        c,
      );
      return { p: [x, y, z], d1: [dx, dy, dz], d2: [ddx, ddy, ddz] };
    };
  }

  /** The two branches use one co-normal direction and opposite directed gains. */
  export function prepare(input: {
    curve: IAutoMovieConstructionSplitSeam.ISeam;
    forks: Forks;
    start: number;
    end: number;
    corner: number;
    sign: 1 | -1;
    current: (clock: number) => Jet;
    columns?: number;
  }):
    | ((share: number, line: IAutoMovieConstructionSplitSeam.IPoint) => Jet)
    | string {
    const { curve, forks, start, end, corner, sign, current, columns } = input;
    const rate = 1 / (end - start);
    const width = Math.min(corner * Math.abs(rate), 0.5);
    const a = current(start).p,
      b = current(end).p;
    const ga = dot(a, forks[0].across),
      gb = dot(b, forks[1].across);
    const ta = dot(a, forks[0].tangent),
      tb = dot(b, forks[1].tangent);
    const middle = sign * norm(current((start + end) / 2).p);
    if (!(sign * ga > 0 && sign * gb > 0 && sign * middle > 0))
      return "the branch's published cross directions disagree with the owner's directed fork plane";
    /** Quintic support, expressed in the band's physical clock derivatives. */
    const ease = (share: number, direction: number): Scalar => {
      if (share >= width) return [0, 0, 0];
      const t = 1 - share / width;
      const k = (-direction * rate) / width;
      return [
        t * t * t * (10 - 15 * t + 6 * t * t),
        30 * t * t * (1 - t) * (1 - t) * k,
        60 * t * (1 - t) * (1 - 2 * t) * k * k,
      ];
    };
    const world = (
      r: Scalar,
      s: Scalar,
      base: Vec3,
      first: Vec3,
      last: Vec3,
    ): Jet => ({
      p: combine([
        [1 - r[0] - s[0], base],
        [r[0], first],
        [s[0], last],
      ]),
      d1: combine([
        [-r[1] - s[1], base],
        [r[1], first],
        [s[1], last],
      ]),
      d2: combine([
        [-r[2] - s[2], base],
        [r[2], first],
        [s[2], last],
      ]),
    });
    const scaleJet = (f: Scalar, j: Jet): Jet => ({
      p: scale(j.p, f[0]),
      d1: combine([
        [f[0], j.d1],
        [f[1], j.p],
      ]),
      d2: combine([
        [f[0], j.d2],
        [2 * f[1], j.d1],
        [f[2], j.p],
      ]),
    });
    const dotJet = (a: Jet, b: Jet): Scalar => [
      dot(a.p, b.p),
      dot(a.d1, b.p) + dot(a.p, b.d1),
      dot(a.d2, b.p) + 2 * dot(a.d1, b.d1) + dot(a.p, b.d2),
    ];
    const orthogonal = (direction: Jet, tangent: Jet): Jet => {
      const along: Jet = scaleJet(dotJet(direction, tangent), tangent);
      const transverse: Jet = {
        p: combine([[1, direction.p], [-1, along.p]]),
        d1: combine([[1, direction.d1], [-1, along.d1]]),
        d2: combine([[1, direction.d2], [-1, along.d2]]),
      };
      const [q, q1, q2]: Scalar = dotJet(transverse, transverse);
      if (!(q > 0)) throw new AutoMovieLoftAdmissionError("the shared seam has no regular transverse direction");
      const n: number = Math.sqrt(q);
      return scaleJet([1 / n, -q1 / (2 * q * n), (3 * q1 * q1 / (4 * q) - q2 / 2) / (q * n)], transverse);
    };
    const observedShares: number[] = columns === undefined ? [] : Array.from({ length: columns + 1 }, (_, k): number => k / columns);
    const observedGains: [number, number][] = [];
    for (const share of observedShares) {
      const across: Vec3 = world(ease(share, 1), ease(1 - share, -1), curve.normal, forks[0].across, forks[1].across).p;
      const along: Vec3 = curve.at(share).tangent;
      const alignment: number = dot(across, along);
      const normal: Vec3 | null = unit(combine([[1, across], [-alignment, along]]));
      const native: Vec3 = current(start + (end - start) * share).p;
      const gain: number = normal === null ? 0 : dot(native, normal);
      if (!(Number.isFinite(gain) && gain * sign > 0))
        return "the measured cross line leaves its common seam tangent plane on the wrong side";
      observedGains.push([Math.log(Math.abs(gain)), dot(native, along)]);
    }
    // In the tangent-plane orthonormal basis the two coefficients are
    // bounded projections, so a nearly parallel raw pair cannot produce
    // large coefficients whose cancellation disappears between columns.
    // Use a C2 convex interpolation of the measured log magnitudes.
    const bounded = (share: number): Scalar => {
      const count: number = observedGains.length - 1;
      const k: number = Math.min(count - 1, Math.max(0, Math.floor(share * count)));
      const x: number = share * count - k;
      const left: number = observedGains[k]![0];
      const gap: number = observedGains[k + 1]![0] - left;
      return [left + gap * x ** 3 * (10 - 15 * x + 6 * x * x),
        30 * gap * count * x * x * (1 - x) ** 2,
        60 * gap * count * count * x * (1 - x) * (1 - 2 * x)];
    };
    const angular = columns === undefined ? undefined :
      Spline.create(observedShares, observedGains.map(([, tangent]): number => tangent));
    return (share, line): Jet => {
      const r = ease(share, 1),
        s = ease(1 - share, -1);
      const across = world(
        r,
        s,
        curve.normal,
        forks[0].across,
        forks[1].across,
      );
      const along: Jet = {
        p: line.tangent,
        d1: scale(line.bend, rate * curve.length),
        d2: scale(line.bendRate!, (rate * curve.length) ** 2),
      };
      const gains = (base: number, first: number, last: number): Scalar =>
        [0, 1, 2].map(
          (j): number =>
            (j === 0 ? base : 0) +
            r[j]! * (first - base) +
            s[j]! * (last - base),
        ) as Scalar;
      let transverse: Scalar = gains(middle, ga, gb);
      let tangential: Scalar = gains(0, ta, tb);
      if (angular !== undefined) {
        const [log, first, second]: Scalar = bounded(share);
        const gain: number = sign * Math.exp(log);
        transverse = [gain, gain * first * rate, gain * (second + first * first) * rate * rate];
        const [value, v1, v2]: Scalar = Spline.read(angular, share);
        tangential = [value, v1 * rate, v2 * rate * rate];
      }
      const u = scaleJet(transverse, angular === undefined ? across : orthogonal(across, along));
      const v = scaleJet(tangential, along);
      const base = current(start + (end - start) * share);
      return {
        p: combine([
          [1, u.p],
          [1, v.p],
          [-1, base.p],
        ]),
        d1: combine([
          [1, u.d1],
          [1, v.d1],
          [-1, base.d1],
        ]),
        d2: combine([
          [1, u.d2],
          [1, v.d2],
          [-1, base.d2],
        ]),
      };
    };
  }
}
