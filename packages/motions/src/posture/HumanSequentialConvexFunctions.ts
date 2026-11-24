import type {
  IAutoMovieMotionHumanQuadraticProgram,
  IAutoMovieMotionHumanSequentialConvex,
} from "@automovie/interface";

import { HumanQuadraticProgram as QP } from "./HumanQuadraticProgram";

/**
 * A problem stated as functions of a vector, convexified as trajopt's sco
 * convexifies one (github.com/joschu/trajopt at commit
 * 8da5bb00b690647318a12fa4f5dd7e6c8a0f501c, BSD-2-Clause, Copyright (c) 2013,
 * John Schulman): a cost by `CostFromFunc::convex` (src/sco/modeling_utils.cpp
 * lines 45-95), its gradient and diagonal Hessian by central differences or its
 * full Hessian by forward differences of the forward-difference gradient
 * (`calcGradAndDiagHess`, `calcGradHess`, src/sco/num_diff.cpp), the Hessian
 * symmetrised and kept on its non-negative eigenvalues; a constraint by
 * `ConstraintFromFunc::convex` (modeling_utils.cpp lines 152-166), linearised
 * by its forward-difference Jacobian (`calcForwardNumJac`) and priced at the
 * merit coefficient as `cntsToCosts` prices it (an equality's absolute value,
 * an inequality's hinge); the variables' bounds clamp the start
 * (`OptProb::getClosestFeasiblePoint`) and bound each step with the trust box
 * (`setTrustBoxConstraints`). Each convex model is solved by the interior-point
 * method (`HumanQuadraticProgram.interior`); a model it cannot solve is a
 * failed step. The result is a problem for `HumanSequentialConvex.minimise`.
 */
export namespace HumanSequentialConvexFunctions {
  /** A point: the variables' values. */
  export type Vector = readonly number[];

  /** A cost (`CostFromFunc`). */
  export interface ICost {
    /** The cost's value at a point. */
    f: (x: Vector) => number;

    /**
     * Whether it is convexified with its full Hessian (`full_hessian`); its
     * diagonal otherwise.
     */
    full: boolean;
  }

  /** A constraint function (`ConstraintFromFunc`). */
  export interface IConstraint {
    /** The constraint's values at a point: each 0, or each at most 0. */
    g: (x: Vector) => Vector;

    /**
     * Whether the values are equalities (`EQ`); inequalities `g <= 0` (`INEQ`)
     * otherwise.
     */
    equality: boolean;
  }

  /** A problem in functions. */
  export interface IFunctions {
    /** The costs, summed. */
    costs: readonly ICost[];

    /** The constraints. */
    constraints: readonly IConstraint[];

    /** Each variable's least value; `-Infinity` where unbounded. */
    low: Vector;

    /** Each variable's greatest value; `Infinity` where unbounded. */
    high: Vector;
  }

  /**
   * The problem the loop solves.
   *
   * @param functions The costs, the constraints and the bounds.
   * @returns The problem.
   */
  export function problem(
    functions: IFunctions,
  ): IAutoMovieMotionHumanSequentialConvex.IProblem<
    Vector,
    IAutoMovieMotionHumanSequentialConvex.IEvaluation
  > {
    return {
      closest: (x: Vector): Vector =>
        x.map((v: number, i: number): number =>
          Math.min(functions.high[i]!, Math.max(functions.low[i]!, v)),
        ),
      evaluate: (
        x: Vector,
      ): IAutoMovieMotionHumanSequentialConvex.IEvaluation =>
        evaluation(functions, x),
      convexify: (
        x: Vector,
        reading: IAutoMovieMotionHumanSequentialConvex.IEvaluation,
        coefficient: number,
      ): IAutoMovieMotionHumanSequentialConvex.IModel<Vector> =>
        model(functions, x, reading, coefficient),
    };
  }

  /**
   * `calcGradAndDiagHess` (num_diff.cpp): central differences of step `EPSILON
   * / 2` either side, the diagonal clipped at zero as `CostFromFunc::convex`
   * clips it.
   *
   * @param f The function.
   * @param x The point.
   * @returns The gradient and the Hessian, diagonal.
   */
  export function diagonalHessian(
    f: (x: Vector) => number,
    x: Vector,
  ): IDerivatives {
    const y: number = f(x);
    const n: number = x.length;
    const gradient: number[] = [];
    const hessian: number[][] = square(n);
    for (let i: number = 0; i < n; ++i) {
      const plus: number[] = [...x];
      const minus: number[] = [...x];
      plus[i] = x[i]! + EPSILON / 2;
      minus[i] = x[i]! - EPSILON / 2;
      const yplus: number = f(plus);
      const yminus: number = f(minus);
      gradient.push((yplus - yminus) / EPSILON);
      hessian[i]![i] = Math.max(
        0,
        (yplus + yminus - 2 * y) / ((EPSILON * EPSILON) / 4),
      );
    }
    return { gradient, hessian };
  }

  /**
   * `calcGradHess` (num_diff.cpp): the forward-difference gradient and the
   * forward-difference Jacobian of it, symmetrised, kept on its positive
   * eigenvalues as `CostFromFunc::convex` keeps it.
   *
   * @param f The function.
   * @param x The point.
   * @returns The gradient and the Hessian's positive part.
   */
  export function fullHessian(
    f: (x: Vector) => number,
    x: Vector,
  ): IDerivatives {
    const grad: (at: Vector) => Vector = (at: Vector): Vector =>
      forwardGradient(f, at);
    const gradient: number[] = [...grad(x)];
    const jacobian: number[][] = forwardJacobian(grad, x);
    const symmetric: number[][] = jacobian.map(
      (row: number[], i: number): number[] =>
        row.map((v: number, j: number): number => (v + jacobian[j]![i]!) / 2),
    );
    return { gradient, hessian: positivePart(symmetric) };
  }

  /**
   * `calcForwardNumGrad` (num_diff.cpp).
   *
   * @param f The function.
   * @param x The point.
   * @returns The gradient.
   */
  export function forwardGradient(f: (x: Vector) => number, x: Vector): Vector {
    const y: number = f(x);
    return x.map((v: number, i: number): number => {
      const pert: number[] = [...x];
      pert[i] = v + EPSILON;
      return (f(pert) - y) / EPSILON;
    });
  }

  /**
   * `calcForwardNumJac` (num_diff.cpp): row k the gradient of the function's
   * k-th value.
   *
   * @param f The function.
   * @param x The point.
   * @returns The Jacobian, rows the values and columns the variables.
   */
  export function forwardJacobian(
    f: (x: Vector) => Vector,
    x: Vector,
  ): number[][] {
    const y: Vector = f(x);
    const columns: number[][] = x.map((v: number, i: number): number[] => {
      const pert: number[] = [...x];
      pert[i] = v + EPSILON;
      const ypert: Vector = f(pert);
      return y.map(
        (yk: number, k: number): number => (ypert[k]! - yk) / EPSILON,
      );
    });
    return y.map((_: number, k: number): number[] =>
      columns.map((column: number[]): number => column[k]!),
    );
  }

  /** A function's derivatives at a point. */
  export interface IDerivatives {
    /** The gradient. */
    gradient: number[];

    /** The Hessian, convexified. */
    hessian: number[][];
  }

  /** The costs summed and the constraints' violations at a point. */
  function evaluation(
    functions: IFunctions,
    x: Vector,
  ): IAutoMovieMotionHumanSequentialConvex.IEvaluation {
    let objective: number = 0;
    for (const cost of functions.costs) objective += cost.f(x);

    // `Constraint::violation`: each constraint's values' violations summed.
    const violations: number[] = functions.constraints.map(
      (c: IConstraint): number =>
        c
          .g(x)
          .reduce(
            (s: number, v: number): number =>
              s + (c.equality ? Math.abs(v) : Math.max(0, v)),
            0,
          ),
    );
    return {
      objective,
      violation: violations.reduce((s: number, v: number): number => s + v, 0),
      greatest: Math.max(0, ...violations),
    };
  }

  /** The convex model about a point at a merit coefficient, in the step. */
  function model(
    functions: IFunctions,
    x: Vector,
    reading: IAutoMovieMotionHumanSequentialConvex.IEvaluation,
    coefficient: number,
  ): IAutoMovieMotionHumanSequentialConvex.IModel<Vector> {
    const n: number = x.length;
    const gradient: number[] = new Array<number>(n).fill(0);
    const hessian: number[][] = square(n);
    for (const cost of functions.costs) {
      const d: IDerivatives = cost.full
        ? fullHessian(cost.f, x)
        : diagonalHessian(cost.f, x);
      for (let i: number = 0; i < n; ++i) {
        gradient[i]! += d.gradient[i]!;
        for (let j: number = 0; j < n; ++j)
          hessian[i]![j]! += d.hessian[i]![j]!;
      }
    }
    const all: number[] = Array.from(
      { length: n },
      (_: unknown, i: number): number => i,
    );
    const rows: IAutoMovieMotionHumanQuadraticProgram.IRow[] = [];
    functions.constraints.forEach((c: IConstraint, ci: number): void => {
      const value: Vector = c.g(x);
      const jacobian: number[][] = forwardJacobian(c.g, x);
      value.forEach((v: number, k: number): void => {
        rows.push({
          key: `g|${ci}|${k}`,
          index: all,
          coef: jacobian[k]!,
          l: c.equality ? -v : -Infinity,
          u: -v,
          weight: coefficient,
        });
      });
    });
    const trust: IAutoMovieMotionHumanQuadraticProgram.IRow[] = all.map(
      (i: number): IAutoMovieMotionHumanQuadraticProgram.IRow => ({
        key: `t|${i}`,
        index: [i],
        coef: [1],
        l: 0,
        u: 0,
      }),
    );
    const program: IAutoMovieMotionHumanQuadraticProgram.IProblem = {
      n,
      band: n - 1,
      p: all.map(
        (i: number): Float64Array =>
          Float64Array.from(
            { length: n - i },
            (_: unknown, k: number): number => hessian[i]![i + k]!,
          ),
      ),
      q: Float64Array.from(gradient),
      rows,
    };
    return {
      solve: (
        box: number,
      ): IAutoMovieMotionHumanSequentialConvex.IStep<Vector> => {
        // setTrustBoxConstraints: the box about the point within the bounds.
        all.forEach((i: number): void => {
          trust[i]!.l = Math.max(-box, functions.low[i]! - x[i]!);
          trust[i]!.u = Math.min(box, functions.high[i]! - x[i]!);
        });
        const state: IAutoMovieMotionHumanQuadraticProgram.IState | undefined =
          QP.interior({ ...program, rows: [...rows, ...trust] });
        if (state === undefined)
          return { trial: x, merit: Infinity, failed: true };
        return {
          trial: x.map((v: number, i: number): number => v + state.x[i]!),
          merit: reading.objective + QP.value(program, state.x),
          failed: false,
        };
      },
    };
  }

  /**
   * A symmetric matrix's positive part, Σ max(λ, 0) v vᵀ over its eigenpairs,
   * the eigenpairs by the cyclic Jacobi method (Golub and Van Loan 2013,
   * "Matrix Computations", 4th ed., section 8.5.3, each rotation the symmetric
   * Schur decomposition of Algorithm 8.5.1), swept until the off-diagonal
   * vanishes to the double's precision.
   */
  function positivePart(a: number[][]): number[][] {
    const n: number = a.length;
    const m: number[][] = a.map((row: number[]): number[] => [...row]);
    const v: number[][] = square(n).map((row: number[], i: number): number[] =>
      row.map((_: number, j: number): number => (i === j ? 1 : 0)),
    );
    const scale: number = a.reduce(
      (s: number, row: number[]): number =>
        s + row.reduce((t: number, e: number): number => t + e * e, 0),
      0,
    );
    const off: () => number = (): number => {
      let s: number = 0;
      for (let i: number = 0; i < n; ++i)
        for (let j: number = 0; j < n; ++j) if (i !== j) s += m[i]![j]! ** 2;
      return s;
    };
    while (off() > Number.EPSILON ** 2 * scale)
      for (let p: number = 0; p < n - 1; ++p)
        for (let q: number = p + 1; q < n; ++q) {
          if (m[p]![q] === 0) continue;
          const tau: number = (m[q]![q]! - m[p]![p]!) / (2 * m[p]![q]!);
          const t: number =
            (tau >= 0 ? 1 : -1) / (Math.abs(tau) + Math.sqrt(1 + tau * tau));
          const c: number = 1 / Math.sqrt(1 + t * t);
          const s: number = t * c;
          for (let k: number = 0; k < n; ++k) {
            const mkp: number = m[k]![p]!;
            const mkq: number = m[k]![q]!;
            m[k]![p] = c * mkp - s * mkq;
            m[k]![q] = s * mkp + c * mkq;
          }
          for (let k: number = 0; k < n; ++k) {
            const mpk: number = m[p]![k]!;
            const mqk: number = m[q]![k]!;
            m[p]![k] = c * mpk - s * mqk;
            m[q]![k] = s * mpk + c * mqk;
          }
          for (let k: number = 0; k < n; ++k) {
            const vkp: number = v[k]![p]!;
            const vkq: number = v[k]![q]!;
            v[k]![p] = c * vkp - s * vkq;
            v[k]![q] = s * vkp + c * vkq;
          }
        }
    return square(n).map((row: number[], i: number): number[] =>
      row.map((_: number, j: number): number => {
        let s: number = 0;
        for (let k: number = 0; k < n; ++k)
          if (m[k]![k]! > 0) s += m[k]![k]! * v[i]![k]! * v[j]![k]!;
        return s;
      }),
    );
  }

  /** An n-by-n matrix of zeros. */
  function square(n: number): number[][] {
    return Array.from({ length: n }, (): number[] =>
      new Array<number>(n).fill(0),
    );
  }
}

/** Sco's finite-difference step (`DEFAULT_EPSILON`, modeling_utils.cpp line 13). */
const EPSILON: number = 1e-5;
