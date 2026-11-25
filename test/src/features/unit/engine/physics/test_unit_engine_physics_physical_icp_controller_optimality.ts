import { physicalIcpController } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * The ICP controller's feedback pair is the exact minimizer of IHMC's program:
 * on small problems with several constraints active it matches a brute-force
 * dense solve to 1e-9 m.
 *
 * The reference program is rebuilt here from the reference's task definitions,
 * not from the port's assembly: the cost J(x) over x = (dCoP, dCMP) is the sum
 * of the CoP and CMP feedback costs, the CoP-CMP and total rate costs, the
 * dynamics cost |K^-1 (dCoP + dCMP) - e|^2 counted twice and the direction cost
 * of the feedback's cross product with K e (`ICPControllerQPInputCalculator`
 * l.35-165, `ICPControllerQPSolver` l.748-772), with K = R diag(1 + K_p) R^T
 * and the CoP weight R diag(0.5, 0.5) R^T over |1 + K_p| in the plan's motion
 * frame R (`ICPControllerHelper` l.30-57). Its H and h come from J by
 * polarization; the rows are the centre of pressure inside the rectangle shrunk
 * by 2 mm,
 *
 * |R^T (dCoP + dCMP)| within the magnitude bounds and dCoP + dCMP within dt
 *
 * Times the rate bound of the last total (`ICPControllerQPConstraintCalculator`
 * l.29-176). Every active set of up to four rows is solved by its KKT system;
 * the feasible one with non-negative multipliers is the minimizer.
 *
 * Scenarios:
 *
 * 1. A diagonal plan, an error the bounds cut, a last solution and both rate
 *    weights set: several rows bind.
 * 2. A plan at rest, the centre of pressure driven into a rectangle corner.
 * 3. Scenario 1 just after `initialize`, which drops the bounds (l.385).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the independent program, the enumeration and each scenario.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the controller and compares its feedback pair with the brute-force minimizer, and checks that rows bind.
 * @evidence contracts/development/testing.md#independent-expectations The reference program is rebuilt from the reference's cost and constraint definitions and minimized by exhaustive active-set enumeration with its own linear solver, never from the port's matrices; a wrong task term, a missing double count, a misplaced row or an inexact solver misses by more than 1e-9 m.
 * @evidence contracts/development/testing.md#distinguishing-cases Bounded and unbounded runs of the same inputs, a moving and a resting plan; the closed-form gains and the zero error belong to the feedback and zero-error tests.
 * @evidence contracts/development/testing.md#execution-ownership Pure computation on in-memory states.
 */
export function test_unit_engine_physics_physical_icp_controller_optimality(): void {
  const omega: number = Math.sqrt(9.81 / 0.9);
  const dt: number = 0.004;
  const parameters: Partial<physicalIcpController.IParameters> = {
    rateWeight: 1e-5,
    copCmpRateWeight: 1e-6,
    maxFeedbackParallel: 0.05,
    maxFeedbackOrthogonal: 0.03,
    maxFeedbackRate: 2.0,
  };
  const p: physicalIcpController.IParameters = {
    ...physicalIcpController.ZULU,
    ...parameters,
  };
  const last: physicalIcpController.IState = {
    ...physicalIcpController.create(),
    copDelta: { x: 0.012, y: -0.004 },
    cmpDelta: { x: 0.003, y: 0.002 },
  };
  const cases: {
    title: string;
    state: physicalIcpController.IState;
    velocity: { x: number; y: number };
    error: { x: number; y: number };
    box: { x0: number; x1: number; y0: number; y1: number };
    bounded: boolean;
  }[] = [
    {
      title: "diagonal",
      state: last,
      velocity: { x: 0.15, y: 0.1 },
      error: { x: 0.03, y: -0.02 },
      box: { x0: -0.1, x1: -0.02, y0: -0.07, y1: 0.0 },
      bounded: true,
    },
    {
      title: "corner",
      state: physicalIcpController.create(),
      velocity: { x: 0, y: 0 },
      error: { x: 0.04, y: 0.03 },
      box: { x0: -0.03, x1: 0.02, y0: -0.02, y1: 0.015 },
      bounded: true,
    },
    {
      title: "initialized",
      state: physicalIcpController.initialize(last),
      velocity: { x: 0.15, y: 0.1 },
      error: { x: 0.03, y: -0.02 },
      box: { x0: -0.1, x1: -0.02, y0: -0.07, y1: 0.0 },
      bounded: false,
    },
  ];
  for (const c of cases) {
    const desired = { x: 0, y: 0 };
    const result: physicalIcpController.IResult = physicalIcpController({
      state: c.state,
      support: [
        { x: c.box.x0, y: c.box.y0 },
        { x: c.box.x1, y: c.box.y0 },
        { x: c.box.x1, y: c.box.y1 },
        { x: c.box.x0, y: c.box.y1 },
      ],
      desired,
      desiredVelocity: c.velocity,
      capture: c.error,
      center: { x: 0, y: 0 },
      omega,
      dt,
      parameters,
    });

    // The motion frame and the reference's matrices in it.
    const speed: number = Math.hypot(c.velocity.x, c.velocity.y);
    const ux: number = speed > 0 ? c.velocity.x / speed : 1;
    const uy: number = speed > 0 ? c.velocity.y / speed : 0;
    const along: number = speed > 0 ? 1 + p.kpParallel : 1 + p.kpOrthogonal;
    const across: number = 1 + p.kpOrthogonal;
    const frame = (u: number, v: number): number[][] => [
      [u * ux * ux + v * uy * uy, (u - v) * ux * uy],
      [(u - v) * ux * uy, u * uy * uy + v * ux * ux],
    ];
    const kGain: number[][] = frame(along, across);
    const magnitude: number =
      speed > 0 ? Math.hypot(along, across) : Math.sqrt(2) * across;
    const copWeight: number[][] = frame(
      speed > 0 ? p.forwardWeight : p.lateralWeight,
      p.lateralWeight,
    ).map((row) => row.map((v) => v / magnitude));
    const det: number =
      kGain[0]![0]! * kGain[1]![1]! - kGain[0]![1]! * kGain[1]![0]!;
    const kInverse: number[][] = [
      [kGain[1]![1]! / det, -kGain[0]![1]! / det],
      [-kGain[1]![0]! / det, kGain[0]![0]! / det],
    ];
    const ke = [
      kGain[0]![0]! * c.error.x + kGain[0]![1]! * c.error.y,
      kGain[1]![0]! * c.error.x + kGain[1]![1]! * c.error.y,
    ];
    const dir = [
      ke[0]! / Math.hypot(ke[0]!, ke[1]!),
      ke[1]! / Math.hypot(ke[0]!, ke[1]!),
    ];
    const pc = [c.state.copDelta.x, c.state.copDelta.y];
    const pm = [c.state.cmpDelta.x, c.state.cmpDelta.y];
    const pt = [pc[0]! + pm[0]!, pc[1]! + pm[1]!];
    const q: number = p.copCmpRateWeight / (dt * dt);
    const r: number = p.rateWeight / (dt * dt);
    const quad = (m: number[][], v: number[]): number =>
      v[0]! * (m[0]![0]! * v[0]! + m[0]![1]! * v[1]!) +
      v[1]! * (m[1]![0]! * v[0]! + m[1]![1]! * v[1]!);
    const cost = (x: number[]): number => {
      const dc = [x[0]!, x[1]!];
      const dm = [x[2]!, x[3]!];
      const s = [dc[0]! + dm[0]!, dc[1]! + dm[1]!];
      const residual = [
        kInverse[0]![0]! * s[0]! + kInverse[0]![1]! * s[1]! - c.error.x,
        kInverse[1]![0]! * s[0]! + kInverse[1]![1]! * s[1]! - c.error.y,
      ];
      const cross: number = dir[1]! * s[0]! - dir[0]! * s[1]!;
      const sq = (v: number[]): number => v[0]! * v[0]! + v[1]! * v[1]!;
      return (
        0.5 * quad(copWeight, dc) +
        0.5 * p.cmpWeight * sq(dm) +
        0.5 * q * sq([dc[0]! - pc[0]!, dc[1]! - pc[1]!]) +
        0.5 * q * sq([dm[0]! - pm[0]!, dm[1]! - pm[1]!]) +
        0.5 * r * sq([s[0]! - pt[0]!, s[1]! - pt[1]!]) +
        2 * 0.5 * p.dynamicsWeight * sq(residual) +
        0.5 * p.directionWeight * cross * cross
      );
    };

    // H and h of J = 1/2 x^T H x - h^T x + c by polarization.
    const unit = (i: number, scale: number = 1): number[] =>
      [0, 1, 2, 3].map((j: number): number => (j === i ? scale : 0));
    const add = (a: number[], b: number[]): number[] =>
      a.map((v, i) => v + b[i]!);
    const zero: number = cost([0, 0, 0, 0]);
    const h: number[][] = [0, 1, 2, 3].map((i) =>
      [0, 1, 2, 3].map(
        (j) =>
          cost(add(unit(i), unit(j))) - cost(unit(i)) - cost(unit(j)) + zero,
      ),
    );
    const g: number[] = [0, 1, 2, 3].map(
      (i) => -(cost(unit(i)) - cost(unit(i, -1))) / 2,
    );

    // The rows a x <= b.
    const ff = {
      x: desired.x - c.velocity.x / omega,
      y: desired.y - c.velocity.y / omega,
    };
    const d: number = p.safeCopDistance;
    const rows: { a: number[]; b: number }[] = [
      { a: [1, 0, 0, 0], b: c.box.x1 - d - ff.x },
      { a: [-1, 0, 0, 0], b: -(c.box.x0 + d - ff.x) },
      { a: [0, 1, 0, 0], b: c.box.y1 - d - ff.y },
      { a: [0, -1, 0, 0], b: -(c.box.y0 + d - ff.y) },
    ];
    if (c.bounded) {
      const t =
        speed > 0
          ? [
              [ux, uy],
              [-uy, ux],
            ]
          : [
              [1, 0],
              [0, 1],
            ];
      const maxima = [
        speed > 0 ? p.maxFeedbackParallel : p.maxFeedbackOrthogonal,
        p.maxFeedbackOrthogonal,
      ];
      for (const sign of [1, -1])
        for (const k of [0, 1]) {
          rows.push({
            a: [t[k]![0]!, t[k]![1]!, t[k]![0]!, t[k]![1]!].map(
              (v) => sign * v,
            ),
            b: maxima[k]!,
          });
          rows.push({
            a: [
              k === 0 ? sign : 0,
              k === 1 ? sign : 0,
              k === 0 ? sign : 0,
              k === 1 ? sign : 0,
            ],
            b: sign * pt[k]! + dt * p.maxFeedbackRate,
          });
        }
    }
    const best: number[] = bruteForce(h, g, rows, cost);
    const actual: number[] = [
      result.state.copDelta.x,
      result.state.copDelta.y,
      result.state.cmpDelta.x,
      result.state.cmpDelta.y,
    ];
    TestValidator.predicate(
      `${c.title}: ${JSON.stringify(actual)} vs ${JSON.stringify(best)}`,
      actual.every(
        (v: number, i: number): boolean => Math.abs(v - best[i]!) <= 1e-9,
      ),
    );
    const binding: number = rows.filter(
      (row) =>
        Math.abs(row.a.reduce((s, v, i) => s + v * best[i]!, 0) - row.b) < 1e-9,
    ).length;
    TestValidator.predicate(`${c.title} binds rows`, binding >= 1);
  }
}

/**
 * The minimizer of 1/2 x^T H x - h^T x subject to a x <= b by exhaustive
 * active-set enumeration: every set of up to four rows taken as equalities, its
 * KKT system solved, the feasible point with non-negative multipliers and the
 * least cost kept.
 */
function bruteForce(
  h: number[][],
  g: number[],
  rows: { a: number[]; b: number }[],
  cost: (x: number[]) => number,
): number[] {
  const minima: { x: number[]; cost: number }[] = [];
  const choose = (start: number, picked: number[]): void => {
    const n: number = 4 + picked.length;
    const m: number[][] = Array.from({ length: n }, (_, i) =>
      Array.from({ length: n + 1 }, (_, j): number => {
        if (j === n) return i < 4 ? g[i]! : rows[picked[i - 4]!]!.b;
        if (i < 4 && j < 4) return h[i]![j]!;
        if (i < 4) return rows[picked[j - 4]!]!.a[i]!;
        if (j < 4) return rows[picked[i - 4]!]!.a[j]!;
        return 0;
      }),
    );
    const solution: number[] | null = gauss(m);
    if (solution) {
      const x: number[] = solution.slice(0, 4);
      const feasible: boolean = rows.every(
        (row) => row.a.reduce((s, v, i) => s + v * x[i]!, 0) <= row.b + 1e-12,
      );
      const dual: boolean = solution
        .slice(4)
        .every((v: number): boolean => v >= -1e-9);
      if (feasible && dual) minima.push({ x, cost: cost(x) });
    }
    if (picked.length === 4) return;
    for (let i: number = start; i < rows.length; i++)
      choose(i + 1, [...picked, i]);
  };
  choose(0, []);
  minima.sort((a, b) => a.cost - b.cost);
  if (minima.length === 0) throw new Error("no feasible active set");
  return minima[0]!.x;
}

/** Gaussian elimination with partial pivoting; null for a singular system. */
function gauss(m: number[][]): number[] | null {
  const n: number = m.length;
  const scale: number = Math.max(
    ...m.flatMap((row) => row.slice(0, n).map(Math.abs)),
  );
  for (let col: number = 0; col < n; col++) {
    let pivot: number = col;
    for (let row: number = col + 1; row < n; row++)
      if (Math.abs(m[row]![col]!) > Math.abs(m[pivot]![col]!)) pivot = row;
    if (Math.abs(m[pivot]![col]!) <= 1e-12 * scale) return null;
    [m[col], m[pivot]] = [m[pivot]!, m[col]!];
    for (let row: number = col + 1; row < n; row++) {
      const f: number = m[row]![col]! / m[col]![col]!;
      for (let k: number = col; k <= n; k++) m[row]![k]! -= f * m[col]![k]!;
    }
  }
  const x: number[] = new Array<number>(n).fill(0);
  for (let i: number = n - 1; i >= 0; i--) {
    let s: number = m[i]![n]!;
    for (let k: number = i + 1; k < n; k++) s -= m[i]![k]! * x[k]!;
    x[i] = s / m[i]![i]!;
  }
  return x;
}
