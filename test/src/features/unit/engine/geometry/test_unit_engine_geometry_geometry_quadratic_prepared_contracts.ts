import type { IAutoMovieMotionHumanQuadraticProgram } from "@automovie/interface";
import { HumanQuadraticProgram as Q } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";

/**
 * Explicit preparation fixes the quadratic model while each solve reads fresh
 * row endpoints, penalty classifications and warm iterates.
 *
 * Scenarios:
 * 1. For P=[[2,1],[1,2]], q=(-4,-5), the free minimum is (1,2).
 *    A sum equality s gives ((s-1)/2,(s+1)/2); changing it to an upper
 *    sum bound 2 gives (0.5,1.5), and making it free restores (1,2).
 * 2. Editing the source P, q, row indices and coefficients after preparation
 *    leaves that snapshot unchanged. Rebuilding admits the edited model.
 * 3. A scalar x squared with a lower row 3 balances its slope 2x against
 *    soft weights 2 and 8 at 1 and 3. Zero weight gives 0; hard gives 3.
 *    Changing keys and keyed starting multipliers preserves those optima.
 * 4. Warm arrays and earlier result arrays retain their values across changed
 *    bounds and caller output mutation. Malformed refreshed bounds refuse,
 *    and that failed solve cannot poison a subsequent valid solve.
 * 5. The admitted zero-origin objective reports the actual soft-row excesses
 *    (2,1,0) with cost10; the step (1,2) has excesses (0,3,0) and cost24,
 *    including its coupled curvature and linear terms.
 * 6. Reusing the same scalar curvature10 and free row while q changes from
 *    -1 to-2 moves the optimum from0.1 to0.2. An earlier explicitly prepared
 *    snapshot still returns0.1, independently of any shared matrix factors.
 * 7. An unsorted sparse row lists each variable twice with coefficients
 *    (0.75,0.25,0.25,0.75) at indices(1,0,1,0). It is still x+y, so
 *    equality5/equality1/free bounds retain(2,3)/(0,1)/(1,2). Source row
 *    order and coefficients remain unchanged by factor-only preparation.
 */
export function test_unit_engine_geometry_geometry_quadratic_prepared_contracts(): void {
  const source: IAutoMovieMotionHumanQuadraticProgram.IProblem = {
    n: 2,
    band: 1,
    p: [Float64Array.of(2, 1), Float64Array.of(2)],
    q: Float64Array.of(-4, -5),
    rows: [{ index: [0, 1], coef: [1, 1], l: -Infinity, u: Infinity }],
  };
  const prepared: ReturnType<typeof Q.prepare> = Q.prepare(source);
  const states: IAutoMovieMotionHumanQuadraticProgram.IState[] = [];
  const saved: { x: number[]; z: number[]; y: number[] }[] = [];

  /** Check the original coupled equations and retain every returned array. */
  function coupled(label: string, l: number, u: number, expected: number[]): IAutoMovieMotionHumanQuadraticProgram.IState {
    const state: IAutoMovieMotionHumanQuadraticProgram.IState = prepared.solve([{ l, u }]);
    minimum(label, state, expected);
    const sum: number = state.x[0]! + state.x[1]!;
    TestValidator.predicate(`${label}: original-unit row and KKT`,
      sum >= l - 1e-9 && sum <= u + 1e-9 &&
      nclose(2 * state.x[0]! + state.x[1]! - 4 + state.y[0]!, 0, 1e-7) &&
      nclose(state.x[0]! + 2 * state.x[1]! - 5 + state.y[0]!, 0, 1e-7),
    );
    for (let i: number = 0; i < states.length; i++)
      for (const channel of ["x", "z", "y"] as const)
        TestValidator.predicate(`${label}: earlier ${channel} remains owned`,
          saved[i]![channel].every((value: number, j: number): boolean =>
            nclose(states[i]![channel][j]!, value, 0)),
        );
    states.push(state);
    saved.push({ x: Array.from(state.x), z: Array.from(state.z), y: Array.from(state.y) });
    return state;
  }

  coupled("free initial row", -Infinity, Infinity, [1, 2]);
  coupled("sum equality five", 5, 5, [2, 3]);
  coupled("sum equality one", 1, 1, [0, 1]);
  coupled("upper sum bound", -Infinity, 2, [0.5, 1.5]);
  coupled("free after active bound", -Infinity, Infinity, [1, 2]);

  source.p[0]![0] = 4;
  source.p[0]![1] = 0;
  source.p[1]![0] = 4;
  source.q[0] = -12;
  source.q[1] = -16;
  (source.rows[0]!.index as number[])[1] = 0;
  (source.rows[0]!.coef as number[])[0] = 2;
  coupled("fixed model survives caller source edits", 5, 5, [2, 3]);
  minimum("fresh preparation admits edited curvature and linear terms",
    Q.prepare(source).solve([{ l: -Infinity, u: Infinity }]), [3, 4],
  );

  const scalar: ReturnType<typeof Q.prepare> = Q.prepare({
    n: 1,
    band: 0,
    p: [Float64Array.of(2)],
    q: Float64Array.of(0),
    rows: [{ index: [0], coef: [1], l: 3, u: Infinity }],
  });
  for (const [weight, expected] of [[2, 1], [8, 3], [0, 0]] as const)
    minimum(`fresh soft weight ${weight}`, scalar.solve([
      { l: 3, u: Infinity, weight, key: `soft-${weight}` },
    ]), [expected]);
  minimum("soft becomes hard", scalar.solve([{ l: 3, u: Infinity }]), [3]);
  minimum("new keyed dual is only a starting iterate", scalar.solve([
    { l: 3, u: Infinity, weight: 2, key: "changed-key" },
  ], undefined, new Map([["changed-key", -7]])), [1]);

  const warm: IAutoMovieMotionHumanQuadraticProgram.IState = {
    x: Float64Array.of(7),
    z: Float64Array.of(-3),
    y: Float64Array.of(0.25),
  };
  const warmed: IAutoMovieMotionHumanQuadraticProgram.IState = scalar.solve([{ l: 4, u: 4 }], warm);
  minimum("manual warm equality", warmed, [4]);
  for (const [channel, expected] of [["x", 7], ["z", -3], ["y", 0.25]] as const)
    TestValidator.predicate(`prepared solve preserves warm ${channel}`,
      nclose(warm[channel][0]!, expected, 0) && warmed[channel] !== warm[channel],
    );
  const oldZ: number = warmed.z[0]!;
  const oldY: number = warmed.y[0]!;
  warmed.x[0] = 123;
  minimum("returned x cannot change a later solve", scalar.solve([
    { l: -Infinity, u: Infinity },
  ]), [0]);
  TestValidator.predicate("old result arrays retain independent ownership",
    nclose(warmed.x[0]!, 123, 0) && nclose(warmed.z[0]!, oldZ, 0) &&
    nclose(warmed.y[0]!, oldY, 0) && warmed.x !== warmed.z &&
    warmed.x !== warmed.y && warmed.z !== warmed.y,
  );

  const invalid: readonly (readonly Pick<IAutoMovieMotionHumanQuadraticProgram.IRow, "l" | "u" | "weight" | "key">[])[] = [
    [],
    [{ l: 0, u: 1 }, { l: 0, u: 1 }],
    [{ l: 2, u: 1 }],
  ];
  for (const bounds of invalid)
    TestValidator.predicate("malformed refreshed row refuses",
      throwsError((): IAutoMovieMotionHumanQuadraticProgram.IState => scalar.solve(bounds)),
    );
  minimum("failed solve leaves prepared model usable", scalar.solve([
    { l: 3, u: Infinity, weight: 2 },
  ]), [1]);

  const objective: IAutoMovieMotionHumanQuadraticProgram.IProblem = {
    n: 2, band: 1,
    p: [Float64Array.of(2, 1), Float64Array.of(4)],
    q: Float64Array.of(-3, 2),
    rows: [
      { index: [0], coef: [1], l: 5, u: Infinity, key: "hard" },
      { index: [0, 1], coef: [1, 1], l: 2, u: Infinity, weight: 3, key: "lower" },
      { index: [1], coef: [1], l: -Infinity, u: -1, weight: 4, key: "upper" },
      { index: [], coef: [], l: -Infinity, u: Infinity, weight: 0, key: "zero" },
    ],
  };
  const observed: { key: string | undefined; miss: number }[] = [];

  /** Observe each actual soft-row interval excess in the public objective. */
  function observe(row: IAutoMovieMotionHumanQuadraticProgram.IRow, miss: number): void { observed.push({ key: row.key, miss }); }

  TestValidator.predicate("admitted exact origin retains all soft penalties",
    nclose(Q.value(objective, undefined, observe), 10, 0),
  );
  TestValidator.equals("origin observer visits only soft rows in order",
    observed.map((row: { key: string | undefined; miss: number }): string | undefined => row.key),
    ["lower", "upper", "zero"],
  );
  TestValidator.predicate("origin observer reports independent interval distances",
    observed.every((row: { key: string | undefined; miss: number }, i: number): boolean =>
      nclose(row.miss, [2, 1, 0][i]!, 0)),
  );
  observed.length = 0;
  TestValidator.predicate("actual step retains coupled curvature and current soft excess",
    nclose(Q.value(objective, Float64Array.of(1, 2), observe), 24, 0) &&
    observed.every((row: { key: string | undefined; miss: number }, i: number): boolean =>
      nclose(row.miss, [0, 3, 0][i]!, 0)),
  );

  const linear: IAutoMovieMotionHumanQuadraticProgram.IProblem = {
    n: 1, band: 0, p: [Float64Array.of(10)], q: Float64Array.of(-1),
    rows: [{ index: [0], coef: [1], l: -Infinity, u: Infinity }],
  };
  const oldLinear: ReturnType<typeof Q.prepare> = Q.prepare(linear);
  minimum("initial scalar linear objective", Q.solve(linear), [0.1]);
  linear.q[0] = -2;
  const currentLinear: IAutoMovieMotionHumanQuadraticProgram.IState = Q.solve(linear);
  minimum("same matrices read the changed linear objective", currentLinear, [0.2]);
  TestValidator.predicate("new solve satisfies its actual current stationarity equation",
    nclose(10 * currentLinear.x[0]! - 2, 0, 1e-7),
  );
  minimum("previous explicit snapshot retains its original linear objective",
    oldLinear.solve(linear.rows), [0.1],
  );
  linear.q[0] = -1;
  minimum("replaying the earlier linear objective solves it again", Q.solve(linear), [0.1]);

  const repeated: IAutoMovieMotionHumanQuadraticProgram.IProblem = {
    n: 2, band: 1, p: [Float64Array.of(2, 1), Float64Array.of(2)], q: Float64Array.of(-4, -5),
    rows: [{ index: [1, 0, 1, 0], coef: [0.75, 0.25, 0.25, 0.75], l: 5, u: 5 }],
  };
  const repeatedModel: ReturnType<typeof Q.prepare> = Q.prepare(repeated);
  for (const [l, u, expected] of [[5, 5, [2, 3]], [1, 1, [0, 1]],] as const) {
    const result: IAutoMovieMotionHumanQuadraticProgram.IState = repeatedModel.solve([{ l, u }]);
    minimum("unsorted duplicate terms retain their original sum-row equation", result, expected);
    TestValidator.predicate("duplicate sparse rows retain the actual coupled stationarity equations",
      nclose(2 * result.x[0]! + result.x[1]! - 4 + result.y[0]!, 0, 1e-7) &&
      nclose(result.x[0]! + 2 * result.x[1]! - 5 + result.y[0]!, 0, 1e-7),
    );
  }
  TestValidator.equals("factor preparation leaves source row index order unchanged", repeated.rows[0]!.index, [1, 0, 1, 0]);
  TestValidator.predicate("factor preparation leaves source row coefficients unchanged",
    repeated.rows[0]!.coef.every((coefficient: number, index: number): boolean =>
      nclose(coefficient, [0.75, 0.25, 0.25, 0.75][index]!, 0)),
  );
}

/** Keep the existing solver's componentwise tolerance and successful statuses. */
function minimum(label: string, state: IAutoMovieMotionHumanQuadraticProgram.IState, expected: readonly number[]): void {
  TestValidator.predicate(`${label}: solved independent optimum`,
    (state.status === "solved" || state.status === "polished") &&
    state.x.length === expected.length &&
    expected.every((value: number, i: number): boolean =>
      nclose(state.x[i]!, value, 1e-6)),
  );
}
