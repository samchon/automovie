import { AutoMovieConicFieldJet } from "@automovie/engine";
import type {
  IAutoMovieConicFieldJet,
  IAutoMovieHumanMammaryJoin,
  IAutoMovieSolidSharedCurve,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

import { AutoMovieHumanMammaryJoin } from "../AutoMovieHumanMammaryJoin";

/**
 * One conic root and one height field on the original anterior thorax. The
 * parent owns the geometry, level and phase derivatives at the boundary.
 */
export namespace AutoMovieHumanMammaryChart {
  type Jet = IAutoMovieConicFieldJet.IJet;
  const A = AutoMovieConicFieldJet.AD;
  const TURN: number = 2 * Math.PI;

  /** Landmark-derived parameters in the actual source chart. */
  export interface IInput {
    /** Original height and phase below the supplied bust point. */
    centre: readonly [number, number];
    /** Native length of one radian at the centre's level, mm. */
    pitch: number;
    /** Upper, lower and circumferential extents in the developed chart, mm. */
    reaches: IAutoMovieHumanMammaryJoin.IFootprint["reaches"];
    /** Person's world AP coordinate at this bust point, mm. */
    apex: number;
    /** World AP distance from the original wall to the same point, mm. */
    projection: number;
    /** Physical vertical half-chord of the crest's osculating circle, mm. */
    sagittalReach?: number;
  }

  /** The native chart's conic boundary and the associated anterior graph. */
  export interface IChart {
    /** The exact two-jet of the root in the original trunk chart. */
    root: IAutoMovieSolidSharedCurve.Loop;
    /** Calculate the phase part of the forward Point0 for one prepared station. */
    pointAt(station: number): (phase: number, originalX: number) => number;
    /** Relative weight of the absolute target with respect to the original. */
    weight(station: number, phase: number): number;
    /** Weight and derivative for native phase-only consumers. */
    weightPhase(station: number, phase: number): [number, number] | null;
    /** Complete native two-jet of the relative weight. */
    weightJet(station: number, phase: number): Jet | null;
    /** AP displacement and its derivatives on the original coordinate chart. */
    offset(station: number, phase: number, originalX: Jet): Jet | null;
    /** Move the corresponding original Point0 and all its physical jets. */
    transfer(
      station: number,
      phase: number,
      original: IAutoMovieSolidSurface.IJet,
    ): IAutoMovieSolidSurface.IJet;
  }

  /**
   * Prepare a rational Hermite lift between the measured root and apex. The
   * central quadratic q uses the curvature of a spherical cap with the same
   * projection and principal reach. The root basis `(1-r)^3` decreases on each
   * normalized ray r while q increases, so their normalized ratio `(1-r)^3 /
   * ((1-r)^3 + q)` decreases. This ESTIMATE keeps the root 2-jet and has one
   * apex Hessian because it is `1-q+O(r³)` at the centre. The shorter inferior
   * rays retain lift farther across their course because their q is smaller,
   * giving inferior fullness from the measured reaches.
   *
   * @see https://www2.mathematik.tu-darmstadt.de/~ehartmann/cdgen.pdf Section 11.3.
   * @see https://doi.org/10.1016/j.bjps.2011.08.006 Upper and lower profile observations.
   */
  export function prepare(input: IInput): IChart {
    const {
      centre: [height, phase],
      pitch,
      reaches,
      apex,
      projection,
    } = input;
    const radius = AutoMovieHumanMammaryJoin.radius(reaches);
    const wide: number = Math.max(reaches.plusV, reaches.minusV);
    const tall: number =
      input.sagittalReach ?? Math.max(reaches.up, reaches.down);
    const height2: number = projection ** 2;
    const inverseU2: number = 1 / (tall ** 2 + height2);
    const inverseV2: number = 1 / (wide ** 2 + height2);
    const pack = (s: number, t: number) => ({
      r2: s * s + t * t,
      theta: Math.atan2(t, s),
      ellipse: inverseU2 * s * s + inverseV2 * t * t,
    });
    const bounds = (u: number, v: number): boolean =>
      u > -reaches.down &&
      u < reaches.up &&
      v > -reaches.minusV &&
      v < reaches.plusV;
    const root: IChart["root"] = (clock) => {
      const [r, d, dd] = radius(clock);
      const c: number = Math.cos(clock);
      const s: number = Math.sin(clock);
      return {
        point: [height + r * c, phase + (r * s) / pitch],
        first: [d * c - r * s, (d * s + r * c) / pitch],
        second: [(dd - r) * c - 2 * d * s, ((dd - r) * s + 2 * d * c) / pitch],
      };
    };
    const across = (t: number): number => {
      const delta: number = t - phase;
      return (delta - TURN * Math.round(delta / TURN)) * pitch;
    };
    const scalar = (offset: number, lateral: number): number => {
      if (!bounds(offset, lateral)) return 0;
      const { r2, theta, ellipse } = pack(offset, lateral);
      const reach: number = radius(theta)[0];
      const r: number = Math.sqrt(r2) / reach;
      if (!(r < 1)) return 0;
      const rim: number = (1 - r) ** 3;
      return rim / (rim + ellipse);
    };
    const pointAt: IChart["pointAt"] = (station) => {
      const offset: number = station - height;
      return (t, originalX) => {
        const weight = scalar(offset, across(t));
        return weight === 0
          ? originalX
          : originalX + weight * (apex - originalX);
      };
    };
    const weightPhase: IChart["weightPhase"] = (station, t) => {
      const u = station - height;
      const v = across(t);
      if (!bounds(u, v)) return null;
      const { r2, theta, ellipse } = pack(u, v);
      if (r2 === 0) return [1, 0];
      const [reach, derivative] = radius(theta);
      const length = Math.sqrt(r2);
      const r = length / reach;
      if (!(r < 1)) return null;
      const r1 = (pitch / (length * reach)) * (v - (u * derivative) / reach);
      const rim = (1 - r) ** 3;
      const rim1 = -3 * (1 - r) ** 2 * r1;
      const total = rim + ellipse;
      return [
        rim / total,
        (rim1 * ellipse - rim * 2 * v * pitch * inverseV2) / (total * total),
      ];
    };
    const blend = (u: number, v: number): Jet | null => {
      if (!bounds(u, v)) return null;
      const { r2, theta, ellipse } = pack(u, v);
      const q: Jet = [
        ellipse,
        2 * u * inverseU2,
        2 * v * pitch * inverseV2,
        2 * inverseU2,
        0,
        2 * pitch ** 2 * inverseV2,
      ];
      if (r2 === 0) return A.subtract(A.constant(1), q);
      const [r, d, dd] = radius(theta);
      const x0: number = r2 / r ** 2;
      if (!(x0 < 1)) return null;
      const cc: number = 1 / r2 ** 2;
      const angle: Jet = [
        theta,
        -v / r2,
        (u * pitch) / r2,
        2 * u * v * cc,
        (v * v - u * u) * pitch * cc,
        -2 * u * v * pitch ** 2 * cc,
      ];
      const f: Jet = compose(
        angle,
        1 / r ** 2,
        (-2 * d) / r ** 3,
        (6 * d * d) / r ** 4 - (2 * dd) / r ** 3,
      );
      const h: Jet = [r2, 2 * u, 2 * v * pitch, 2, 0, 2 * pitch ** 2];
      const rho: Jet = A.sqrt(A.multiply(h, f));
      const y: number = 1 - rho[0];
      const cubic: Jet = compose(rho, y ** 3, -3 * y ** 2, 6 * y);
      return A.divide(cubic, A.add(cubic, q));
    };
    const offset: IChart["offset"] = (station, t, x) => {
      const w: Jet | null = blend(station - height, across(t));
      return w === null ? null : A.multiply(w, A.subtract(A.constant(apex), x));
    };
    return {
      root,
      pointAt,
      weight: (station, t) => scalar(station - height, across(t)),
      weightPhase,
      weightJet: (station, t) => blend(station - height, across(t)),
      offset,
      transfer: (station, t, original) => {
        const { p, u, v, uu, uv, vv } = original;
        const h: Jet | null = offset(station, t, [
          p[0],
          u[0],
          v[0],
          uu[0],
          uv[0],
          vv[0],
        ]);
        if (h === null) return original;
        const at = (before: typeof p, shift: number): typeof p => [
          before[0] + shift,
          before[1],
          before[2],
        ];
        return {
          p: at(p, h[0]),
          u: at(u, h[1]),
          v: at(v, h[2]),
          uu: at(uu, h[3]),
          uv: at(uv, h[4]),
          vv: at(vv, h[5]),
        };
      },
    };
  }

  /** The scalar second-order chain rule in the two native chart coordinates. */
  function compose(x: Jet, value: number, first: number, second: number): Jet {
    return [
      value,
      first * x[1],
      first * x[2],
      first * x[3] + second * x[1] ** 2,
      first * x[4] + second * x[1] * x[2],
      first * x[5] + second * x[2] ** 2,
    ];
  }
}
