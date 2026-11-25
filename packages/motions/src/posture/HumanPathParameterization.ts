import { HumanSeidelProgram as LP } from "./HumanSeidelProgram";

/**
 * Time-optimal path parameterisation by reachability analysis, TOPP-RA (Pham
 * and Pham 2018, "A new approach to time-optimal path parameterization based on
 * reachability analysis", IEEE T-RO 34(3):645), ported from
 * github.com/hungpham2511/toppra at commit
 * 8a2a9252e42089f1082d8d5d69b9852f32d0b338 (MIT, Copyright (c) 2017 Hung Pham):
 * the stages of `Seidel::initialize` and `solveStagewiseOptim`
 * (cpp/src/toppra/solver/seidel.cpp), the constraints of `LinearJointVelocity`
 * and `LinearJointAcceleration` (cpp/src/toppra/constraint/) under the
 * `Interpolation` discretisation (`collocationToInterpolate`,
 * cpp/src/toppra/constraint.cpp), the backward pass of
 * `computeControllableSets` (cpp/src/toppra/algorithm.cpp), the forward pass of
 * `TOPPRA::computeForwardPass` (cpp/src/toppra/algorithm/toppra.cpp) and the
 * time map of `parametrizer::ConstAccel`
 * (cpp/src/toppra/parametrizer/const_accel.cpp).
 *
 * The path is given at its gridpoints as each coordinate's first and second
 * derivative by the path parameter s; the variables of each stage are the path
 * acceleration u and the squared path velocity x = ṡ². The premise is the
 * paper's (section II): the path is fixed, so a constraint reads the path at s
 * alone. Hollerbach's uniform time scaling (Hollerbach 1984, "Dynamic scaling
 * of manipulator trajectories", ASME J. Dyn. Syst. Meas. Control 106:102) is
 * the special case of one constant ṡ.
 */
export namespace HumanPathParameterization {
  /** A path at its gridpoints. */
  export interface IPath {
    /** The gridpoints s_0 < ... < s_N, the path's interval's ends included. */
    gridpoints: readonly number[];

    /** Each coordinate's first derivative q'(s) at each gridpoint. */
    first: readonly (readonly number[])[];

    /** Each coordinate's second derivative q''(s) at each gridpoint. */
    second: readonly (readonly number[])[];
  }

  /**
   * A first-order constraint (`LinearJointVelocity`, with the limits read at
   * each gridpoint as `computeVelocityLimits` reads them): `lower <= q̇ <=
   * upper` for quantities whose path derivative is `first`.
   */
  export interface IVelocity {
    /** Each quantity's derivative by s at each gridpoint. */
    first: readonly (readonly number[])[];

    /** Each quantity's least rate at each gridpoint. */
    lower: readonly (readonly number[])[];

    /** Each quantity's greatest rate at each gridpoint. */
    upper: readonly (readonly number[])[];
  }

  /**
   * A second-order constraint (`LinearJointAcceleration`): `lower <= q̈ <=
   * upper` for the path's own coordinates, `q̈ = q'(s) u + q''(s) x`.
   */
  export interface IAcceleration {
    /** Each coordinate's least acceleration. */
    lower: readonly number[];

    /** Each coordinate's greatest acceleration. */
    upper: readonly number[];
  }

  /** One parameterisation problem. */
  export interface IProblem {
    /** The path. */
    path: IPath;

    /** The first-order constraints. */
    velocities: readonly IVelocity[];

    /** The second-order constraints on the path's coordinates. */
    accelerations: readonly IAcceleration[];

    /** The path velocity ṡ at the start (`vel_start`). */
    start: number;

    /** The path velocity ṡ at the end (`vel_end`). */
    end: number;
  }

  /** How the parameterisation ended (`ReturnCode`). */
  export type Status = "ok" | "controllable" | "forward";

  /** The parameterisation (`ParametrizationData`). */
  export interface IResult {
    /** How it ended. */
    status: Status;

    /** The squared path velocity x_i at each gridpoint (`parametrization`). */
    parametrization: number[];

    /** Each gridpoint's controllable set of x, its least and greatest. */
    controllable: LP.Pair[];
  }

  /** The time map of a parameterisation (`ConstAccel`). */
  export interface ITimed {
    /** The instant each gridpoint is reached, from zero (`m_ts`). */
    times: number[];

    /** The path velocity ṡ at each gridpoint (`m_vs`). */
    velocities: number[];

    /** The constant path acceleration over each interval (`m_us`). */
    accelerations: number[];
  }

  /**
   * The initial bound on x in the backward pass (`m_initXBound`, algorithm.hpp
   * line 167): TOPP-RA's own, which keeps the stage programs away from the
   * numerical trouble of very large x (toppra issue 156).
   */
  export const INITIAL_X: Readonly<LP.Pair> = [0, 100];

  /** The greatest path velocity a velocity constraint admits (`m_maxsd`). */
  export const MAX_SD: number = 1e8;

  /**
   * Parameterise a path (`computePathParametrization`): the controllable sets
   * backward from the end's velocity, then the greedy forward pass from the
   * start's.
   *
   * @param problem The path, its constraints and its end velocities.
   * @returns The squared path velocity at each gridpoint, the controllable sets
   *   and how the solve ended.
   * @throws {Error} When a velocity constraint bounds a quantity that does not
   *   move away from zero (`BoxConstraint is infeasible`).
   */
  export function parametrize(problem: IProblem): IResult {
    const stages: IStages = prepare(problem);
    const n: number = problem.path.gridpoints.length - 1;
    const parametrization: number[] = new Array<number>(n + 1).fill(0);
    const controllable: LP.Pair[] = problem.path.gridpoints.map(
      (): LP.Pair => [0, 0],
    );
    const upperControls: number[] = new Array<number>(n).fill(0);

    // computeControllableSets.
    controllable[n] = [problem.end * problem.end, problem.end * problem.end];
    for (let i: number = n - 1; i >= 0; --i) {
      const next: LP.Pair = controllable[i + 1]!;
      const up: LP.ISolution2 = solve(stages, i, UPPER, INITIAL_X, next);
      if (!up.feasible)
        return { status: "controllable", parametrization, controllable };
      controllable[i]![1] = up.optvar[1];
      upperControls[i] = up.optvar[0];
      const down: LP.ISolution2 = solve(stages, i, LOWER, INITIAL_X, next);
      if (!down.feasible)
        return { status: "controllable", parametrization, controllable };
      controllable[i]![0] = Math.max(0, down.optvar[1]);
    }

    // TOPPRA::computeForwardPass.
    parametrization[0] = problem.start * problem.start;
    for (let i: number = 0; i < n; ++i) {
      const delta: number = stages.deltas[i]!;
      const x: number = parametrization[i]!;
      const solved: LP.ISolution2 = solve(
        stages,
        i,
        [-2 * delta, -1],
        [x, x],
        controllable[i + 1]!,
      );
      // At the upper bound of a controllable set the stage is degenerate, a
      // vertex admitting a single control, which the backward pass found.
      let u: number = solved.optvar[0];
      if (!solved.feasible) {
        if (x !== controllable[i]![1])
          return { status: "forward", parametrization, controllable };
        u = upperControls[i]!;
      }
      const step: number = 2 * delta * u;
      const upper: number = controllable[i + 1]![1];
      let end: number = x + step;
      if (upper - end <= 4 * Number.EPSILON * (Math.abs(x) + Math.abs(step)))
        end = upper;
      parametrization[i + 1] = Math.min(
        upper,
        Math.max(controllable[i + 1]![0], end),
      );
    }
    return { status: "ok", parametrization, controllable };
  }

  /**
   * The time map of a parameterisation at constant path acceleration over each
   * interval (`ConstAccel::process_internals`).
   *
   * @param gridpoints The gridpoints.
   * @param parametrization The squared path velocity at each.
   * @returns Each gridpoint's instant, its path velocity, and each interval's
   *   path acceleration.
   */
  export function timed(
    gridpoints: readonly number[],
    parametrization: readonly number[],
  ): ITimed {
    const velocities: number[] = parametrization.map((x: number): number =>
      Math.sqrt(x),
    );
    const times: number[] = [0];
    const accelerations: number[] = [];
    for (let i: number = 0; i + 1 < gridpoints.length; ++i) {
      const ds: number = gridpoints[i + 1]! - gridpoints[i]!;
      accelerations.push(
        (0.5 *
          (velocities[i + 1]! * velocities[i + 1]! -
            velocities[i]! * velocities[i]!)) /
          ds,
      );
      times.push(times[i]! + (2 * ds) / (velocities[i + 1]! + velocities[i]!));
    }
    return { times, velocities, accelerations };
  }
}

/** The upper problem's objective (`g_upper`): maximise x. */
const UPPER: Readonly<LP.Pair> = [1e-9, -1];

/** The lower problem's objective (`g_lower`): minimise x. */
const LOWER: Readonly<LP.Pair> = [-1e-9, 1];

/** Every stage's program, prepared once (`Seidel::initialize`). */
interface IStages {
  /** The intervals' lengths (`m_deltas`). */
  deltas: number[];

  /** Each stage's rows, the first two reserved for the next stage's bounds. */
  rows: LP.Row[][];

  /** Each stage's lower bounds on (u, x). */
  low: LP.Pair[];

  /** Each stage's upper bounds on (u, x). */
  high: LP.Pair[];
}

/**
 * The stages' rows and bounds: each acceleration constraint's rows under the
 * interpolation discretisation, each velocity constraint's bound on x, then the
 * presolve of every stage from its third row.
 */
function prepare(problem: HumanPathParameterization.IProblem): IStages {
  const path: HumanPathParameterization.IPath = problem.path;
  const s: readonly number[] = path.gridpoints;
  const n: number = s.length - 1;
  const deltas: number[] = s
    .slice(1)
    .map((v: number, i: number): number => v - s[i]!);
  if (deltas.some((d: number): boolean => d <= 0))
    throw new Error("Invalid times.");
  const rows: LP.Row[][] = s.map((): LP.Row[] => [
    [0, 0, -1],
    [0, 0, -1],
  ]);
  const low: LP.Pair[] = s.map((): LP.Pair => [-Infinity, -Infinity]);
  const high: LP.Pair[] = s.map((): LP.Pair => [Infinity, Infinity]);

  // LinearJointAcceleration, collocated at s_i and interpolated to s_{i+1}
  // through x_{i+1} = x_i + 2 delta_i u_i.
  for (const limit of problem.accelerations)
    for (let i: number = 0; i <= n; ++i) {
      const a: readonly number[] = path.first[i]!;
      const b: readonly number[] = path.second[i]!;
      const tailA: number[] =
        i < n
          ? path.first[i + 1]!.map(
              (v: number, k: number): number =>
                v + 2 * deltas[i]! * path.second[i + 1]![k]!,
            )
          : [...path.first[n]!];
      const tailB: readonly number[] = path.second[Math.min(i + 1, n)]!;
      const sides: readonly (readonly [readonly number[], readonly number[]])[] = [
        [a, b],
        [tailA, tailB],
      ];
      for (const [ai, bi] of sides) {
        ai.forEach((v: number, k: number): void => {
          const upper: number = limit.upper[k]!;
          const lower: number = limit.lower[k]!;
          if (upper < Infinity) rows[i]!.push([v, bi[k]!, -upper]);
          if (lower > -Infinity) rows[i]!.push([-v, -bi[k]!, lower]);
        });
      }
    }

  // LinearJointVelocity: a bound on x at each gridpoint.
  for (const limit of problem.velocities)
    for (let i: number = 0; i <= n; ++i) {
      let sdmin: number = -HumanPathParameterization.MAX_SD;
      let sdmax: number = HumanPathParameterization.MAX_SD;
      limit.first[i]!.forEach((v: number, k: number): void => {
        const lower: number = limit.lower[i]![k]!;
        const upper: number = limit.upper[i]![k]!;
        const inverse: number = 1 / v;
        if (v > 0) {
          sdmax = Math.min(upper * inverse, sdmax);
          sdmin = Math.max(lower * inverse, sdmin);
        } else if (v < 0) {
          sdmax = Math.min(lower * inverse, sdmax);
          sdmin = Math.max(upper * inverse, sdmin);
        } else if (upper < 0 || lower > 0)
          throw new Error("BoxConstraint is infeasible");
      });
      low[i]![1] = Math.max(low[i]![1], sdmin > 0 ? sdmin * sdmin : 0);
      high[i]![1] = Math.min(high[i]![1], sdmax * sdmax);
    }

  // Rows 0 and 1, the next stage's bounds, change with each solve.
  for (let i: number = 0; i <= n; ++i)
    LP.presolve(rows[i]!, low[i]!, high[i]!, 2);
  return { deltas, rows, low, high };
}

/**
 * One stage's program (`Seidel::solveStagewiseOptim`): minimise `g' (u, x)`
 * with x within `x` and the next stage's x within `next`.
 */
function solve(
  stages: IStages,
  i: number,
  g: Readonly<LP.Pair>,
  x: Readonly<LP.Pair>,
  next: Readonly<LP.Pair>,
): LP.ISolution2 {
  const low: LP.Pair = [stages.low[i]![0], Math.max(stages.low[i]![1], x[0])];
  const high: LP.Pair = [
    stages.high[i]![0],
    Math.min(stages.high[i]![1], x[1]),
  ];
  const rows: LP.Row[] = stages.rows[i]!;
  if (i < stages.deltas.length) {
    const delta: number = stages.deltas[i]!;
    rows[0] = next[0] <= -Infinity ? [0, 0, -1] : [-2 * delta, -1, next[0]];
    rows[1] = next[1] >= Infinity ? [0, 0, -1] : [2 * delta, 1, -next[1]];
  } else {
    rows[0] = [0, 0, -1];
    rows[1] = [0, 0, -1];
  }
  return LP.solve2([-g[0], -g[1]], rows, low, high);
}
