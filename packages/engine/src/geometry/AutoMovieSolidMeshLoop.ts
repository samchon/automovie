import type {
  AutoMovieVector3Tuple,
  IAutoMovieSolidMesh,
  IAutoMovieSolidMeshLoop,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

import { AutoMovieSolidCycle } from "./AutoMovieSolidCycle";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";

const { dot, norm, sub } = AutoMovieSolidVector;
/**
 * The trim-loop readings of a face's tessellation (`AutoMovieSolidMesh.face`):
 * which grid vertices a loop keeps with a local metric margin, how
 * chart-distance scores rank drawn-cell cycles, and the polyline-chord
 * parameter and heuristic alignment the zipper (`AutoMovieSolidZip`) uses for
 * stitching.
 */
export namespace AutoMovieSolidMeshLoop {
  /**
   * Whether a grid vertex lies on a loop's kept side, at least `margin` mm from
   * it.
   *
   * @param loop The loop.
   * @param u The vertex's station.
   * @param v The vertex's phase.
   * @param jet The surface's jet there, for the metric.
   * @param margin The least distance from the loop, mm.
   * @param period The face's phase period, or undefined.
   * @returns True when the vertex is kept at the margin.
   */
  export function keeps(
    loop: IAutoMovieSolidMesh.ILoop,
    u: number,
    v: number,
    jet: IAutoMovieSolidSurface.IJet,
    margin: number,
    period: number | undefined,
  ): boolean {
    if (!AutoMovieSolidCycle.kept(loop, u, v, period)) return false;

    return minimum(loop, u, v, jet, margin, period);
  }

  /**
   * Compile the same classification for one synchronous face's unchanged
   * inputs. Each loop's chart, kept-side predicate, segment differences and
   * chart box are prepared once here; a nonpositive period keeps the original
   * live walk.
   */
  export function prepare(
    loops: readonly IAutoMovieSolidMesh.ILoop[],
    period: number | undefined,
  ): IAutoMovieSolidMeshLoop.Classifier {
    const raw: IAutoMovieSolidMeshLoop.Classifier = (
      u: number,
      v: number,
      jet: IAutoMovieSolidSurface.IJet,
      margin: number,
    ): boolean =>
      loops.every((l: IAutoMovieSolidMesh.ILoop): boolean =>
        keeps(l, u, v, jet, margin, period),
      );
    if (period !== undefined && period <= 0) return raw;
    const states: IState[] = loops.map(
      (loop: IAutoMovieSolidMesh.ILoop): IState => state(loop, period),
    );
    return (
      u: number,
      v: number,
      jet: IAutoMovieSolidSurface.IJet,
      margin: number,
    ): boolean => {
      const E: number = dot(jet.u, jet.u);
      const F: number = dot(jet.u, jet.v);
      const G: number = dot(jet.v, jet.v);
      for (const state of states) {
        if (!state.side(u, v)) return false;

        // A point farther from the loop's chart box than the margin, by a
        // lower bound of the metric, is farther from every segment: with
        // `c = F / sqrt(E G)`, `E du^2 + 2 F du dv + G dv^2 >=
        // (1 - |c|) (E du^2 + G dv^2)`, and any offset to the loop has
        // `|du|`, `|dv|` at least the gaps to the box. The scan is skipped
        // only on a strict excess, so a tie still reads every segment.
        const box: readonly [number, number, number, number] = state.box;
        const gapU: number = Math.max(0, box[0] - u, u - box[1]);
        // An unbounded half width leaves no phase gap.
        const gapV: number = Math.max(
          0,
          Math.abs(AutoMovieSolidCycle.shift(v, box[2], period) - box[2]) -
            box[3],
        );
        const shear: number =
          E > 0 && G > 0 ? Math.abs(F) / Math.sqrt(E * G) : 1;
        if (
          (1 - shear) * (E * gapU * gapU + G * gapV * gapV) >
          margin * margin * (1 + 1e-9)
        )
          continue;
        if (
          !(
            distance(state.chart, u, v, E, F, G, period, state.deltas) >= margin
          )
        )
          return false;
      }
      return true;
    };
  }

  /**
   * The mean chart distance from a cycle's points to a loop, for matching a
   * drawn-cell cycle to its loop.
   *
   * @param loop The loop.
   * @param points The cycle's chart points.
   * @param period The face's phase period, or undefined.
   * @returns The mean distance. Coordinates use their raw chart units, so this
   *   ranking is not a world-distance or topology certificate. No points gives
   *   NaN; no loop segments gives infinite distance for each nonempty point
   *   query.
   */
  export function nearest(
    loop: IAutoMovieSolidMesh.ILoop,
    points: readonly [number, number][],
    period: number | undefined,
  ): number {
    let sum: number = 0;
    for (const p of points)
      sum += AutoMovieSolidCycle.foot(loop, p[0], p[1], period).distance;
    return sum / points.length;
  }

  /**
   * The zipper's parameter of a closed vertex sequence: its cumulative length
   * between its points from its first, over its whole length, times a turn.
   * Arclength holds for any simple cycle a clip leaves, where an angle about a
   * centre turns back on a cycle that is not star-shaped.
   *
   * @param mesh The mesh holding the vertices.
   * @param ids The sequence's vertices.
   * @returns Each vertex's parameter, radians from 0. The sequence must be
   *   nonempty with valid mesh indices. This is closed polyline chord length,
   *   not smooth-surface arclength. A total that does not compare above zero
   *   takes the all-zero branch; positive infinity still enters normalization
   *   and is not validated here.
   */
  export function arc(
    mesh: IAutoMovieSolidMesh.IMesh,
    ids: readonly number[],
  ): number[] {
    const p = (v: number): Vec3 => [
      mesh.positions[3 * v]!,
      mesh.positions[3 * v + 1]!,
      mesh.positions[3 * v + 2]!,
    ];
    const out: number[] = [0];
    for (let k: number = 1; k < ids.length; k++)
      out.push(out[k - 1]! + norm(sub(p(ids[k]!), p(ids[k - 1]!))));
    const total: number =
      out[ids.length - 1]! + norm(sub(p(ids[0]!), p(ids[ids.length - 1]!)));
    return out.map((x: number): number =>
      total > 0 ? (2 * Math.PI * x) / total : 0,
    );
  }

  /**
   * A drawn-cell cycle turned and started to run with a loop: started at its
   * vertex nearest the loop's first, and turned the way whose point a quarter
   * of its length on lies nearer the loop's point a quarter on.
   *
   * @param mesh The mesh holding the vertices.
   * @param loop The loop's vertices.
   * @param cycle The cycle's vertices.
   * @returns The cycle, started and turned to run with the loop. Both sequences
   *   must be nonempty with valid mesh indices. The quarter observation is the
   *   first existing vertex at or beyond a quarter turn, falling back to the
   *   first vertex if none reaches it; it is not an interpolated quarter point
   *   or proof of boundary correspondence.
   */
  export function aligned(
    mesh: IAutoMovieSolidMesh.IMesh,
    loop: readonly number[],
    cycle: readonly number[],
  ): number[] {
    const p = (v: number): Vec3 => [
      mesh.positions[3 * v]!,
      mesh.positions[3 * v + 1]!,
      mesh.positions[3 * v + 2]!,
    ];
    const head: Vec3 = p(loop[0]!);
    let start: number = 0;
    cycle.forEach((v: number, k: number): void => {
      if (norm(sub(p(v), head)) < norm(sub(p(cycle[start]!), head))) start = k;
    });
    const forward: number[] = cycle.map(
      (_: number, k: number): number => cycle[(start + k) % cycle.length]!,
    );
    const backward: number[] = [forward[0]!, ...forward.slice(1).reverse()];
    const quarter = (ids: readonly number[]): Vec3 => {
      const a: number[] = arc(mesh, ids);
      const k: number = a.findIndex((x: number): boolean => x >= Math.PI / 2);
      return p(ids[k < 0 ? 0 : k]!);
    };
    const target: Vec3 = quarter(loop);
    return norm(sub(quarter(forward), target)) <=
      norm(sub(quarter(backward), target))
      ? forward
      : backward;
  }

  /** The numerical fields the parity and metric readings consume. */
  type Chart = Pick<IAutoMovieSolidMesh.ILoop, "kind" | "chart">;

  /** One loop's readings prepared for a face, never published into a body. */
  interface IState {
    /** Copied numerical chart. */ chart: Chart;
    /** Existing kept-side predicate over that copy. */ side: (
      u: number,
      v: number,
    ) => boolean;
    /** Metric segment differences, dx/dy per edge. */ deltas: Float64Array;
    /**
     * The copied chart's box: lowest and highest station, then the middle and
     * half width of its unwrapped phases, an Infinity half width when they span
     * half a period or more.
     */ box: readonly [number, number, number, number];
  }

  /** Copy one loop's chart and prepare its side, differences and box. */
  function state(
    loop: IAutoMovieSolidMesh.ILoop,
    period: number | undefined,
  ): IState {
    const chart: Chart = {
      kind: loop.kind,
      chart: loop.chart.map(([x, y]: [number, number]): [number, number] => [
        x,
        y,
      ]),
    };
    const points: [number, number][] = chart.chart;
    const deltas: Float64Array = new Float64Array(2 * points.length);
    let low: number = Infinity;
    let high: number = -Infinity;
    let phase: number = points[0]?.[1] ?? 0;
    let first: number = phase;
    let last: number = phase;
    for (let k: number = 0; k < points.length; k++) {
      const a: [number, number] = points[k]!;
      const b: [number, number] = points[(k + 1) % points.length]!;
      deltas[2 * k] = b[0] - a[0];
      deltas[2 * k + 1] = AutoMovieSolidCycle.shift(b[1], a[1], period) - a[1];
      low = Math.min(low, a[0]);
      high = Math.max(high, a[0]);
      first = Math.min(first, phase);
      last = Math.max(last, phase);
      phase += deltas[2 * k + 1]!;
    }
    // The loop's phases unwrapped along its own walk: a box in phase exists
    // only when they stay inside half a period, so every point's nearest lift
    // is the one the segments read.
    const narrow: boolean = period === undefined || last - first < period / 2;
    return {
      chart,
      side: AutoMovieSolidCycle.prepare(chart, period),
      deltas,
      box: [
        low,
        high,
        narrow ? (first + last) / 2 : 0,
        narrow ? (last - first) / 2 : Infinity,
      ],
    };
  }

  /**
   * Live metric reading after kept-side acceptance, preserving its original
   * operation order.
   */
  function minimum(
    loop: Pick<IAutoMovieSolidMesh.ILoop, "chart">,
    u: number,
    v: number,
    jet: IAutoMovieSolidSurface.IJet,
    margin: number,
    period: number | undefined,
  ): boolean {
    const E: number = dot(jet.u, jet.u);
    const F: number = dot(jet.u, jet.v);
    const G: number = dot(jet.v, jet.v);
    return distance(loop, u, v, E, F, G, period) >= margin;
  }

  /**
   * Full segment minimum; optional differences are the same subtractions
   * prepared once.
   */
  function distance(
    loop: Pick<IAutoMovieSolidMesh.ILoop, "chart">,
    u: number,
    v: number,
    E: number,
    F: number,
    G: number,
    period: number | undefined,
    deltas?: Float64Array,
  ): number {
    const n: number = loop.chart.length;
    let least: number = Infinity;
    for (let k: number = 0; k < n; k++) {
      const a: [number, number] = loop.chart[k]!;
      const raw: [number, number] = loop.chart[(k + 1) % n]!;
      const bv: number | undefined =
        deltas === undefined
          ? AutoMovieSolidCycle.shift(raw[1], a[1], period)
          : undefined;
      const w: number = AutoMovieSolidCycle.shift(v, a[1], period);
      least = Math.min(
        least,
        segment(
          u - a[0],
          w - a[1],
          deltas === undefined ? raw[0] - a[0] : deltas[2 * k]!,
          deltas === undefined ? bv! - a[1] : deltas[2 * k + 1]!,
          E,
          F,
          G,
        ),
      );
    }
    return least;
  }

  /** The metric distance from a chart offset to a chart segment, mm. */
  function segment(
    px: number,
    py: number,
    dx: number,
    dy: number,
    E: number,
    F: number,
    G: number,
  ): number {
    const dd: number = E * dx * dx + 2 * F * dx * dy + G * dy * dy;
    const pd: number = E * px * dx + F * (px * dy + py * dx) + G * py * dy;
    const t: number = dd > 0 ? Math.min(1, Math.max(0, pd / dd)) : 0;
    const x: number = px - t * dx;
    const y: number = py - t * dy;
    return Math.sqrt(Math.max(0, E * x * x + 2 * F * x * y + G * y * y));
  }
}

type Vec3 = AutoMovieVector3Tuple;
