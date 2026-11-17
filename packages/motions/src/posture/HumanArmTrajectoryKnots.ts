import { HumanArmRefine } from "./HumanArmRefine";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import type { HumanQuadraticProgram as QP } from "./HumanQuadraticProgram";

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
   * The interpolant's weights: each grid instant's coordinates as a sum over
   * the knots.
   *
   * @param knots The knots' seconds, ascending.
   * @param grid The grid instants' seconds over the same span.
   * @returns For each grid instant, the weight of each knot.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States inputs, units and the result's shape.
   * @evidence contracts/development/implementation.md#principled-implementation The interpolant is linear in its knots, so its value on a knot's unit sequence is that knot's weight; read from `HumanArmRefine.hermite` itself, the weights cannot drift from the played interpolant.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One interpolation a knot and grid instant.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No weight is assumed: end knots' zero tangents and uneven knot spacing come out of the interpolant's own reading.
   * @evidence contracts/development/implementation.md#efficient-algorithms G grid instants times K knots interpolations, once a solve.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading computed once by its caller.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh table and retains nothing.
   */
  export function weights(
    knots: readonly number[],
    grid: readonly number[],
  ): number[][] {
    const units: number[][][] = knots.map((_: number, j: number): number[][] =>
      knots.map((__: number, i: number): number[] => [i === j ? 1 : 0]),
    );
    return grid.map((t: number): number[] =>
      units.map(
        (unit: number[][]): number => HumanArmRefine.hermite(knots, unit, t)[0]!,
      ),
    );
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
    return x.map((arm: readonly (readonly number[])[]): number[][] =>
      grid.map((t: number): number[] => HumanArmRefine.hermite(knots, arm, t)),
    );
  }

  /**
   * A grid subproblem carried onto the knots' steps.
   *
   * @param c The knots' context; the grid's has the same arms and coordinates.
   * @param w The interpolant's weights (`weights`).
   * @param model The subproblem in the grid's steps.
   * @returns The same subproblem in the knots' steps.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the contexts, the map and the result.
   * @evidence contracts/development/implementation.md#principled-implementation With the grid's step `d = W s` for the knots' step `s`: `1/2 d'Pd + q'd = 1/2 s'(W'PW)s + (W'q)'s` and a row `a.d` is `(aW).s`; a knot the problem holds fixed takes no step, so its column is left out. The grid's upper band is read as the symmetric matrix it stores.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The weights of each grid instant's moving knots, then the curvature, the gradient and the rows in turn.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every row is carried; one whose coefficients all fall on fixed knots constrains no step and is omitted.
   * @evidence contracts/development/implementation.md#efficient-algorithms The grid band's stored entries times at most sixteen knot pairs each, into a dense square of the knots' few variables, whose band is then read off.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each linearisation is carried once.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The dense square is released on return; the returned subproblem is the caller's.
   */
  export function reduce(
    c: M.IContext,
    w: readonly (readonly number[])[],
    model: QP.IProblem,
  ): QP.IProblem {
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
    const dense: Float64Array = new Float64Array(vars * vars);
    const q: Float64Array = new Float64Array(vars);
    for (let r: number = 0; r < model.n; ++r) {
      const from: [number, number][] = spread[Math.floor(r / width) + 1]!;
      const slot: number = r % width;
      for (const [j, weight] of from)
        q[(j - 1) * width + slot] = q[(j - 1) * width + slot]! + weight * model.q[r]!;
      const row: Float64Array = model.p[r]!;
      for (let off: number = 0; off < row.length && r + off < model.n; ++off) {
        const value: number = row[off]!;
        if (value === 0) continue;
        const to: [number, number][] = spread[Math.floor((r + off) / width) + 1]!;
        const other: number = (r + off) % width;
        for (const [j, wj] of from)
          for (const [i, wi] of to) {
            const a: number = (j - 1) * width + slot;
            const b: number = (i - 1) * width + other;
            dense[a * vars + b] = dense[a * vars + b]! + value * wj * wi;
            if (off !== 0) dense[b * vars + a] = dense[b * vars + a]! + value * wj * wi;
          }
      }
    }
    const rows: QP.IRow[] = [];
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
      for (let b: number = vars - 1; b > a + band; --b)
        if (dense[a * vars + b] !== 0) {
          band = b - a;
          break;
        }
    for (const row of rows)
      band = Math.max(band, row.index[row.index.length - 1]! - row.index[0]!);
    const p: Float64Array[] = Array.from(
      { length: vars },
      (_: unknown, a: number): Float64Array => {
        const row: Float64Array = new Float64Array(band + 1);
        for (let off: number = 0; off <= band && a + off < vars; ++off)
          row[off] = dense[a * vars + a + off]!;
        return row;
      },
    );
    return { n: vars, band, p, q, rows };
  }
}
