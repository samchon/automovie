import { HumanQuadraticProgram } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * Reusing a quadratic problem's preparation preserves the KKT solution when
 * numeric inputs change, and each solve owns its returned iterates.
 *
 * Scenarios:
 * 1. With one shared P array, change q, P, A, inequality/equality/free bounds,
 *    a soft weight and hard/soft classification. The scalar minimiser of
 *    p x²/2 + q x is -q/p projected onto a hard interval; a soft lower row
 *    balances its l1 slope with p x + q until its kink.
 * 2. Unsorted duplicate entries and positive/negative zero keep the equality
 *    x+2y=5, whose minimum-norm solution is (1,2). Empty hard rows retain
 *    feasibility, and an empty soft row adds exactly its constant penalty.
 * 3. Original invalid entries, including zero-coefficient entries and sparse
 *    rows, are refused before compression can hide them.
 *
 * Every minimiser retains the existing QP test's 1e-6 bound. A fresh numeric
 * copy checks preparation isolation in addition to the hand-derived answer;
 * equal solutions alone do not prove scaling or factor reuse.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States all mutations, analytic solutions, admission cases and the precision inherited from the existing QP test.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public solver repeatedly with the same preparation identity, reads actual iterates and objective, and checks that later solves leave every earlier x/z/y array unchanged.
 * @evidence contracts/development/testing.md#independent-expectations Scalar derivatives, the minimum-norm equality solution (1,2), and an empty row's constant l1 penalty give the expected values without invoking another solver.
 * @evidence contracts/development/testing.md#distinguishing-cases Changes each numeric dependency separately without warm iterates; covers hard/soft and bound-class transitions, unordered duplicate and zero entries, empty rows, invalid original spans, nonfinite coefficients and sparse input.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable CPU unit owns its small numerical inputs and prior results; no process, host, renderer or external solver is started.
 */
export function test_human_motion_core_quadratic_reuse(): void {
  const complaints: string[] = [];
  const saved: {
    state: HumanQuadraticProgram.IState;
    x: number[];
    z: number[];
    y: number[];
  }[] = [];
  const copy: (
    problem: HumanQuadraticProgram.IProblem,
  ) => HumanQuadraticProgram.IProblem = (
    problem: HumanQuadraticProgram.IProblem,
  ): HumanQuadraticProgram.IProblem => ({
    ...problem,
    p: problem.p.map(
      (row: Float64Array): Float64Array => Float64Array.from(row),
    ),
    q: Float64Array.from(problem.q),
    rows: problem.rows.map(
      (row: HumanQuadraticProgram.IRow): HumanQuadraticProgram.IRow => ({
        ...row,
        index: [...row.index],
        coef: [...row.coef],
      }),
    ),
  });
  const check: (
    label: string,
    problem: HumanQuadraticProgram.IProblem,
    expected: readonly number[],
  ) => void = (
    label: string,
    problem: HumanQuadraticProgram.IProblem,
    expected: readonly number[],
  ): void => {
    for (const [kind, input] of [
      ["shared", problem],
      ["fresh", copy(problem)],
    ] as const) {
      const state: HumanQuadraticProgram.IState =
        HumanQuadraticProgram.solve(input);
      if (state.status !== "solved" && state.status !== "polished")
        complaints.push(`${label} ${kind}: status ${state.status}`);
      for (const channel of ["x", "z", "y"] as const)
        if (
          state[channel].some(
            (value: number): boolean => !Number.isFinite(value),
          )
        )
          complaints.push(`${label} ${kind}: nonfinite ${channel} iterate`);
      expected.forEach((value: number, i: number): void => {
        if (!(Math.abs(state.x[i]! - value) <= 1e-6))
          complaints.push(
            `${label} ${kind}: x${i} ${state.x[i]}, expected ${value}`,
          );
      });
      for (const previous of saved)
        for (const channel of ["x", "z", "y"] as const)
          if (
            previous.state[channel].length !== previous[channel].length ||
            previous[channel].some(
              (value: number, i: number): boolean =>
                !Object.is(value, previous.state[channel][i]),
            )
          )
            complaints.push(
              `${label} ${kind}: a previous ${channel} array changed`,
            );
      saved.push({
        state,
        x: Array.from(state.x),
        z: Array.from(state.z),
        y: Array.from(state.y),
      });
    }
  };

  const scalar: HumanQuadraticProgram.IProblem = {
    n: 1,
    band: 0,
    p: [Float64Array.of(2)],
    q: Float64Array.of(-4),
    rows: [{ index: [0], coef: [1], l: -Infinity, u: Infinity }],
  };
  check("initial free row", scalar, [2]);
  scalar.q[0] = -6;
  check("same P, changed q", scalar, [3]);
  scalar.p[0]![0] = 3;
  check("same P, changed curvature", scalar, [2]);
  scalar.rows = [{ index: [0], coef: [2], l: -Infinity, u: 1 }];
  check("changed A", scalar, [0.5]);
  scalar.rows = [{ index: [0], coef: [1], l: -Infinity, u: 1 }];
  check("same row pattern, changed coefficient", scalar, [1]);
  scalar.rows = [{ index: [0], coef: [1], l: 1.5, u: 1.5 }];
  check("inequality becomes equality", scalar, [1.5]);
  scalar.rows = [{ index: [0], coef: [1], l: -Infinity, u: Infinity }];
  check("equality becomes free", scalar, [2]);
  scalar.p[0]![0] = 1;
  scalar.q[0] = 0;
  scalar.rows = [{ index: [0], coef: [1], l: 3, u: Infinity, weight: 1 }];
  check("soft weight one", scalar, [1]);
  scalar.rows = [{ index: [0], coef: [1], l: 3, u: Infinity, weight: 10 }];
  check("soft weight ten", scalar, [3]);
  scalar.rows = [{ index: [0], coef: [1], l: 3, u: Infinity }];
  check("soft row becomes hard", scalar, [3]);

  const unordered: HumanQuadraticProgram.IProblem = {
    n: 2,
    band: 1,
    p: [Float64Array.of(1, 0), Float64Array.of(1, 0)],
    q: Float64Array.of(0, 0),
    rows: [{ index: [1, 0, 1, 0, 1], coef: [1, 1, 1, 0, -0], l: 5, u: 5 }],
  };
  check("unsorted duplicates and both zeros", unordered, [1, 2]);
  unordered.rows = [
    ...unordered.rows,
    { index: [], coef: [], l: 0, u: 0 },
    { index: [], coef: [], l: 2, u: Infinity, weight: 3 },
  ];
  check("empty feasible hard and constant soft rows", unordered, [1, 2]);
  const emptySoft: number = HumanQuadraticProgram.value(
    unordered,
    Float64Array.of(1, 2),
  );
  if (!(Math.abs(emptySoft - 8.5) <= 1e-9))
    complaints.push(
      `constant soft penalty: objective ${emptySoft}, expected 8.5`,
    );
  unordered.rows = [{ index: [], coef: [], l: 1, u: 1 }];
  if (HumanQuadraticProgram.solve(unordered).status !== "infeasible")
    complaints.push("empty hard 0=1 row lost its infeasibility");

  const invalid: readonly (readonly [
    string,
    HumanQuadraticProgram.IProblem,
  ])[] = [
    [
      "zero coefficient with invalid index",
      { ...scalar, rows: [{ index: [0, 1], coef: [1, 0], l: 0, u: 1 }] },
    ],
    [
      "zero coefficient with fractional index",
      { ...scalar, rows: [{ index: [0.5], coef: [0], l: 0, u: 1 }] },
    ],
    [
      "coefficient NaN",
      { ...scalar, rows: [{ index: [0], coef: [NaN], l: 0, u: 1 }] },
    ],
    [
      "row length mismatch",
      { ...scalar, rows: [{ index: [0], coef: [], l: 0, u: 1 }] },
    ],
    [
      "zero entries beyond original band",
      {
        ...unordered,
        band: 0,
        p: [Float64Array.of(1), Float64Array.of(1)],
        rows: [{ index: [0, 1], coef: [0, 0], l: 0, u: 0 }],
      },
    ],
    ["curvature NaN", { ...scalar, p: [Float64Array.of(NaN)] }],
    ["linear term infinity", { ...scalar, q: Float64Array.of(Infinity) }],
    [
      "reversed bounds",
      { ...scalar, rows: [{ index: [0], coef: [1], l: 2, u: 1 }] },
    ],
    [
      "sparse rows",
      { ...scalar, rows: new Array<HumanQuadraticProgram.IRow>(1) },
    ],
  ];
  for (const [label, problem] of invalid) {
    let refused: unknown;
    try {
      HumanQuadraticProgram.solve(problem);
    } catch (error) {
      refused = error;
    }
    if (!(refused instanceof RangeError && /quadratic/i.test(refused.message)))
      complaints.push(`${label}: the malformed original input was accepted`);
  }
  TestValidator.equals(
    "quadratic preparation preserves each problem",
    complaints,
    [],
  );
}
