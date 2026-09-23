import { TestValidator } from "@nestia/e2e";

import {
  solveFaceAnthropometry,
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
 *    and still solves the other.
 * 3. An unmeasured target keeps its control at its start.
 * 4. A target list of another length and a singular system refuse.
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
