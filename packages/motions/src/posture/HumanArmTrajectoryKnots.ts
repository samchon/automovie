import type { IAutoMovieMotionHumanQuadraticProgram } from "@automovie/interface";

import { HumanArmRefine } from "./HumanArmRefine";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanMinimumJerkSpline } from "./HumanMinimumJerkSpline";

/**
 * An arms' trajectory optimised on few knots and constrained on the whole frame
 * grid: the change of variables between the two.
 *
 * Each knot carries its own position, velocity and acceleration, and two
 * neighbouring knots are joined by the minimum-jerk quintic that meets both
 * knots' three (Flash and Hogan 1985; `basis`), so the course is C2 at every
 * knot by construction and linear in the knots' values: each grid instant's
 * coordinates are a weighted sum of its segment's two knots' six values (`x_g =
 * sum W[g][j, b] x_(j, b)`), and the subproblem on the knots stays banded. So
 * the model is evaluated and linearised at every grid instant, as a frame-grid
 * trajectory's is, and the resulting subproblem in the grid's steps is carried
 * onto the knots' by that linear map: `P_k = W' P W`, `q_k = W' q`, and each
 * row's coefficients times `W`. The optimiser then moves the knots alone
 * (TrajOpt plans an arm on eleven timesteps, Schulman et al. 2013, section VI),
 * while every constraint the film can show is a row of its subproblem, so what
 * it returns as feasible is feasible on the grid and nothing is refined or
 * solved again.
 */
export namespace HumanArmTrajectoryKnots {
  /**
   * The interpolant's weights: each grid instant's coordinates as a sum over
   * the two knots of its segment, each knot's position, velocity and
   * acceleration (`IWeight.block` 0, 1 and 2), the quintic that meets both
   * knots' position, velocity and acceleration (`basis`), so a grid instant
   * reads six of the knots' values and the subproblem on the knots stays
   * banded.
   *
   * @param knots The knots' seconds, ascending.
   * @param grid The grid instants' seconds over the same span.
   * @returns For each grid instant, the weight of each knot value it reads.
   */
  export function weights(
    knots: readonly number[],
    grid: readonly number[],
  ): IWeight[][] {
    return grid.map((at: number): IWeight[] => {
      const i: number = segment(knots, at);
      const h: number = knots[i + 1]! - knots[i]!;
      const u: number = Math.min(1, Math.max(0, (at - knots[i]!) / h));
      const [h0, h1, h2, h3, h4, h5]: number[] = basis(u, 0);
      return [
        { knot: i, block: 0, weight: h0! },
        { knot: i, block: 1, weight: h * h1! },
        { knot: i, block: 2, weight: h * h * h2! },
        { knot: i + 1, block: 0, weight: h3! },
        { knot: i + 1, block: 1, weight: h * h4! },
        { knot: i + 1, block: 2, weight: h * h * h5! },
      ].filter((w: IWeight): boolean => w.weight !== 0);
    });
  }

  /** One knot value's weight in a grid instant's coordinates. */
  export interface IWeight {
    /** The knot. */
    knot: number;
    /** Its position (0), velocity (1) or acceleration (2). */
    block: number;
    /** The weight. */
    weight: number;
  }

  /** Each arm's velocities and accelerations at each knot, per second. */
  export interface IRates {
    /** Each arm's velocity at each knot, coordinate units a second. */
    velocities: number[][][];
    /** Each arm's acceleration at each knot, coordinate units a second². */
    accelerations: number[][][];
  }

  /**
   * The rates a course of positions starts from: the minimum-jerk spline's
   * through them (`HumanMinimumJerkSpline.derivatives`), at rest at its ends,
   * the seed of the knots' own velocities and accelerations, which the
   * optimiser then moves.
   *
   * @param knots The knots' seconds.
   * @param x Each arm's coordinates at each knot.
   * @returns Their rates.
   */
  export function rates(
    knots: readonly number[],
    x: readonly (readonly (readonly number[])[])[],
  ): IRates {
    const solved: HumanMinimumJerkSpline.IDerivatives[] = x.map(
      (
        arm: readonly (readonly number[])[],
      ): HumanMinimumJerkSpline.IDerivatives =>
        HumanMinimumJerkSpline.derivatives(knots, arm),
    );
    return {
      velocities: solved.map(
        (s: HumanMinimumJerkSpline.IDerivatives): number[][] =>
          s.velocities.map((v: readonly number[]): number[] => [...v]),
      ),
      accelerations: solved.map(
        (s: HumanMinimumJerkSpline.IDerivatives): number[][] =>
          s.accelerations.map((v: readonly number[]): number[] => [...v]),
      ),
    };
  }

  /**
   * An arm's position, velocity and acceleration at a second on its knots'
   * quintics: the knots' own rates carried onto other knots exactly.
   *
   * @param knots The knots' seconds.
   * @param x The arm's coordinates at each knot.
   * @param velocities Its velocity at each knot.
   * @param accelerations Its acceleration at each knot.
   * @param seconds The second.
   * @returns Its position, velocity and acceleration there.
   */
  export function at(
    knots: readonly number[],
    x: readonly (readonly number[])[],
    velocities: readonly (readonly number[])[],
    accelerations: readonly (readonly number[])[],
    seconds: number,
  ): [number[], number[], number[]] {
    const i: number = segment(knots, seconds);
    const h: number = knots[i + 1]! - knots[i]!;
    const u: number = Math.min(1, Math.max(0, (seconds - knots[i]!) / h));
    const out: number[][] = [0, 1, 2].map((order: number): number[] => {
      const w: number[] = basis(u, order);
      const scale: number = h ** -order;
      return x[i]!.map(
        (_: number, d: number): number =>
          scale *
          (w[0]! * x[i]![d]! +
            w[1]! * h * velocities[i]![d]! +
            w[2]! * h * h * accelerations[i]![d]! +
            w[3]! * x[i + 1]![d]! +
            w[4]! * h * velocities[i + 1]![d]! +
            w[5]! * h * h * accelerations[i + 1]![d]!),
      );
    });
    return [out[0]!, out[1]!, out[2]!];
  }
  /**
   * Every arm's coordinates at the grid instants: on the knots' own quintics
   * where their rates are given, else on the minimum-jerk spline through the
   * positions.
   *
   * @param knots The knots' seconds.
   * @param grid The grid instants' seconds.
   * @param x Each arm's coordinates at each knot.
   * @param rates Each arm's velocities and accelerations at each knot.
   * @returns Each arm's coordinates at each grid instant.
   */
  export function read(
    knots: readonly number[],
    grid: readonly number[],
    x: readonly (readonly (readonly number[])[])[],
    rates?: IRates,
  ): number[][][] {
    return x.map(
      (arm: readonly (readonly number[])[], a: number): number[][] => {
        if (rates !== undefined)
          return grid.map(
            (t: number): number[] =>
              at(
                knots,
                arm,
                rates.velocities[a]!,
                rates.accelerations[a]!,
                t,
              )[0],
          );
        const curve: ReturnType<typeof HumanArmRefine.prepareHermite> =
          HumanArmRefine.prepareHermite(knots, arm);
        return grid.map((t: number): number[] => curve(t).coordinates);
      },
    );
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
   * @returns The same subproblem in the knots' steps: each moving knot's
   *   position, velocity and acceleration steps, `3 width` of them a knot.
   */
  export function reduce(
    c: M.IContext,
    w: readonly (readonly IWeight[])[],
    model: IAutoMovieMotionHumanQuadraticProgram.IProblem,
  ): IAutoMovieMotionHumanQuadraticProgram.IProblem {
    const width: number = c.width;
    const stride: number = 3 * width;
    const vars: number = (c.open ? c.n - 1 : c.n - 2) * stride;

    // Each grid instant's moving knot values, as each one's first variable
    // within the knots' steps and its weight; a fixed knot's never move.
    const spread: [number, number][][] = w.map(
      (row: readonly IWeight[]): [number, number][] =>
        row
          .filter((v: IWeight): boolean => M.inner(c, v.knot))
          .map((v: IWeight): [number, number] => [
            (v.knot - 1) * stride + v.block * width,
            v.weight,
          ]),
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
        if (most >= least) wide = Math.max(wide, most - least + width - 1);
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
        q[j + slot] = q[j + slot]! + weight * model.q[r]!;
      const row: Float64Array = model.p[r]!;
      for (let off: number = 0; off < row.length && r + off < model.n; ++off) {
        const value: number = row[off]!;
        if (value === 0) continue;
        const to: [number, number][] =
          spread[Math.floor((r + off) / width) + 1]!;
        const other: number = (r + off) % width;
        for (const [j, wj] of from)
          for (const [i, wi] of to) {
            const a: number = j + slot;
            const b: number = i + other;
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
          const a: number = j + slot;
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

/**
 * The segment a second lies in: the last knot at or before it, short of the
 * last.
 */
function segment(knots: readonly number[], seconds: number): number {
  let low: number = 0;
  let high: number = knots.length - 2;
  while (low < high) {
    const middle: number = (low + high + 1) >> 1;
    if (knots[middle]! <= seconds) low = middle;
    else high = middle - 1;
  }
  return low;
}

/**
 * The quintic Hermite basis of a minimum-jerk segment (Flash and Hogan 1985, J.
 * Neurosci. 5(7):1688): the quintic that meets both ends' position, velocity
 * and acceleration, `p0 H0 + h v0 H1 + h² a0 H2 + p1 H3 + h v1 H4 + h² a1 H5`
 * over a segment of `h` seconds at its share `u`, or its first or second
 * derivative in `u`.
 */
function basis(u: number, order: number): number[] {
  const u2: number = u * u;
  const u3: number = u2 * u;
  const u4: number = u3 * u;
  const u5: number = u4 * u;
  if (order === 0)
    return [
      1 - 10 * u3 + 15 * u4 - 6 * u5,
      u - 6 * u3 + 8 * u4 - 3 * u5,
      0.5 * u2 - 1.5 * u3 + 1.5 * u4 - 0.5 * u5,
      10 * u3 - 15 * u4 + 6 * u5,
      -4 * u3 + 7 * u4 - 3 * u5,
      0.5 * u3 - u4 + 0.5 * u5,
    ];
  if (order === 1)
    return [
      -30 * u2 + 60 * u3 - 30 * u4,
      1 - 18 * u2 + 32 * u3 - 15 * u4,
      u - 4.5 * u2 + 6 * u3 - 2.5 * u4,
      30 * u2 - 60 * u3 + 30 * u4,
      -12 * u2 + 28 * u3 - 15 * u4,
      1.5 * u2 - 4 * u3 + 2.5 * u4,
    ];
  return [
    -60 * u + 180 * u2 - 120 * u3,
    -36 * u + 96 * u2 - 60 * u3,
    1 - 9 * u + 18 * u2 - 10 * u3,
    60 * u - 180 * u2 + 120 * u3,
    -24 * u + 84 * u2 - 60 * u3,
    3 * u - 12 * u2 + 10 * u3,
  ];
}
