import { AutoMovieHumanLoftContract } from "./AutoMovieHumanLoftContract";
import type { AutoMovieHumanLoftFrame } from "./AutoMovieHumanLoftFrame";
import type { AutoMovieHumanSolidJoin } from "./AutoMovieHumanSolidJoin";
import type { AutoMovieHumanSolidMesh } from "./AutoMovieHumanSolidMesh";
import type { AutoMovieHumanSolidVector } from "./AutoMovieHumanSolidVector";
import { AutoMovieHumanSplineCurve } from "./AutoMovieHumanSplineCurve";
import type { IAutoMovieHumanLoftChain } from "./IAutoMovieHumanLoftChain";

type Vec3 = AutoMovieHumanSolidVector.Vec3;

/**
 * A join's blend published as a lofted chain, so the skin, its normals, its
 * binding and its chart read the blend's vertices as they read any chain's,
 * and a later merge can take the blend as a host face.
 *
 * The blend is the quintic Hermite in its share `w` between the host's and
 * the part's ribbons (`AutoMovieHumanSolidBlend`). A chain interval whose
 * two layers carry values, slopes and second derivatives is the same quintic
 * Hermite in station (`AutoMovieHumanStationHermite`), so the blend is a
 * chain of two layers: the host's rail at station 0 and the part's at station
 * `L`, the columns' mean chord, with `s = w L`, each layer's slopes the
 * ribbon's cross derivative over `L` and its second derivatives the ribbon's
 * second cross derivative over `L^2`. Its rings are not planar, so each
 * layer lies in the world's level frame (`u = +X`, `v = +Z`, normal `+Y`)
 * with its height as the lift, carried by the same quintic rule
 * (`IAutoMovieHumanLoftChain.ILayer.liftCurvatures`). In phase every
 * quantity is the periodic cubic B-spline through the columns at `count`
 * uniform part phases from the trace's seed, the chain's phase `t - seed`.
 *
 * So at every column the chain is the blend exactly (to the B-spline
 * interpolation filter's rounding), including both ribbons' 2-jets, and
 * between columns it is the B-spline through them.
 */
export namespace AutoMovieHumanSolidBlendChain {
  /** A published blend. */
  export interface IBlend {
    /** The chain. */
    chain: IAutoMovieHumanLoftChain;

    /** Its station span `L`, mm: the share `w` is `station / L`. */
    length: number;

    /** The part phase of the chain's phase 0, radians. */
    seed: number;

    /** The host's rail at the columns, as a trim of the host's face. */
    host: AutoMovieHumanSolidMesh.ILoopChart;

    /** The part's rail at the columns, as a trim of the part's face. */
    part: AutoMovieHumanSolidMesh.ILoopChart;
  }

  /**
   * Publish a join's blend.
   *
   * @param name The blend chain's name, such as `blend.arm.left`.
   * @param join The join.
   * @param count Columns, a positive multiple of 4 of at least 8.
   * @returns The blend, or null when a rail fails at a column.
   */
  export function of(name: string, join: AutoMovieHumanSolidJoin.IJoin, count: number): IBlend | null {
    const seed: number = join.curve.points[0]!.phi;
    const columns: AutoMovieHumanSolidJoin.IColumn[] = [];
    for (let k: number = 0; k < count; k++) {
      const c: AutoMovieHumanSolidJoin.IColumn | null = join.column(seed + (2 * Math.PI * k) / count);
      if (c === null) return null;
      columns.push(c);
    }

    // The station span: the mean chord, never under the spline's least gap.
    let chord: number = 0;
    for (const c of columns) chord += Math.hypot(...([0, 1, 2].map((i: number): number => c.end.point[i]! - c.start.point[i]!)));
    const L: number = Math.max(AutoMovieHumanLoftContract.LEAST_SPLINE_GAP, chord / count);

    const layer = (y: number, pick: (c: AutoMovieHumanSolidJoin.IColumn) => [Vec3, Vec3, Vec3]): IAutoMovieHumanLoftChain.ILayer => {
      const rows: [Vec3, Vec3, Vec3][] = columns.map(pick);
      const plane = (k: 0 | 1 | 2, by: number): number[] =>
        AutoMovieHumanSplineCurve.interpolate(rows.map((r: [Vec3, Vec3, Vec3]): [number, number] => [r[k][0] * by, r[k][2] * by]));
      const height = (k: 0 | 1 | 2, by: number): number[] =>
        AutoMovieHumanSplineCurve.interpolate(rows.map((r: [Vec3, Vec3, Vec3]): [number, number] => [r[k][1] * by, 0])).slice(0, count);
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
    const chain: IAutoMovieHumanLoftChain = {
      name,
      basis: "spline",
      order: count,
      rule: "polar",
      samples: count,
      layers: [
        layer(0, (c: AutoMovieHumanSolidJoin.IColumn): [Vec3, Vec3, Vec3] => [c.start.point, c.start.first, c.start.second]),
        layer(L, (c: AutoMovieHumanSolidJoin.IColumn): [Vec3, Vec3, Vec3] => [c.end.point, c.end.first, c.end.second]),
      ],
    };

    const r0: AutoMovieHumanSolidJoin.IColumn = columns[0]!;
    return {
      chain,
      length: L,
      seed,
      host: {
        kind: join.curve.winding === 0 ? "hole" : r0.rail.across[0] > 0 ? "start" : "end",
        chart: columns.map((c: AutoMovieHumanSolidJoin.IColumn): [number, number] => [c.rail.host[0], c.rail.host[1]]),
      },
      part: {
        kind: r0.rail.sigma > 0 ? "start" : "end",
        chart: columns.map((c: AutoMovieHumanSolidJoin.IColumn, k: number): [number, number] => [c.rail.s, seed + (2 * Math.PI * k) / count]),
      },
    };
  }
}

/** The world's level frame: `u = +X`, `v = +Z`, normal `v x u = +Y`. */
const LEVEL: AutoMovieHumanLoftFrame.IFrame = { origin: [0, 0, 0], u: [1, 0, 0], v: [0, 0, 1] };

/** A frame that does not move with station. */
const STILL: AutoMovieHumanLoftFrame.IFrame = { origin: [0, 0, 0], u: [0, 0, 0], v: [0, 0, 0] };
