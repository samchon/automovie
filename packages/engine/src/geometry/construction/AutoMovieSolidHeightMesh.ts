import type {
  AutoMovieVector2Tuple as P2,
  AutoMovieVector3Tuple as P3,
} from "@automovie/interface";

import type { AutoMovieSolidHeightPatch as Height } from "./AutoMovieSolidHeightPatch";
import { AutoMovieSolidSectionRows } from "./AutoMovieSolidSectionRows";
import { AutoMovieSolidVector as Vec } from "./AutoMovieSolidVector";
import { triangulateAutoMovieMonotoneChart as triangulate } from "./triangulateAutoMovieMonotoneChart";

/**
 * Native indexed sampling of one admissible physical height patch. Exact
 * boundary indices survive; only the two residual side strips need constrained
 * triangulation.
 */
export namespace AutoMovieSolidHeightMesh {
  /** A previously published vertex in the graph's physical chart. */
  export interface IBoundary {
    /** Existing shared solid index. */
    id: number;

    /** Physical section and width coordinates in millimetres. */
    chart: P2;
  }

  /** A new point owned by the physical patch. */
  export interface IVertex extends IBoundary {
    /** Analytic point in world millimetres. */
    point: P3;

    /** The same analytic field's unit normal. */
    normal: P3;
  }

  /** The prepared dense core and constrained outline, before any buffer write. */
  export interface IPlan {
    /** New vertices in their exact contiguous ID order. */
    vertices: IVertex[];

    /** Index triples positive in the physical chart. */
    triangles: [number, number, number][];

    /** Number of original physical sections evaluated for this scope. */
    rows: number;
  }

  /**
   * Read only required physical sections. Every outer contour vertex becomes a
   * station breakpoint. Consequently the outer and inner side segments have
   * linear interpolation on the same coordinate intervals and the two residual
   * polygons cannot run through the directly indexed core.
   *
   * @see https://doi.org/10.1016/0167-8655(84)90039-4 Two ordered chains bound the monotone projected region.
   */
  export function prepare(input: {
    boundary: readonly IBoundary[];
    height: P3;
    section: P3;
    span: P3;
    stations: readonly number[];
    columns: number;
    firstId: number;
    row(s: number): Height.IRow;
  }): IPlan | string {
    const { boundary, columns, firstId, height, section, span, row } = input;
    if (!(boundary.length >= 3 && Number.isInteger(columns) && columns >= 2))
      return "Physical height mesh needs an original contour and two interior columns";
    const n = boundary.length;
    const stations = boundary.map(({ chart }) => chart[0]);
    const start = Math.min(...stations);
    const end = Math.max(...stations);
    const lows = stations.flatMap((s, i) => (s === start ? [i] : []));
    const highs = stations.flatMap((s, i) => (s === end ? [i] : []));
    if (!(start < end && lows.length === 1 && highs.length === 1))
      return "Physical height mesh needs distinct original contracted ends";
    const low = lows[0]!;
    const high = highs[0]!;
    const chains = [1, -1].map((direction) => {
      const ordered = [boundary[low]!];
      for (
        let i = (low + direction + n) % n;
        i !== high;
        i = (i + direction + n) % n
      )
        ordered.push(boundary[i]!);
      ordered.push(boundary[high]!);
      return ordered;
    });
    if (
      chains.some((chain) =>
        chain.slice(1).some(({ chart }, i) => !(chain[i]!.chart[0] < chart[0])),
      )
    )
      return "A physical height contour does not have two source-ordered sides";
    const centre = (start + end) / 2;
    const sides = chains.map((chain) => ({ chain, at: interpolate(chain) }));
    sides.sort((a, b) => a.at(centre) - b.at(centre));
    const left = sides[0]!;
    const right = sides[1]!;
    const stationsInScope = [
      ...new Set([
        ...stations,
        ...input.stations.filter((s) => start < s && s < end),
      ]),
    ].sort((a, b) => a - b);
    const vertices: IVertex[] = [];
    const rows: IBoundary[][] = [[boundary[low]!]];
    for (const s of stationsInScope.slice(1, -1)) {
      const field = row(s);
      const lo = Math.max(field.lo, left.at(s));
      const hi = Math.min(field.hi, right.at(s));
      if (!(lo < hi))
        return `Physical height mesh has no shared positive width at ${s}`;
      const inside = Array.from({ length: columns }, (_, j): IVertex => {
        const x = lo + ((hi - lo) * (j + 1)) / (columns + 1);
        const value = field.at(x);
        const point = Vec.combine([
          [s, section],
          [x, span],
          [value.height, height],
        ]);
        const normal = Vec.unit(
          Vec.combine([
            [1, height],
            [-value.longitudinal, section],
            [-value.transverse, span],
          ]),
        )!;
        return {
          id: firstId + vertices.length + j,
          chart: [s, x],
          point,
          normal,
        };
      });
      vertices.push(...inside);
      rows.push(inside);
    }
    rows.push([boundary[high]!]);
    const triangles = AutoMovieSolidSectionRows.triangulate(
      rows.map((r) => r.map(({ id }) => id)),
    );
    for (const [side, outside] of sides.entries()) {
      const inside = rows.map((r) => r[side === 0 ? 0 : r.length - 1]!);
      const closed =
        side === 0
          ? triangulate(outside.chain, inside)
          : triangulate(inside, outside.chain);
      if (typeof closed === "string") return closed;
      triangles.push(...closed);
    }
    return { vertices, triangles, rows: rows.length };
  }

  /** Interpolate the adjacent original segment on an ordered physical side. */
  function interpolate(chain: readonly IBoundary[]) {
    return (s: number): number => {
      let a = 0;
      let b = chain.length - 1;
      while (b - a > 1) {
        const m = (a + b) >>> 1;
        if (s < chain[m]!.chart[0]) b = m;
        else a = m;
      }
      const [lo, x] = chain[a]!.chart;
      const [hi, y] = chain[b]!.chart;
      return x + ((s - lo) * (y - x)) / (hi - lo);
    };
  }
}
