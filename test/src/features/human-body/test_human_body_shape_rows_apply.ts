import {
  type IAutoMovieHumanBodyBasis,
  applyHumanBodyShapeRows,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

const channel = (
  id: string,
  positive: string,
  negative: string | null,
): IAutoMovieHumanBodyBasis["channels"][number] => ({
  id,
  kind: "shape",
  group: "analytic",
  mirror: null,
  minimum: negative === null ? 0 : -1,
  maximum: 1,
  positive,
  negative,
});
const channels = [
  channel("bulk", "grow", "shrink"),
  channel("lift", "raise", null),
  channel("ghost", "unlisted", null),
];
const targets = (): Record<string, number[]> => ({
  grow: [1, 0.1, 0.2, 0.3],
  shrink: [1, 1, 0, 0, 2, 0, 1, 0],
  raise: [0, 5, 5, 5],
  fix: [2, 0, 0, 2],
});
const buffer = (): number[] => [0, 0, 0, 1, 1, 1, 2, 2, 2];

/**
 * One owner adds a document's channel and corrective rows to a position
 * buffer: p + sum(abs(weight) * endpoint) + sum(activation * target), with a
 * negative weight reading the negative endpoint.
 *
 * Scenarios:
 * 1. A positive weight scales the positive endpoint rows into the vertices
 *    the rows name and leaves the other vertices alone.
 * 2. A negative weight reads the negative endpoint at its absolute value, so
 *    both of its rows land on their own vertices.
 * 3. A zero weight, an absent weight and an endpoint with no rows add nothing.
 * 4. A corrective adds its target scaled by its activation only when the
 *    activation is positive, and a target with no rows adds nothing.
 * 5. Channels and correctives sum on one buffer, and the state and the rows
 *    stay unchanged, so only the caller's buffer is owned by the call.
 */
export const test_human_body_shape_rows_apply = (): void => {
  const apply = (
    weights: [string, number][],
    activations: { target: string; activation: number }[],
    positions: number[],
    rows: Record<string, number[]> = targets(),
  ): number[] => {
    applyHumanBodyShapeRows(
      { channels },
      { weights: new Map(weights), activations },
      positions,
      rows,
    );
    return positions;
  };
  const same = (actual: number[], expected: number[]): boolean =>
    actual.length === expected.length &&
    actual.every((value, index) => nclose(value, expected[index], 1e-12));

  TestValidator.predicate(
    "a positive weight scales the positive rows into the named vertex",
    same(apply([["bulk", 0.5]], [], buffer()), [
      0, 0, 0, 1.05, 1.1, 1.15, 2, 2, 2,
    ]),
  );
  TestValidator.predicate(
    "a negative weight reads the negative endpoint at its magnitude",
    same(apply([["bulk", -0.5]], [], buffer()), [
      0, 0, 0, 1.5, 1, 1, 2, 2.5, 2,
    ]),
  );
  TestValidator.predicate(
    "zero, absent and rowless endpoints add nothing",
    same(
      apply(
        [
          ["bulk", 0],
          ["ghost", 1],
        ],
        [],
        buffer(),
      ),
      buffer(),
    ),
  );
  TestValidator.predicate(
    "a corrective adds its scaled target when its activation is positive",
    same(apply([], [{ target: "fix", activation: 0.25 }], buffer()), [
      0, 0, 0, 1, 1, 1, 2, 2, 2.5,
    ]),
  );
  TestValidator.predicate(
    "an inactive corrective and one without rows add nothing",
    same(
      apply(
        [],
        [
          { target: "fix", activation: 0 },
          { target: "absent", activation: 1 },
        ],
        buffer(),
      ),
      buffer(),
    ),
  );
  const state = {
    weights: new Map([
      ["bulk", 1],
      ["lift", 1],
    ]),
    activations: [{ target: "fix", activation: 0.5 }],
  };
  const rows = targets();
  const positions = buffer();
  applyHumanBodyShapeRows({ channels }, state, positions, rows);
  TestValidator.predicate(
    "channels and correctives sum on one buffer",
    same(positions, [5, 5, 5, 1.1, 1.2, 1.3, 2, 2, 3]),
  );
  TestValidator.equals("the rows are read only", rows, targets());
  TestValidator.equals("the state is read only", [[...state.weights], state.activations], [
    [
      ["bulk", 1],
      ["lift", 1],
    ],
    [{ target: "fix", activation: 0.5 }],
  ]);
};
