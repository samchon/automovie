import type { IAutoMovieMotionHumanQuadraticProgram } from "@automovie/interface";

import { HumanArmRefine } from "./HumanArmRefine";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";

/**
 * An arms' trajectory optimised on few knots and constrained on the whole
 * frame grid: the change of variables between the two.
 *
 * The trajectory played back is the knots' cubic Hermite interpolant
 * (`HumanArmRefine.hermite`), which is linear in the knots' coordinates:
 * each grid instant's coordinates are a weighted sum of at most four knots'
 * (`x_g = sum_j W[g][j] x_j`). So the model is evaluated and linearised at
 * every grid instant, as a frame-grid trajectory's is, and the resulting
 * subproblem in the grid's steps is carried onto the knots' by that linear
 * map: `P_k = W' P W`, `q_k = W' q`, and each row's coefficients times `W`.
 * The optimiser then moves the knots alone (TrajOpt plans an arm on eleven
 * timesteps, Schulman et al. 2013, section VI), while every constraint the
 * film can show is a row of its subproblem, so what it returns as feasible
 * is feasible on the grid and nothing is refined or solved again.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the interpolant's linearity, the change of variables of the objective and the rows, and what it buys.
 * @evidence contracts/development/design.md#principled-representation The map is the interpolant's own weights, one row a grid instant, a column a knot, the same for every coordinate.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The weights, the interpolated coordinates and the reduced subproblem, read by `HumanArmOptimiser` alone.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No constraint is dropped or thinned: every grid row is carried over; only a row left with no knot to move is omitted.
 */
export namespace HumanArmTrajectoryKnots {
  /**
   * The moving-knot weights for interpolating a step at each grid instant.
   *
   * @param c The knot count, ascending knot times in seconds and whether the last knot can move.
   * @param grid The grid instants' seconds over the same span.
   * @returns Each grid instant's nonzero weights at moving knots, in ascending knot order.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States inputs, units and the result's shape.
   * @evidence contracts/development/implementation.md#principled-implementation The interpolant is linear in its knots, so its value on a knot's unit sequence is that knot's weight; read from `HumanArmRefine.hermite` itself, the weights cannot drift from the played interpolant.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Reads the unit sequences of the bracket and its two tangent neighbours.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No weight is assumed: end knots' zero tangents and uneven knot spacing come out of the interpolant's own reading.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most four scalar Hermite evaluations per grid instant, only for the moving knots in its window. The flat table has room for four moving entries per instant.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each solve builds the ordered moving support once and reuses it for every convexification.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh table and retains nothing.
   */
  export function weights(
    c: Pick<M.IContext, "times" | "n" | "open">,
    grid: readonly number[],
  ): IAutoMovieArmKnotSupport {
    const starts: Int32Array = new Int32Array(grid.length + 1);
    const knots: Int32Array = new Int32Array(4 * grid.length);
    const weights: Float64Array = new Float64Array(knots.length);
    let length: number = 0;
    windows(c.times, grid).forEach((window: IWindow, g: number): void => {
      for (let j: number = 0; j < window.times.length; ++j) {
        const knot: number = window.first + j;
        if (!M.inner(c, knot)) continue;
        const unit: number[][] = window.times.map(
          (_: number, i: number): number[] => [i === j ? 1 : 0],
        );
        const weight: number = HumanArmRefine.hermite(
          window.times,
          unit,
          window.at,
        )[0]!;
        if (weight === 0) continue;
        knots[length] = knot;
        weights[length] = weight;
        ++length;
      }
      starts[g + 1] = length;
    });
    return { starts, knots, weights };
  }

  /**
   * Every arm's coordinates at the grid instants, the knots' interpolant.
   *
   * @param knots The knots' seconds.
   * @param grid The grid instants' seconds.
   * @param x Each arm's coordinates at each knot.
   * @returns Each arm's coordinates at each grid instant.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States inputs and result.
   * @evidence contracts/development/implementation.md#principled-implementation The played interpolant itself, `HumanArmRefine.hermite`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One interpolation an arm and grid instant.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None: the reading playback makes.
   * @evidence contracts/development/implementation.md#efficient-algorithms G interpolations an arm.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh arrays and retains nothing.
   */
  export function read(
    knots: readonly number[],
    grid: readonly number[],
    x: readonly (readonly (readonly number[])[])[],
  ): number[][][] {
    const spans: IWindow[] = windows(knots, grid);
    return x.map((arm: readonly (readonly number[])[]): number[][] =>
      spans.map((span: IWindow): number[] =>
        HumanArmRefine.hermite(span.times, arm.slice(span.first, span.first + span.times.length), span.at),
      ),
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation Identifies the original clock, interior joins, true ends and the reader that admits the joined rows.
   * @evidence contracts/development/implementation.md#principled-implementation Adds the cubic Hermite endpoint tangent basis in physical seconds on the adjacent interval using the laid course's original central difference.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Reads the regular knot interpolant and adjusts only samples inside an interval touching an interior join.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the input clock, coordinates at every knot, true endpoint conditions and whole-course admission.
   * @evidence contracts/development/implementation.md#efficient-algorithms Adds work linear in the number of coordinates and frame samples of the two boundary intervals.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the ordinary knot reader for positions and computes one scalar correction weight per affected sample.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Updates only fresh sampled rows and returns them without retaining the source course.
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
      for (let g: number = start ? from + 1 : to - 1;
        start ? grid[g]! < edge : grid[g]! > edge;
        g += start ? 1 : -1) {
        const u: number = (grid[g]! - grid[endpoint]!) / width;
        const basis: number = width * u * (1 - Math.abs(u)) ** 2;
        played.forEach((arm: number[][], a: number): void => {
          const source: readonly (readonly number[])[] = laid[a]!;
          const row: number[] = arm[g - from]!;
          for (let d: number = 0; d < row.length; ++d)
            row[d]! += basis *
              (source[endpoint + 1]![d]! - source[endpoint - 1]![d]!) / dt;
        });
      }
    }
    return played;
  }

  /**
   * A grid subproblem carried onto the knots' steps.
   *
   * @param c The knots' context; the grid's has the same arms and coordinates.
   * @param spread The ordered moving knots and their weights from `weights`.
   * @param model The subproblem in the grid's steps.
   * @returns The same subproblem in the knots' steps.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the contexts, the map and the result.
   * @evidence contracts/development/implementation.md#principled-implementation With the grid's step `d = W s` for the knots' step `s`: `1/2 d'Pd + q'd = 1/2 s'(W'PW)s + (W'q)'s` and a row `a.d` is `(aW).s`; a knot the problem holds fixed takes no step, so its column is left out. The grid's upper band is read as the symmetric matrix it stores.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Reads the prepared moving knots to carry the curvature, the gradient and the rows in turn.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Projects every row in its original order. A row is omitted only when none of its grid variables has a moving-knot weight.
   * @evidence contracts/development/implementation.md#efficient-algorithms The grid band's stored entries times at most sixteen knot pairs each, into the knots' upper band of the widest coupling those pairs can write (V x W doubles for V variables, not V x V), whose nonzero band is then read off. Constraint rows share one pair of scratch arrays of length V and clear only touched variables.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each linearisation reads the solve's unchanged interpolation support directly. Each constraint row reuses the accumulation arrays after the preceding row clears its entries.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The temporary upper band and row scratch become eligible for collection on return. The caller owns the projected subproblem.
   */
  export function reduce(
    c: M.IContext,
    spread: IAutoMovieArmKnotSupport,
    model: IAutoMovieMotionHumanQuadraticProgram.IProblem,
  ): IAutoMovieMotionHumanQuadraticProgram.IProblem {
    const { starts, knots, weights } = spread;
    const width: number = c.width;
    const vars: number = (c.open ? c.n - 1 : c.n - 2) * width;

    // The widest coupling the curvature can write: two grid instants it
    // couples touch knots between the least and the greatest of theirs.
    let wide: number = 0;
    for (let r: number = 0; r < model.n; ++r) {
      const from: number = Math.floor(r / width) + 1;
      const first: number = starts[from]!;
      const next: number = starts[from + 1]!;
      const row: Float64Array = model.p[r]!;
      for (let off: number = 0; off < row.length && r + off < model.n; ++off) {
        if (row[off] === 0) continue;
        const to: number = Math.floor((r + off) / width) + 1;
        const begin: number = starts[to]!;
        const end: number = starts[to + 1]!;
        const least: number = Math.min(
          first < next ? knots[first]! : Infinity,
          begin < end ? knots[begin]! : Infinity,
        );
        const most: number = Math.max(
          first < next ? knots[next - 1]! : -Infinity,
          begin < end ? knots[end - 1]! : -Infinity,
        );
        if (most >= least) wide = Math.max(wide, (most - least + 1) * width - 1);
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
      const from: number = Math.floor(r / width) + 1;
      const first: number = starts[from]!;
      const next: number = starts[from + 1]!;
      const slot: number = r % width;
      for (let j: number = first; j < next; ++j) {
        const a: number = (knots[j]! - 1) * width + slot;
        q[a] = q[a]! + weights[j]! * model.q[r]!;
      }
      const row: Float64Array = model.p[r]!;
      for (let off: number = 0; off < row.length && r + off < model.n; ++off) {
        const value: number = row[off]!;
        if (value === 0) continue;
        const to: number = Math.floor((r + off) / width) + 1;
        const begin: number = starts[to]!;
        const end: number = starts[to + 1]!;
        const other: number = (r + off) % width;
        for (let j: number = first; j < next; ++j)
          for (let i: number = begin; i < end; ++i) {
            const a: number = (knots[j]! - 1) * width + slot;
            const b: number = (knots[i]! - 1) * width + other;
            const wj: number = weights[j]!;
            const wi: number = weights[i]!;
            if (b >= a) upper[a]![b - a] = upper[a]![b - a]! + value * wj * wi;
            if (off !== 0 && a >= b)
              upper[b]![a - b] = upper[b]![a - b]! + value * wj * wi;
          }
      }
    }
    const rows: IAutoMovieMotionHumanQuadraticProgram.IRow[] = [];
    // Each row visits the grid coefficients in their original order. Track
    // touched variables separately so cancellation preserves a zero coefficient.
    const sums: Float64Array = new Float64Array(vars);
    const seen: Uint8Array = new Uint8Array(vars);
    for (const row of model.rows) {
      const index: number[] = [];
      row.index.forEach((r: number, at: number): void => {
        const slot: number = r % width;
        const frame: number = Math.floor(r / width) + 1;
        const end: number = starts[frame + 1]!;
        for (let j: number = starts[frame]!; j < end; ++j) {
          const a: number = (knots[j]! - 1) * width + slot;
          if (seen[a] === 0) {
            seen[a] = 1;
            index.push(a);
          }
          sums[a] = sums[a]! + weights[j]! * row.coef[at]!;
        }
      });
      if (index.length === 0) continue;
      index.sort((a: number, b: number): number => a - b);
      const coef: number[] = index.map((a: number): number => {
        const value: number = sums[a]!;
        sums[a] = 0;
        seen[a] = 0;
        return value;
      });
      rows.push({ ...row, index, coef });
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

/** Grid support in row order, with each row's moving knots in ascending order. */
interface IAutoMovieArmKnotSupport {
  /** Offset of each grid row and one final one-past-end sentinel. */
  readonly starts: Int32Array;
  /** Knot indices in ascending order within each row. */
  readonly knots: Int32Array;
  /** The same Hermite weights in the corresponding knot slots. */
  readonly weights: Float64Array;
}

/** Four consecutive knots suffice for the two endpoint values and both centred tangents. */
interface IWindow {
  /** Offset into the full knot coordinate array. */
  first: number;
  /** The source times of this interval and its tangent neighbours. */
  times: readonly number[];
  /** The requested grid second. */
  at: number;
}

/** Locate the Hermite support in one forward traversal of the two sorted clocks. */
function windows(knots: readonly number[], grid: readonly number[]): IWindow[] {
  let bracket: number = 0;
  return grid.map((at: number): IWindow => {
    while (bracket + 2 < knots.length && knots[bracket + 1]! <= at) ++bracket;
    const first: number = Math.max(0, bracket - 1);
    return { first, times: knots.slice(first, bracket + 3), at };
  });
}
