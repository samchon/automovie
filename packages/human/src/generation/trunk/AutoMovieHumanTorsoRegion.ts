import type { IAutoMovieConstructionProfileSource } from "@automovie/engine";

import type { AutoMovieHumanTorsoPlan } from "./AutoMovieHumanTorsoPlan";

/** A regional AP envelope over its original wall; support, editing and phase derivatives share one source law. */
export namespace AutoMovieHumanTorsoRegion {
  /** Point/phase capability of the same compact region weight. */
  export interface IWeight {
    /** Convex blending share, from zero at its support to one at its apex. */
    p: number;
    /** First derivative per original radian. */
    t: number;
    /** Second derivative per original radian squared, where supplied by the wall. */
    tt: number | null;
  }

  /** Actual weight partials in physical station mm and original radian, without factorial scaling. */
  export interface ITotal extends IWeight {
    /** First physical-station derivative. */
    s: number;
    /** Second physical-station derivative. */
    ss: number;
    /** Mixed physical-station/original-phase derivative. */
    st: number;
    /** Actual second phase derivative when the full wall2 was supplied. */
    tt: number;
  }

  /** One regional control and the actual wall-to-apex chart, prepared once. */
  export interface IField {
    /** Unmodified anatomical AP apex and footprint datums. */
    readonly region: AutoMovieHumanTorsoPlan.IRegion;
    /** Original material clock passing through the declared apex. */
    readonly clock: number;
    /** Read the same support law without requesting any wall derivatives. */
    weight(station: number, z: number, clock: number): number;
    /** Differentiate that law through the supplied actual wall phase reading. */
    phase(
      station: number,
      wall: IAutoMovieConstructionProfileSource.IPhase,
      clock: number,
    ): IWeight;
    /** Differentiate the same source law through complete actual wall2. */
    jet(
      station: number,
      wall: IAutoMovieConstructionProfileSource.IJet,
      clock: number,
    ): ITotal;
  }

  /** Admitted smooth footprint chart at one original physical point. */
  interface IChart {
    /** Squared normalized footprint radius. */
    radius2: number;
    /** Lateral coordinate and its first two physical-coordinate derivatives. */
    lateral: [number, number, number];
    /** Vertical coordinate and its actual physical-station derivatives. */
    vertical: [number, number, number];
  }

  /**
   * Author a rounded AP envelope with its exact apex and compact support.
   *
   * A single rational coordinate sends [-b,0,a] to [-1,0,1]. Its denominator
   * is positive on that interval and its derivative is positive, avoiding
   * the second-derivative jump of two independently normalized half ellipses.
   * The cubed deficit has zero value/two derivatives at the rim. The cap
   * anterior coefficients retain the spherical-cap local expansion through
   * squared chart radius q squared: 1-k*q-k*k*(1-k)*q*q, with
   * k=a*a/(a*a+h*h), a the harmonic chart radii's geometric mean and h the
   * actual projection. This is a compact polynomial continuation, not an
   * exact sphere away from its apex. The posterior envelope retains its
   * existing linear radial factor. The cubed deficit closes value and two
   * derivatives at the rim. The previous linear radial factor preserved
   * only apex curvature and unnecessarily concentrated the middle envelope.
   * A quintic phase gate is flat at the actual apex clock and at the opposite
   * half, so it neither shifts that apex nor asserts a hard branch seam.
   * This is a deliberately new source law, not replay of the old mass loft.
   */
  export function create(
    region: AutoMovieHumanTorsoPlan.IRegion,
    clock: number,
    projection: number,
  ): IField {
    if (
      !(
        Number.isFinite(clock) &&
        Number.isFinite(projection) &&
        projection >= 0
      ) ||
      region.footprint.some(
        (span: number): boolean => !Number.isFinite(span) || span <= 0,
      )
    )
      throw new Error(
        "S00 regional source needs finite apex correspondence and positive footprint half spans",
      );
    const facing: number = region.outward * Math.cos(clock);
    if (!(facing > 0))
      throw new Error("S00 regional apex has no anatomical phase half");
    const ry: number =
      (2 * region.footprint[0] * region.footprint[2]) /
      (region.footprint[0] + region.footprint[2]);
    const rz: number =
      (2 * region.footprint[1] * region.footprint[3]) /
      (region.footprint[1] + region.footprint[3]);
    const cap: number = 3 - 1 / (1 + (projection * projection) / (ry * rz));
    const curvature: number = 3 - cap;
    const radial2: number =
      region.outward === 1
        ? 6 - 3 * curvature - curvature * curvature * (1 - curvature)
        : 0;

    /** Same compact radial polynomial and its first two derivatives in squared chart radius. */
    const envelope: (q: number) => [number, number, number] = (
      q: number,
    ): [number, number, number] => {
      const d: number = 1 - q;
      const f: number = 1 + cap * q + radial2 * q * q;
      const df: number = cap + 2 * radial2 * q;
      return [
        d ** 3 * f,
        -3 * d ** 2 * f + d ** 3 * df,
        6 * d * f - 6 * d ** 2 * df + 2 * radial2 * d ** 3,
      ];
    };

    /** Exact admitted support, with no clamp or extension of an original coordinate. */
    const chart: (station: number, z: number) => IChart | null = (
      station: number,
      z: number,
    ): IChart | null => {
      const dy: number = station - region.apex[1];
      const dz: number = region.side * (z - region.apex[2]);
      if (
        dy <= -region.footprint[2] ||
        dy >= region.footprint[0] ||
        dz <= -region.footprint[3] ||
        dz >= region.footprint[1]
      )
        return null;
      const vertical: [number, number, number] = coordinate(
        dy,
        region.footprint[0],
        region.footprint[2],
      );
      const lateral: [number, number, number] = coordinate(
        dz,
        region.footprint[1],
        region.footprint[3],
      );
      const radius2: number = vertical[0] ** 2 + lateral[0] ** 2;
      return radius2 < 1 ? { radius2, lateral, vertical } : null;
    };
    return {
      region,
      clock,
      weight(station: number, z: number, phase: number): number {
        const at: IChart | null = chart(station, z);
        if (at === null) return 0;
        return envelope(at.radius2)[0] * gate(region.outward, facing, phase)[0];
      },
      phase(
        station: number,
        wall: IAutoMovieConstructionProfileSource.IPhase,
        phase: number,
      ): IWeight {
        const at: IChart | null = chart(station, wall.p[1]);
        if (at === null) return { p: 0, t: 0, tt: wall.tt === null ? null : 0 };
        const [value, first, second]: [number, number, number] = envelope(
          at.radius2,
        );
        const zt: number = region.side * wall.t[1];
        const rt: number = 2 * at.lateral[0] * at.lateral[1] * zt;
        const g: [number, number, number] = gate(region.outward, facing, phase);
        const p: number = value * g[0];
        const t: number = first * rt * g[0] + value * g[1];
        if (wall.tt === null) return { p, t, tt: null };
        const ztt: number = region.side * wall.tt[1];
        const rtt: number =
          2 *
          ((at.lateral[1] * zt) ** 2 +
            at.lateral[0] * (at.lateral[2] * zt ** 2 + at.lateral[1] * ztt));
        return {
          p,
          t,
          tt:
            (second * rt ** 2 + first * rtt) * g[0] +
            2 * first * rt * g[1] +
            value * g[2],
        };
      },
      jet(
        station: number,
        wall: IAutoMovieConstructionProfileSource.IJet,
        phase: number,
      ): ITotal {
        const at: IChart | null = chart(station, wall.p[1]);
        if (at === null) return { p: 0, s: 0, t: 0, ss: 0, st: 0, tt: 0 };
        const [y, ys, yss]: [number, number, number] = at.vertical;
        const [z, dz, ddz]: [number, number, number] = at.lateral;
        const zs: number = region.side * wall.s[1];
        const zt: number = region.side * wall.t[1];
        const rs: number = 2 * (y * ys + z * dz * zs);
        const rt: number = 2 * z * dz * zt;
        const rss: number =
          2 *
          (ys * ys +
            y * yss +
            (dz * dz + z * ddz) * zs * zs +
            z * dz * region.side * wall.ss[1]);
        const rst: number =
          2 *
          ((dz * dz + z * ddz) * zs * zt + z * dz * region.side * wall.st[1]);
        const rtt: number =
          2 *
          ((dz * dz + z * ddz) * zt * zt + z * dz * region.side * wall.tt[1]);
        const [f, df, ddf]: [number, number, number] = envelope(at.radius2);
        const g: [number, number, number] = gate(region.outward, facing, phase);
        return {
          p: f * g[0],
          s: df * rs * g[0],
          t: df * rt * g[0] + f * g[1],
          ss: (ddf * rs * rs + df * rss) * g[0],
          st: (ddf * rs * rt + df * rst) * g[0] + df * rs * g[1],
          tt: (ddf * rt * rt + df * rtt) * g[0] + 2 * df * rt * g[1] + f * g[2],
        };
      },
    };
  }
}

/** Original signed coordinate and its analytic physical derivatives; the caller admits its actual finite support first. */
function coordinate(x: number, a: number, b: number): [number, number, number] {
  const sum: number = a + b;
  const product: number = 2 * a * b;
  const difference: number = a - b;
  const denominator: number = product + difference * x;
  return [
    (x * sum) / denominator,
    (sum * product) / denominator ** 2,
    (-2 * sum * product * difference) / denominator ** 3,
  ];
}

/** Minimal-degree C2 transition between the anatomical half boundary and the actual apex's facing, with exact constant extensions. */
function gate(
  outward: 1 | -1,
  facing: number,
  clock: number,
): [number, number, number] {
  const u: number = (outward * Math.cos(clock)) / facing;
  if (u <= 0) return [0, 0, 0];
  if (u >= 1) return [1, 0, 0];
  const ut: number = (-outward * Math.sin(clock)) / facing;
  const utt: number = -u;
  const first: number = 30 * u ** 2 * (u - 1) ** 2;
  const second: number = 60 * u * (2 * u ** 2 - 3 * u + 1);
  return [
    u ** 3 * (u * (6 * u - 15) + 10),
    first * ut,
    second * ut ** 2 + first * utt,
  ];
}
