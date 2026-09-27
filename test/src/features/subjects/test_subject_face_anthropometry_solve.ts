import { TestValidator } from "@nestia/e2e";

import {
  solveFaceAnthropometry,
  solveFaceNorms,
  solveLinear,
} from "../../../scripts/face-review/faceAnthropometrySolve";
import { nclose, throwsError } from "../internal/predicates";

/**
 * The paired square solve.
 * Scenarios:
 * 1. On a coupled nonlinear model (each index moved by its own control and
 *    a quarter of the other, the first also squared) every index reaches
 *    its target within the relative tolerance and the controls come back.
 * 2. A target beyond a control's envelope holds that control at its bound
 *    and still solves the other; a step blocked by a bound is followed only
 *    to it, so a single step toward (2, 1) from the origin within +-1 ends
 *    at (1, 0.5), not (1, 0).
 * 3. An unmeasured target keeps its control at its start.
 * 4. Twenty coupled controls of which sixteen are asked past their bounds:
 *    the default budget (three steps per control) holds all sixteen and
 *    solves the other four, where twelve steps leave them unsolved.
 * 5. A reading that resolves only odd multiples of 0.01 mm, asked for
 *    zero, stops within its control's resolution after one step, where the
 *    relative tolerance alone keeps it stepping to the budget.
 * 6. An index that stops reading beyond a control value its Newton step
 *    crosses (the first, lost past 0.3) leaves the system with its control
 *    where it stands, and the other index is still solved; so does one
 *    whose Jacobian probe crosses it, from a start of 0.26, at 0.26.
 * 7. An index whose parabola never reaches its target (maximum 0.25
 *    under 0.4), coupled to a solvable one, is released from its bound and
 *    caught again; held for good the second time, the solve stops in six
 *    steps where releasing it again would cycle to the budget.
 * 8. Three linear indices (rows 1 -0.4 0.8 / 1 1 -1 / 1.3 -0.5 1) asked
 *    for 0.5, -0.7 and -0.9: the coupled steps hold the second control at
 *    +1, where its own slope keeps it, but with the other free control
 *    answering, its index asks to come back inside; released, it ends at
 *    0.429 with the first two indices met and only the third control held.
 *    When the release probe loses the second index (its reading absent
 *    between 0.9 and 0.97), the control stays held.
 * 9. Three coupled quadratic indices (rows 1 0.9 0.8 / 0.4 1 0.4 /
 *    -1.1 -0.9 1, each plus 0.7, 0.5 and 0.1 times its own control
 *    squared) asked for -1.3, -0.4 and 0.6: the first control, released
 *    from one bound, is carried by a step to the other; not pinned there,
 *    it ends inside with the first and third indices met and only the
 *    second control held. Pinned at the bound it had not tried, it stayed
 *    at +1 with its index at 1.40.
 * 10. A target list of another length and a singular system refuse.
 */
export const test_subject_face_anthropometry_solve = (): void => {
  const model = (v: readonly number[]) => [
    1 + 0.5 * v[0]! + 0.2 * v[0]! ** 2 + 0.25 * v[1]!,
    2 + 0.25 * v[0]! + 0.8 * v[1]!,
  ];
  const controls = [
    { id: "a", start: 0, lower: -1, upper: 1 },
    { id: "b", start: 0, lower: -1, upper: 1 },
  ];
  const truth = [0.4, -0.3];
  const solved = solveFaceAnthropometry({
    controls,
    targets: model(truth),
    evaluate: model,
  });
  TestValidator.predicate(
    "reaches",
    solved.achieved.every((v, k) =>
      nclose(v!, model(truth)[k]!, 1e-3 * model(truth)[k]!),
    ) &&
      solved.values.every((v, k) => nclose(v, truth[k]!, 1e-2)) &&
      solved.held.length === 0,
  );
  const held = solveFaceAnthropometry({
    controls,
    targets: [model([3, 0])[0]!, 2.4],
    evaluate: model,
  });
  TestValidator.predicate(
    "held at the bound",
    held.values[0] === 1 &&
      held.held.includes(0) &&
      nclose(model(held.values)[1]!, 2.4, 2.4e-3),
  );
  const blocked = solveFaceAnthropometry({
    controls,
    targets: [2, 1],
    evaluate: (v) => [v[0]!, v[1]!],
    iterations: 1,
  });
  TestValidator.equals("blocked step", blocked.values, [1, 0.5]);
  const unmeasured = solveFaceAnthropometry({
    controls,
    targets: [null, 2.4],
    evaluate: model,
  });
  TestValidator.predicate(
    "unmeasured stays",
    unmeasured.values[0] === 0 &&
      unmeasured.unmeasured.includes(0) &&
      unmeasured.achieved[0] === null,
  );
  const wide = [...new Array(20).keys()];
  const coupled = (v: readonly number[]) =>
    v.map(
      (x, i) =>
        x + 0.05 * v.reduce((sum, y, j) => (j === i ? sum : sum + y), 0),
    );
  const many = {
    controls: wide.map((i) => ({ id: `c${i}`, start: 0, lower: -1, upper: 1 })),
    targets: wide.map((i) => (i < 16 ? 3 : 0.5)),
    evaluate: coupled,
  };
  const budget = solveFaceAnthropometry(many);
  const short = solveFaceAnthropometry({ ...many, iterations: 12 });
  const solvedFree = (solution: typeof budget) =>
    wide.slice(16).every((i) => nclose(solution.achieved[i]!, 0.5, 0.5e-3));
  TestValidator.predicate(
    "budget per control",
    budget.held.length === 16 &&
      solvedFree(budget) &&
      budget.iterations > 12 &&
      !solvedFree(short),
  );
  const quantized = (v: readonly number[]) => [
    Math.round((v[0]! - 0.3) / 2e-5) * 2e-5 + 1e-5,
  ];
  const zero = { id: "z", start: 0, lower: -1, upper: 1 };
  const resolved = solveFaceAnthropometry({
    controls: [{ ...zero, resolution: 1e-5 }],
    targets: [0],
    evaluate: quantized,
    iterations: 10,
  });
  const unresolved = solveFaceAnthropometry({
    controls: [zero],
    targets: [0],
    evaluate: quantized,
    iterations: 10,
  });
  TestValidator.predicate(
    "resolution",
    resolved.iterations === 1 &&
      nclose(resolved.achieved[0]!, 0, 1e-5 + 1e-12) &&
      unresolved.iterations === 10,
  );
  const losing = (v: readonly number[]) => {
    const [a, b] = model(v);
    return [v[0]! > 0.3 ? null : a!, b!];
  };
  const lost = solveFaceAnthropometry({
    controls,
    targets: model(truth),
    evaluate: losing,
  });
  TestValidator.predicate(
    "lost on the way",
    lost.unmeasured.includes(0) &&
      lost.achieved[0] === null &&
      lost.values[0]! > 0.3 &&
      nclose(model(lost.values)[1]!, model(truth)[1]!, 1e-3 * model(truth)[1]!),
  );
  const probed = solveFaceAnthropometry({
    controls: [{ ...controls[0]!, start: 0.26 }, controls[1]!],
    targets: model([0.28, -0.3]),
    evaluate: losing,
  });
  TestValidator.predicate(
    "lost in the probe",
    probed.unmeasured.includes(0) &&
      probed.values[0] === 0.26 &&
      nclose(
        model(probed.values)[1]!,
        model([0.28, -0.3])[1]!,
        1e-3 * model([0.28, -0.3])[1]!,
      ),
  );
  const cycling = solveFaceAnthropometry({
    controls,
    targets: [0.4, 0.4],
    evaluate: (v) => [
      v[0]! - 0.2 * v[1]! - v[0]! ** 2 - 0.2 * v[1]! ** 2,
      v[1]! - 0.2 * v[0]! + 0.6 * v[0]! * v[1]!,
    ],
    iterations: 40,
  });
  TestValidator.predicate(
    "held for good",
    cycling.iterations === 6 &&
      cycling.values[0] === 1 &&
      cycling.held.includes(0) &&
      nclose(cycling.achieved[1]!, 0.4, 4e-4),
  );
  const linear = (lost: boolean) =>
    solveFaceAnthropometry({
      controls: [0, 1, 2].map((k) => ({
        id: `c${k}`,
        start: 0,
        lower: -1,
        upper: 1,
      })),
      targets: [0.5, -0.7, -0.9],
      evaluate: (v) =>
        [
          [1, -0.4, 0.8],
          [1, 1, -1],
          [1.3, -0.5, 1],
        ].map((row, i) =>
          lost && i === 1 && v[1]! > 0.9 && v[1]! < 0.97
            ? null
            : row.reduce((sum, m, k) => sum + m * v[k]!, 0),
        ),
    });
  const answered = linear(false);
  const unanswered = linear(true);
  TestValidator.predicate(
    "reduced release",
    answered.held.join() === "2" &&
      nclose(answered.values[1]!, 0.429, 1e-3) &&
      nclose(answered.achieved[0]!, 0.5, 5e-4) &&
      nclose(answered.achieved[1]!, -0.7, 7e-4) &&
      unanswered.held.join() === "1,2" &&
      unanswered.values[1] === 1,
  );
  const crossed = solveFaceAnthropometry({
    controls: [0, 1, 2].map((k) => ({
      id: `c${k}`,
      start: 0,
      lower: -1,
      upper: 1,
    })),
    targets: [-1.3, -0.4, 0.6],
    evaluate: (v) =>
      [
        [1, 0.9, 0.8],
        [0.4, 1, 0.4],
        [-1.1, -0.9, 1],
      ].map(
        (row, i) =>
          row.reduce((sum, m, k) => sum + m * v[k]!, 0) +
          [0.7, 0.5, 0.1][i]! * v[i]! ** 2,
      ),
  });
  TestValidator.predicate(
    "crossed, not pinned",
    crossed.held.join() === "1" &&
      nclose(crossed.values[0]!, -0.0805, 1e-3) &&
      nclose(crossed.achieved[0]!, -1.3, 1.3e-3) &&
      nclose(crossed.achieved[2]!, 0.6, 6e-4),
  );
  TestValidator.predicate(
    "length",
    throwsError(
      () => solveFaceAnthropometry({ controls, targets: [1], evaluate: model }),
      "one target",
    ),
  );
  TestValidator.predicate(
    "singular",
    throwsError(
      () =>
        solveLinear(
          [
            [1, 2],
            [2, 4],
          ],
          [1, 2],
        ),
      "singular",
    ),
  );
};

/**
 * The most probable controls under norms.
 * Scenarios:
 * 1. Three coupled indices whose norms the controls can meet together are
 *    met to their resolution.
 * 2. Norms past the envelope (a sum of 3, or of -3, from two controls
 *    within +-1) hold both controls at their upper, or lower, bounds; a
 *    control left at a bound its score does not press against (no steps
 *    taken, the norm inside) is not held.
 * 3. Two norms one control cannot meet together (x toward 1, 2x toward 0,
 *    the second control felt by neither) settle at 1 / (1 + 4 / s^2): 0.5
 *    when the second index varies twice as much (s = 2), 0.2 when equally
 *    (s = 1); the unfelt control stays.
 * 4. An index lost by a probe (past 0.9, from 0.88) is left out, its
 *    control where it stands; a step into a lost reading (a norm of 1 read
 *    only up to 0.9, from 0.5) is refused and a shorter one, short of 0.9,
 *    taken; a reading that is not a number moves nothing; lists of other
 *    lengths refuse.
 */
export const test_subject_face_anthropometry_solve_norms = (): void => {
  const pair = [
    { id: "a", start: 0, lower: -1, upper: 1, resolution: 1e-6 },
    { id: "b", start: 0, lower: -1, upper: 1, resolution: 1e-6 },
  ];
  const model = (v: readonly number[]) => [
    1 + 0.5 * v[0]! + 0.2 * v[0]! ** 2 + 0.25 * v[1]!,
    2 + 0.25 * v[0]! + 0.8 * v[1]! + 0.1 * v[2]!,
    0.3 * v[2]! - 0.2 * v[0]!,
  ];
  const truth = [0.4, -0.3, 0.6];
  const met = solveFaceNorms({
    controls: [
      ...pair,
      { id: "c", start: 0, lower: -1, upper: 1, resolution: 1e-6 },
    ],
    targets: model(truth),
    spreads: [1, 1, 1],
    evaluate: model,
  });
  TestValidator.predicate(
    "met",
    met.values.every((v, k) => nclose(v, truth[k]!, 1e-5)) &&
      met.held.length === 0,
  );
  const bounded = solveFaceNorms({
    controls: pair,
    targets: [3, 0],
    spreads: [1, 1],
    evaluate: (v) => [v[0]! + v[1]!, v[0]! - v[1]!],
  });
  const below = solveFaceNorms({
    controls: pair,
    targets: [-3, 0],
    spreads: [1, 1],
    evaluate: (v) => [v[0]! + v[1]!, v[0]! - v[1]!],
  });
  const resting = solveFaceNorms({
    controls: [{ ...pair[0]!, start: 1 }],
    targets: [0.5],
    spreads: [1],
    evaluate: (v) => [v[0]!],
    iterations: 0,
  });
  TestValidator.equals(
    "bounded",
    [bounded.values, bounded.held, below.values, below.held, resting.held],
    [[1, 1], [0, 1], [-1, -1], [0, 1], []],
  );
  const settle = (spread: number) =>
    solveFaceNorms({
      controls: pair,
      targets: [1, 0],
      spreads: [1, spread],
      evaluate: (v) => [v[0]!, 2 * v[0]!],
    }).values;
  TestValidator.predicate(
    "compromise",
    nclose(settle(2)[0]!, 0.5, 1e-9) &&
      nclose(settle(1)[0]!, 0.2, 1e-9) &&
      settle(1)[1] === 0,
  );
  const lost = solveFaceNorms({
    controls: [{ ...pair[0]!, start: 0.88 }, pair[1]!],
    targets: [0.3, 0],
    spreads: [1, 1],
    evaluate: (v) => [v[0]! > 0.9 ? null : v[0]!, v[1]!],
  });
  const short = solveFaceNorms({
    controls: [{ ...pair[0]!, start: 0.5 }],
    targets: [1],
    spreads: [1],
    evaluate: (v) => [v[0]! > 0.9 ? null : v[0]!],
  });
  const nan = solveFaceNorms({
    controls: [pair[0]!],
    targets: [1],
    spreads: [1],
    evaluate: (v) => [v[0] === 0 ? 0 : NaN],
  });
  TestValidator.predicate(
    "lost, lengths",
    lost.values[0] === 0.88 &&
      lost.unmeasured.includes(0) &&
      short.values[0]! > 0.85 &&
      short.values[0]! <= 0.9 &&
      nan.values[0] === 0 &&
      throwsError(
        () =>
          solveFaceNorms({
            controls: pair,
            targets: [1, 0],
            spreads: [1],
            evaluate: (v) => [v[0]!, v[1]!],
          }),
        "spread per control",
      ),
  );
};
