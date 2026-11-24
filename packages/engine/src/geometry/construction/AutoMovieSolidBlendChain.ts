import type {
  AutoMovieVector3Tuple,
  IAutoMovieLoftChain,
  IAutoMovieLoftSectionFrame,
  IAutoMovieLoftSurfaceJet,
  IAutoMovieSolidBlendChain,
  IAutoMovieSolidJoin,
  IAutoMovieSolidRail,
} from "@automovie/interface";

import { AutoMovieLoftJet } from "./AutoMovieLoftJet";
import { AutoMovieSolidCycle } from "./AutoMovieSolidCycle";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";
import { AutoMovieSplineCurve } from "./AutoMovieSplineCurve";

/**
 * A join's blend published as a lofted chain, so the skin, its normals, its
 * binding and its chart read the blend's vertices as they read any chain's,
 * and a later merge can take the blend as a host face.
 *
 * The blend is the quintic Hermite in its share `w` between the host's and
 * the part's ribbons (`AutoMovieSolidBlend`). A chain interval whose
 * two layers carry values, slopes and second derivatives is the same quintic
 * Hermite in station (`AutoMovieStationHermite`), so the blend is a
 * chain of two layers: the host's rail at station 0 and the part's at station
 * `L`, the columns' mean chord, with `s = w L`, each layer's slopes the
 * ribbon's cross derivative over `L` and its second derivatives the ribbon's
 * second cross derivative over `L^2`. Its rings are not planar, so each
 * layer lies in the world's level frame (`u = +X`, `v = +Z`, normal `+Y`)
 * with its height as the lift, carried by the same quintic rule
 * (`IAutoMovieLoftChain.ILayer.liftCurvatures`). In phase every
 * quantity is the periodic cubic B-spline through the columns at `count`
 * uniform curve parameters from the trace's seed, the chain's phase `t - seed`.
 *
 * So at every column the chain is the blend exactly (to the B-spline
 * interpolation filter's rounding), including both ribbons' 2-jets, and
 * between columns it is the B-spline through them: its interpolated ribbons
 * leave the surfaces' tangent planes there by about `(spacing / R)^2 / 8`,
 * the spacing the columns' distance along a rail and `R` the surface's
 * smaller radius of curvature, so the column count is chosen from that bound.
 */
export namespace AutoMovieSolidBlendChain {
  /**
   * Publish a join's blend.
   *
   * @param name The blend chain's name, such as `blend.arm.left`.
   * @param join The join.
   * @param count Columns, a positive multiple of 4 of at least 8.
   * @returns The blend, or null for an unsupported count, failed/nonfinite column, unrepresentable positive chord or unusable orientation anchor.
   */
  export function of(
    name: string,
    join: IAutoMovieSolidJoin.IJoin,
    count: number,
  ): IAutoMovieSolidBlendChain.IBlend | null {
    if (!Number.isInteger(count) || count < 8 || count % 4 !== 0) return null;
    const seed: number = join.curve.points[0]!.t;
    const columns: IAutoMovieSolidJoin.IColumn[] = [];

    /** Each published ribbon component and outward source must have finite arithmetic. */
    const finite: (v: readonly number[]) => boolean = (
      v: readonly number[],
    ): boolean => v.every(Number.isFinite);
    for (let k: number = 0; k < count; k++) {
      const c: IAutoMovieSolidJoin.IColumn | null = join.column(
        seed + (2 * Math.PI * k) / count,
      );
      if (c === null) return null;

      // A column with a non-finite rail or ribbon (a solve that failed
      // silently) is refused, never published into a chain.
      if (
        !(
          finite(c.start.point) &&
          finite(c.start.first) &&
          finite(c.start.second) &&
          finite(c.end.point) &&
          finite(c.end.first) &&
          finite(c.end.second) &&
          finite(c.outward) &&
          Math.hypot(...c.outward) > 0
        )
      )
        return null;
      columns.push(c);
    }

    const r0: IAutoMovieSolidJoin.IColumn = columns[0]!;
    const published: { chain: IAutoMovieLoftChain; length: number } | null =
      strip(name, columns, r0.outward);
    if (published === null) return null;
    const { chain, length: L } = published;
    const widths: ReturnType<IAutoMovieSolidJoin.IJoin["widths"]>[] = columns.map(
      (_, k: number): ReturnType<IAutoMovieSolidJoin.IJoin["widths"]> =>
        join.widths(seed + (2 * Math.PI * k) / count),
    );

    // A part's rail that does not wind round its phase encloses a region of
    // its chart; the part keeps the side its rail stands toward from the
    // curve (`partAcross`): inside when a step that way from the rail enters
    // the region (an island, as a nose along the face), else outside (a
    // hole). Taken as a hole always, a part whose kept skin lay inside was
    // drawn turned inside out, a pit where it should stand out.
    const partChart: [number, number][] = columns.map(
      (c: IAutoMovieSolidJoin.IColumn): [number, number] => [
        c.rail.s,
        c.rail.phi,
      ],
    );
    const island: () => boolean = (): boolean => {
      const a: [number, number] = r0.rail.partAcross;
      const l: number = Math.hypot(a[0], a[1]);
      if (!(l > 0)) return false;
      const span: number = Math.max(
        ...partChart.map((p: [number, number]): number =>
          Math.hypot(p[0] - r0.rail.s, p[1] - r0.rail.phi),
        ),
      );
      const step: number = (1e-3 * span) / l;
      return !AutoMovieSolidCycle.kept(
        { kind: "hole", chart: partChart },
        r0.rail.s + step * a[0],
        r0.rail.phi + step * a[1],
        2 * Math.PI,
      );
    };
    return {
      chain,
      length: L,
      seed,
      rails: columns.map(
        (c: IAutoMovieSolidJoin.IColumn): IAutoMovieSolidRail.IRail => c.rail,
      ),
      host: {
        kind:
          join.curve.winding === 0
            ? "hole"
            : r0.rail.across[0] > 0
              ? "start"
              : "end",
        chart: columns.map(
          (c: IAutoMovieSolidJoin.IColumn): [number, number] => [
            c.rail.host[0],
            c.rail.host[1],
          ],
        ),
        faces: columns.map(
          (c: IAutoMovieSolidJoin.IColumn): number => c.rail.hostFace,
        ),
      },
      across: columns.map(
        (c: IAutoMovieSolidJoin.IColumn): [number, number] => [
          c.rail.across[0],
          c.rail.across[1],
        ],
      ),
      partAcross: columns.map(
        (c: IAutoMovieSolidJoin.IColumn): [number, number] => [
          c.rail.partAcross[0],
          c.rail.partAcross[1],
        ],
      ),
      curve: columns.map(
        (c: IAutoMovieSolidJoin.IColumn): [number, number, number] => [
          c.rail.curve.point[0],
          c.rail.curve.point[1],
          c.rail.curve.point[2],
        ],
      ),
      widths: {
        host: widths.map((width): number => width.host),
        part: widths.map((width): number | null => width.part),
      },
      parameter: join.curve.parameter.kind,
      sigma: r0.rail.sigma > 0 ? 1 : -1,
      part: {
        kind:
          join.curve.partWinding === 0
            ? island()
              ? "island"
              : "hole"
            : r0.rail.sigma > 0
              ? "start"
              : "end",
        chart: partChart,
      },
    };
  }

  /**
   * The strip between two ribbon rails as a two-layer chain: the quintic
   * Hermite in station from the start ribbons (station 0) to the end ribbons
   * (station `L`, the columns' mean chord), each field the periodic cubic
   * B-spline through the columns in phase, in the world's level frame with
   * the height as the lift; its outward sign from `outward`, the start rail's
   * outward normal at column 0. A join's blend ({@link of}) and a split's
   * bands (`AutoMovieConstructionSplitRealize`) publish through it.
   *
   * A profiled strip (a port's `IAutoMovieConstructionBandProfile`) adds interior layers: at a share `t` of the span, each column's point,
   * cross derivative and second cross derivative per unit share, so the strip is the piecewise quintic Hermite through its rails and those
   * cross sections, C2 across each, and its rails keep their own 2-jets.
   *
   * @param name The chain's name.
   * @param columns The ribbon pairs at uniform phases `2 pi k / n`, `n` a multiple of 4 of at least 8.
   * @param outward The start surface's outward normal at column 0.
   * @param inner Interior cross sections in increasing share `t` in `(0, 1)`, each with one jet per column; absent, none.
   * @param orientation Optional exact chart orientation inherited from an oriented owner arc.
   * @returns The chain and its station span `L`, mm, or null for a nonpositive or nonfinite span or an unusable orientation anchor.
   */
  export function strip(
    name: string,
    columns: IAutoMovieSolidBlendChain.IStripColumns,
    outward: AutoMovieVector3Tuple,
    inner: IAutoMovieSolidBlendChain.IStripInner = [],
    orientation?: 1 | -1,
  ): IAutoMovieSolidBlendChain.IStripResult {
    const count: number = columns.length;

    // The station span: the mean chord between the rails.
    let chord: number = 0;
    for (const c of columns)
      chord += Math.hypot(
        ...[0, 1, 2].map(
          (i: number): number => c.end.point[i]! - c.start.point[i]!,
        ),
      );
    const L: number = chord / count;
    if (!(Number.isFinite(L) && L > 0)) return null;

    /** Every layer uses the same physical chord clock, with station derivatives scaled by L; `rows` holds each column's point and its two cross derivatives. */
    const layer: (
      y: number,
      rows: readonly (readonly [
        AutoMovieVector3Tuple,
        AutoMovieVector3Tuple,
        AutoMovieVector3Tuple,
      ])[],
    ) => IAutoMovieLoftChain.ILayer = (
      y: number,
      rows: readonly (readonly [
        AutoMovieVector3Tuple,
        AutoMovieVector3Tuple,
        AutoMovieVector3Tuple,
      ])[],
    ): IAutoMovieLoftChain.ILayer => {
      /** World X/Z ribbon components in the level storage plane. */
      const plane: (k: 0 | 1 | 2, by: number) => number[] = (
        k: 0 | 1 | 2,
        by: number,
      ): number[] =>
        AutoMovieSplineCurve.interpolate(
          rows.map(
            (
              r: readonly [
                AutoMovieVector3Tuple,
                AutoMovieVector3Tuple,
                AutoMovieVector3Tuple,
              ],
            ): [number, number] => [r[k][0] * by, r[k][2] * by],
          ),
        );

      /** The world Y component is the lift along the level frame's normal. */
      const height: (k: 0 | 1 | 2, by: number) => number[] = (
        k: 0 | 1 | 2,
        by: number,
      ): number[] =>
        AutoMovieSplineCurve.interpolate(
          rows.map(
            (
              r: readonly [
                AutoMovieVector3Tuple,
                AutoMovieVector3Tuple,
                AutoMovieVector3Tuple,
              ],
            ): [number, number] => [r[k][1] * by, 0],
          ),
        ).slice(0, count);
      return {
        y,
        frame: LEVEL,
        frameSlopes: STILL,
        frameCurvatures: STILL,
        coefficients: plane(0, 1),
        slopes: plane(1, 1 / L),
        curvatures: plane(2, 1 / (L * L)),
        lift: height(0, 1),
        liftSlopes: height(1, 1 / L),
        liftCurvatures: height(2, 1 / (L * L)),
      };
    };
    const chain: IAutoMovieLoftChain = {
      name,
      basis: "spline",
      order: count,
      rule: "polar",
      samples: count,
      layers: [
        layer(
          0,
          columns.map(
            (
              c: (typeof columns)[number],
            ): [
              AutoMovieVector3Tuple,
              AutoMovieVector3Tuple,
              AutoMovieVector3Tuple,
            ] => [c.start.point, c.start.first, c.start.second],
          ),
        ),
        ...inner.map(
          (section: {
            t: number;
            jets: readonly [
              AutoMovieVector3Tuple,
              AutoMovieVector3Tuple,
              AutoMovieVector3Tuple,
            ][];
          }): IAutoMovieLoftChain.ILayer => layer(section.t * L, section.jets),
        ),
        layer(
          L,
          columns.map(
            (
              c: (typeof columns)[number],
            ): [
              AutoMovieVector3Tuple,
              AutoMovieVector3Tuple,
              AutoMovieVector3Tuple,
            ] => [c.end.point, c.end.first, c.end.second],
          ),
        ),
      ],
    };

    // A blend is an annulus, not a tube about its storage frame's origin.
    // Its rail continues the start surface's oriented surface. A regular
    // connected strip keeps that sign; one anchor is not a global
    // certificate for the periodic interpolation between columns.
    if (orientation !== undefined) return { chain: { ...chain, orientation }, length: L };
    const edge: IAutoMovieLoftSurfaceJet = AutoMovieLoftJet.at(chain, 0, 0);
    const facing: number = AutoMovieSolidVector.dot(
      AutoMovieSolidVector.cross(edge.s, edge.t),
      outward,
    );
    if (!(Number.isFinite(facing) && Math.abs(facing) > 0)) return null;
    chain.orientation = facing > 0 ? 1 : -1;
    return { chain, length: L };
  }
}

/** The world's level frame: `u = +X`, `v = +Z`, normal `v x u = +Y`. */
const LEVEL: IAutoMovieLoftSectionFrame = {
  origin: [0, 0, 0],
  u: [1, 0, 0],
  v: [0, 0, 1],
};

/** A frame that does not move with station. */
const STILL: IAutoMovieLoftSectionFrame = {
  origin: [0, 0, 0],
  u: [0, 0, 0],
  v: [0, 0, 0],
};
