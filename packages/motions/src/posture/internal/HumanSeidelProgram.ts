/*
 * Seidel's linear programs in one and two variables as TOPP-RA's default solver
 * solves them, ported from github.com/hungpham2511/toppra
 * cpp/src/toppra/solver/seidel-internal.hpp (`solve_lp1d`) and
 * cpp/src/toppra/solver/seidel.cpp (`solve_lp2d`, `presolve`, `value`) at
 * commit 8a2a9252e42089f1082d8d5d69b9852f32d0b338 (MIT, Copyright (c) 2017 Hung
 * Pham). Seidel's algorithm (Seidel 1991, "Small-dimensional linear programming
 * and convex hulls made easy", Discrete Comput. Geom. 6:423) adds the
 * constraints one at a time and, where the optimum so far violates one, solves
 * the one-variable program on that constraint's line.
 *
 * A row `[a, b, c]` is the constraint `a x0 + b x1 + c <= 0`; the one-variable
 * rows `[a, b]` are `a x + b <= 0`.
 */
export namespace HumanSeidelProgram {
  /*
   * A two-variable constraint row, `a x0 + b x1 + c <= 0`.
   */
  export type Row = [number, number, number];

  /*
   * A one-variable constraint row, `a x + b <= 0`.
   */
  export type Line = [number, number];

  /*
   * A pair of values, one per variable.
   */
  export type Pair = [number, number];

  /*
   * A one-variable solution (`LpSol1d`).
   */
  export interface ISolution1 {
    /*
     * Whether the program is feasible.
     */
    feasible: boolean;

    /*
     * The optimal variable, meaningful when feasible.
     */
    optvar: number;
  }

  /*
   * A two-variable solution (`LpSol`).
   */
  export interface ISolution2 {
    /*
     * Whether the program is feasible.
     */
    feasible: boolean;

    /*
     * The optimal variables, meaningful when feasible.
     */
    optvar: Pair;
  }

  /*
   * The relative violation the solver tolerates (`REL_TOLERANCE`).
   */
  export const REL_TOLERANCE: number = 1e-10;

  /*
   * The absolute violation the solver tolerates (`ABS_TOLERANCE`).
   */
  export const ABS_TOLERANCE: number = 1e-13;

  /*
   * `max v[0] x + v[1]` subject to `A [x 1] <= 0` (`solve_lp1d`).
   * Parameter v: The objective.
   * Parameter A: The rows.
   * Returns: The solution.
   */
  export function solve1(v: Readonly<Line>, A: readonly Line[]): ISolution1 {
    let curMin: number = -Infinity;
    let curMax: number = Infinity;
    const maximize: boolean = v[0] > 0;
    for (const [a, b] of A) {
      if (b * REL_TOLERANCE > Math.abs(a)) {
        if (Math.abs(a) === 0 && b < ABS_TOLERANCE) continue;
        return INFEASIBLE_1D;
      }
      if (a > 0) {
        if (a * curMax + b > 0) curMax = Math.min(-b / a, curMax);
      } else if (a < 0 && a * curMin + b > 0) curMin = Math.max(-b / a, curMin);
    }

    // Bounds crossed by no more than twice the absolute tolerance are widened
    // so that rounding alone does not make the program infeasible.
    if (curMax < curMin && curMin - curMax < 2 * ABS_TOLERANCE) {
      curMin -= ABS_TOLERANCE;
      curMax += ABS_TOLERANCE;
    }
    if (
      curMin - curMax >
        Math.max(Math.abs(curMin), Math.abs(curMax)) * REL_TOLERANCE ||
      curMin === Infinity ||
      curMax === -Infinity
    )
      return INFEASIBLE_1D;

    if (v[0] === 0) {
      if (curMin !== -Infinity)
        return curMax !== Infinity
          ? { feasible: true, optvar: curMax / 2 + curMin / 2 }
          : { feasible: true, optvar: curMin };
      return { feasible: true, optvar: curMax };
    }
    return { feasible: true, optvar: maximize ? curMax : curMin };
  }

  /*
   * `max v' x` subject to `A [x' 1]' <= 0` and `low <= x <= high`
   * (`solve_lp2d`).
   * Parameter v: The objective.
   * Parameter A: The rows.
   * Parameter low: The variables' lower bounds.
   * Parameter high: The variables' upper bounds.
   * Returns: The solution.
   */
  export function solve2(
    v: Readonly<Pair>,
    A: readonly Readonly<Row>[],
    low: Readonly<Pair>,
    high: Readonly<Pair>,
  ): ISolution2 {
    const current: Pair = [0, 0];

    // The fixed bounds: a variable whose bounds cross by no more than the
    // tolerance is held at their middle, leaving a one-variable program.
    for (let i: number = 0; i < 2; ++i) {
      if (low[i]! > high[i]!) {
        if (
          low[i]! - high[i]! >
            Math.max(
              2 * ABS_TOLERANCE,
              Math.max(Math.abs(low[i]!), Math.abs(high[i]!)) * REL_TOLERANCE,
            ) ||
          low[i] === Infinity ||
          high[i] === -Infinity
        )
          return INFEASIBLE_2D;
        const j: number = 1 - i;
        const optvar: Pair = [0, 0];
        optvar[i] = (low[i]! + high[i]!) / 2;
        const rows: Line[] = A.map(
          (row: Readonly<Row>): Line => [
            row[j]!,
            row[2] + optvar[i]! * row[i]!,
          ],
        );
        rows.push([-1, low[j]!], [1, -high[j]!]);
        const solved: ISolution1 = solve1([v[j]!, 0], rows);
        if (!solved.feasible) return INFEASIBLE_2D;
        optvar[j] = solved.optvar;
        return { feasible: true, optvar };
      }
      current[i] = v[i]! > 0 ? high[i]! : low[i]!;
    }

    // The linear rows, one at a time.
    for (let i: number = 0; i < A.length; ++i) {
      const row: Readonly<Row> = A[i]!;
      if (value(row, current) < ABS_TOLERANCE) continue;

      // The origin projected onto the row's line, and the line's direction.
      const norm: number = row[0] * row[0] + row[1] * row[1];
      const zero: Pair = [(row[0] * -row[2]) / norm, (row[1] * -row[2]) / norm];
      const tangent: Pair = [-row[1], row[0]];
      const objective: Line = [v[0] * tangent[0] + v[1] * tangent[1], 0];

      // Every earlier row and the four bounds, projected onto the line.
      const rows: Line[] = [];
      for (let j: number = 0; j < i; ++j)
        rows.push(project(A[j]!, tangent, zero));
      rows.push(project([-1, 0, low[0]], tangent, zero));
      rows.push(project([1, 0, -high[0]], tangent, zero));
      rows.push(project([0, -1, low[1]], tangent, zero));
      rows.push(project([0, 1, -high[1]], tangent, zero));

      const solved: ISolution1 = solve1(objective, rows);
      if (!solved.feasible) return INFEASIBLE_2D;
      current[0] = zero[0] + solved.optvar * tangent[0];
      current[1] = zero[1] + solved.optvar * tangent[1];
    }
    return { feasible: true, optvar: current };
  }

  /*
   * Presolve rows from `first` on, in place (`presolve`): each row is
   * normalised; a row on one variable is folded into that variable's bound; of
   * rows with the same direction only the tightest is kept. A removed row
   * becomes `[0, 0, -1]`.
   * Parameter A: The rows, changed in place.
   * Parameter low: The lower bounds, changed in place.
   * Parameter high: The upper bounds, changed in place.
   * Parameter first: The first row presolved.
   * Returns: False where a row on no variable cannot be met.
   */
  export function presolve(
    A: Row[],
    low: Pair,
    high: Pair,
    first: number,
  ): boolean {
    let feasible: boolean = true;
    for (let k: number = first; k < A.length; ++k) {
      const row: Row = A[k]!;
      const n: number = Math.sqrt(row[0] * row[0] + row[1] * row[1]);
      if (n === 0) {
        if (row[2] > ABS_TOLERANCE) feasible = false;
        else A[k] = [0, 0, -1];
        continue;
      }
      row[0] /= n;
      row[1] /= n;
      row[2] /= n;
      for (let j: number = 0; j < 2; ++j)
        if (row[1 - j] === 0) {
          if (row[j]! > 0) high[j] = Math.min(high[j]!, -row[2] / row[j]!);
          else low[j] = Math.max(low[j]!, -row[2] / row[j]!);
          A[k] = [0, 0, -1];
          break;
        }
    }

    for (let k: number = first; k < A.length; ++k) {
      if (A[k]![0] === 0 && A[k]![1] === 0) continue;
      for (let j: number = first; j < k; ++j) {
        if (
          (A[j]![0] === 0 && A[j]![1] === 0) ||
          Math.sqrt((A[j]![0] - A[k]![0]) ** 2 + (A[j]![1] - A[k]![1]) ** 2) >
            REL_TOLERANCE
        )
          continue;
        const looser: number = A[j]![2] < A[k]![2] ? j : k;
        A[looser] = [0, 0, -1];
        if (looser === k) break;
      }
    }
    return feasible;
  }

  /*
   * A row's value at a point, `c + a x0 + b x1`, a zero coefficient of an
   * infinite variable counted as zero (`value`).
   * Parameter row: The row.
   * Parameter x: The point.
   * Returns: The value.
   */
  export function value(row: Readonly<Row>, x: Readonly<Pair>): number {
    let result: number = row[2];
    for (let i: number = 0; i < 2; ++i)
      result += row[i] === 0 ? 0 : row[i]! * x[i]!;
    return result;
  }
}

/*
 * The infeasible one-variable solution.
 */
const INFEASIBLE_1D: HumanSeidelProgram.ISolution1 = {
  feasible: false,
  optvar: NaN,
};

/*
 * The infeasible two-variable solution.
 */
const INFEASIBLE_2D: HumanSeidelProgram.ISolution2 = {
  feasible: false,
  optvar: [NaN, NaN],
};

/*
 * A row projected onto the line `zero + t tangent`
 * (`internal::project_linear_constraint`).
 */
function project(
  row: Readonly<HumanSeidelProgram.Row>,
  tangent: Readonly<HumanSeidelProgram.Pair>,
  zero: Readonly<HumanSeidelProgram.Pair>,
): HumanSeidelProgram.Line {
  return [
    row[0] * tangent[0] + row[1] * tangent[1],
    HumanSeidelProgram.value(row, zero),
  ];
}
