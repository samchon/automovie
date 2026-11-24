import type { IAutoMovieMotionHumanQuadraticProgram } from "@automovie/interface";

import { HumanArmRefine } from "./HumanArmRefine";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";

/**
 * An arms' trajectory optimised on few knots and constrained on the whole frame
 * grid: the change of variables between the two.
 *
 * The trajectory played back is the knots' minimum-jerk interpolant
 * (`HumanArmRefine.hermite`), which is linear in the knots' coordinates: each
 * grid instant's coordinates are a weighted sum of the knots' (`x_g = sum_j
 * W[g][j] x_j`). So the model is evaluated and linearised at every grid
 * instant, as a frame-grid trajectory's is, and the resulting subproblem in the
 * grid's steps is carried onto the knots' by that linear map: `P_k = W' P W`,
 * `q_k = W' q`, and each row's coefficients times `W`. The optimiser then moves
 * the knots alone (TrajOpt plans an arm on eleven timesteps, Schulman et al.
 * 2013, section VI), while every constraint the film can show is a row of its
 * subproblem, so what it returns as feasible is feasible on the grid and
 * nothing is refined or solved again.
 */
export namespace HumanArmTrajectoryKnots {
  /**
   * The interpolant's weights: each grid instant's coordinates as a sum over
   * the knots.
   *
   * @param knots The knots' seconds, ascending.
   * @param grid The grid instants' seconds over the same span.
   * @returns For each grid instant, the weight of each knot.
   */
  export function weights(
    knots: readonly number[],
    grid: readonly number[],
  ): number[][] {
    // The interpolant is linear in the knots: its value for the identity's
    // rows, one coordinate per knot, is every knot's weight at once.
    const unit: number[][] = knots.map((_: number, i: number): number[] =>
      knots.map((__: number, j: number): number => (i === j ? 1 : 0)),
    );
    const curve: ReturnType<typeof HumanArmRefine.prepareHermite> =
      HumanArmRefine.prepareHermite(knots, unit);
    return grid.map((at: number): number[] => curve(at).coordinates);
  }

  /**
   * Every arm's coordinates at the grid instants, the knots' interpolant.
   *
   * @param knots The knots' seconds.
   * @param grid The grid instants' seconds.
   * @param x Each arm's coordinates at each knot.
   * @returns Each arm's coordinates at each grid instant.
   */
  export function read(
    knots: readonly number[],
    grid: readonly number[],
    x: readonly (readonly (readonly number[])[])[],
  ): number[][][] {
    return x.map((arm: readonly (readonly number[])[]): number[][] => {
      const curve: ReturnType<typeof HumanArmRefine.prepareHermite> =
        HumanArmRefine.prepareHermite(knots, arm);
      return grid.map((at: number): number[] => curve(at).coordinates);
    });
  }
  /**
   * Sample a local repair against the original clock. An interior end inherits
   * the original curve's central tangent. A true end keeps its rest tangent.
   * The caller admits the resulting grid after joining it to the outside rows.
   *
   * @param times The solved interval's ordered knot seconds.
   * @param x Each arm's solved coordinates at those knots.
   * @param grid The whole laid course's frame seconds.
   * @param laid The original coordinates used to measure each join's tangent.
   * @param from The first frame of the repair.
   * @param to The last frame of the repair.
   * @returns The repair's frame rows, including both unchanged endpoint poses.
   */
  export function splice(
    times: readonly number[],
    x: readonly (readonly (readonly number[])[])[],
    grid: readonly number[],
    laid: readonly (readonly (readonly number[])[])[],
    from: number,
    to: number,
  ): number[][][] {
    const played: number[][][] = read(times, grid.slice(from, to + 1), x);
    for (const endpoint of [from, to]) {
      if (endpoint === 0 || endpoint === grid.length - 1) continue;
      const start: boolean = endpoint === from;

      const edge: number = start ? times[1]! : times[times.length - 2]!;
      const width: number = Math.abs(edge - grid[endpoint]!);
      const dt: number = grid[endpoint + 1]! - grid[endpoint - 1]!;
      for (
        let g: number = start ? from + 1 : to - 1;
        start ? grid[g]! < edge : grid[g]! > edge;
        g += start ? 1 : -1
      ) {
        const u: number = (grid[g]! - grid[endpoint]!) / width;
        const basis: number = width * u * (1 - Math.abs(u)) ** 2;
        played.forEach((arm: number[][], a: number): void => {
          const source: readonly (readonly number[])[] = laid[a]!;
          const row: number[] = arm[g - from]!;
          for (let d: number = 0; d < row.length; ++d)
            row[d]! +=
              (basis *
                (source[endpoint + 1]![d]! - source[endpoint - 1]![d]!)) /
              dt;
        });
      }
    }
    return played;
  }

  /**
   * A grid subproblem carried onto the knots' steps.
   *
   * @param c The knots' context; the grid's has the same arms and coordinates.
   * @param w The interpolant's weights (`weights`).
   * @param model The subproblem in the grid's steps.
   * @returns The same subproblem in the knots' steps.
   */
  export function reduce(
    c: M.IContext,
    w: readonly (readonly number[])[],
    model: IAutoMovieMotionHumanQuadraticProgram.IProblem,
  ): IAutoMovieMotionHumanQuadraticProgram.IProblem {
    const width: number = c.width;
    const vars: number = (c.open ? c.n - 1 : c.n - 2) * width;

    // Each grid instant's moving knots and their weights.
    const spread: [number, number][][] = w.map(
      (row: readonly number[]): [number, number][] => {
        const out: [number, number][] = [];
        row.forEach((weight: number, j: number): void => {
          if (weight !== 0 && M.inner(c, j)) out.push([j, weight]);
        });
        return out;
      },
    );
    // The widest coupling the curvature can write: two grid instants it
    // couples touch knots between the least and the greatest of theirs.
    let wide: number = 0;
    for (let r: number = 0; r < model.n; ++r) {
      const from: [number, number][] = spread[Math.floor(r / width) + 1]!;
      const row: Float64Array = model.p[r]!;
      for (let off: number = 0; off < row.length && r + off < model.n; ++off) {
        if (row[off] === 0) continue;
        const to: [number, number][] =
          spread[Math.floor((r + off) / width) + 1]!;
        let least: number = Infinity;
        let most: number = -Infinity;
        for (const [j] of from) {
          least = Math.min(least, j);
          most = Math.max(most, j);
        }
        for (const [i] of to) {
          least = Math.min(least, i);
          most = Math.max(most, i);
        }
        if (most >= least)
          wide = Math.max(wide, (most - least + 1) * width - 1);
      }
    }
    wide = Math.min(wide, Math.max(0, vars - 1));
    // The curvature's upper band, `upper[a][b - a]` for `b >= a`: each
    // product lands in the cell it lands in the symmetric square, in the same
    // order, and a cell below the diagonal, which the band never reads, is
    // not written.
    const upper: Float64Array[] = Array.from(
      { length: vars },
      (): Float64Array => new Float64Array(wide + 1),
    );
    const q: Float64Array = new Float64Array(vars);
    for (let r: number = 0; r < model.n; ++r) {
      const from: [number, number][] = spread[Math.floor(r / width) + 1]!;
      const slot: number = r % width;
      for (const [j, weight] of from)
        q[(j - 1) * width + slot] =
          q[(j - 1) * width + slot]! + weight * model.q[r]!;
      const row: Float64Array = model.p[r]!;
      for (let off: number = 0; off < row.length && r + off < model.n; ++off) {
        const value: number = row[off]!;
        if (value === 0) continue;
        const to: [number, number][] =
          spread[Math.floor((r + off) / width) + 1]!;
        const other: number = (r + off) % width;
        for (const [j, wj] of from)
          for (const [i, wi] of to) {
            const a: number = (j - 1) * width + slot;
            const b: number = (i - 1) * width + other;
            if (b >= a) upper[a]![b - a] = upper[a]![b - a]! + value * wj * wi;
            if (off !== 0 && a >= b)
              upper[b]![a - b] = upper[b]![a - b]! + value * wj * wi;
          }
      }
    }
    const rows: IAutoMovieMotionHumanQuadraticProgram.IRow[] = [];
    for (const row of model.rows) {
      const sum: Map<number, number> = new Map();
      row.index.forEach((r: number, at: number): void => {
        const slot: number = r % width;
        for (const [j, weight] of spread[Math.floor(r / width) + 1]!) {
          const a: number = (j - 1) * width + slot;
          sum.set(a, (sum.get(a) ?? 0) + weight * row.coef[at]!);
        }
      });
      if (sum.size === 0) continue;
      const index: number[] = [...sum.keys()].sort(
        (a: number, b: number): number => a - b,
      );
      rows.push({
        ...row,
        index,
        coef: index.map((a: number): number => sum.get(a)!),
      });
    }

    // The band holds the curvature's farthest entry and every row's span,
    // since the solver's reduced system couples a row's variables.
    let band: number = 0;
    for (let a: number = 0; a < vars; ++a)
      for (let off: number = wide; off > band; --off)
        if (upper[a]![off] !== 0) {
          band = off;
          break;
        }
    for (const row of rows)
      band = Math.max(band, row.index[row.index.length - 1]! - row.index[0]!);
    const p: Float64Array[] = Array.from(
      { length: vars },
      (_: unknown, a: number): Float64Array => {
        const row: Float64Array = new Float64Array(band + 1);
        for (let off: number = 0; off <= band && a + off < vars; ++off)
          row[off] = off <= wide ? upper[a]![off]! : 0;
        return row;
      },
    );
    return { n: vars, band, p, q, rows };
  }
}
