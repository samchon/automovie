import { AutoMovieEngineResolve } from "@automovie/engine";
import type {
  IAutoMovieChannelLimit,
  IAutoMovieClampOutcome,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/** Component 0 within [0, 3], component 1 above -2, component 2 free. */
const LIMIT: IAutoMovieChannelLimit = {
  channel: { kind: "node", node: "arm", path: "translation" },
  min: [0, -2],
  max: [3, null, null],
};

/**
 * `applyChannelLimit` clamps each component to its bounds and lists each
 * violation in component order. Each null or omitted bound leaves that side
 * unbounded.
 *
 * Scenarios:
 *
 * 1. (5, -5, 7) becomes (3, -2, 7) with a max violation of component 0 (limit 3,
 *    actual 5) and a min violation of component 1 (limit -2, actual -5).
 * 2. A value inside the bounds is returned as is, without violation.
 * 3. Bound width and ordering errors throw. NaN, infinity and in-width sparse
 *    bound slots throw, while explicit null and omitted tails leave that side
 *    free.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names upper and lower violations, unbound lanes, an admissible vector, and two malformed-bound refusals.
 * @evidence contracts/development/testing.md#behavioral-verification Calls `applyChannelLimit` with typed limit records and literal vectors, checking the transformed values, ordered diagnostics, width/order errors and separate finite-bound messages on both sides.
 * @evidence contracts/development/testing.md#independent-expectations The bounds [0, 3] and [-2, ∞) send (5, -5, 7) to (3, -2, 7). The violations preserve actual values 5 and -5 and occur in component order. A bound at index 1 exceeds a one-lane vector, and 4 cannot be a minimum below maximum 3.
 */
export function test_engine_resolve_apply_channel_limit(): void {
  const clamped: IAutoMovieClampOutcome =
    AutoMovieEngineResolve.applyChannelLimit([5, -5, 7], LIMIT);
  TestValidator.equals("a clamped value", clamped, {
    value: [3, -2, 7],
    violations: [
      { component: 0, bound: "max", limit: 3, actual: 5 },
      { component: 1, bound: "min", limit: -2, actual: -5 },
    ],
  });
  TestValidator.equals(
    "a free value",
    AutoMovieEngineResolve.applyChannelLimit([1, 0, 9], LIMIT),
    {
      value: [1, 0, 9],
      violations: [],
    },
  );
  TestValidator.predicate(
    "a bound beyond the width",
    throwsError(
      () =>
        AutoMovieEngineResolve.applyChannelLimit([1], {
          ...LIMIT,
          min: [0, 5],
        }),
      "outside value width",
    ),
  );
  TestValidator.predicate(
    "a minimum above its maximum",
    throwsError(
      () =>
        AutoMovieEngineResolve.applyChannelLimit([1, 1, 1], {
          ...LIMIT,
          min: [4],
        }),
      "must be <=",
    ),
  );
  const invalidBounds: (number | null)[][] = [
    [NaN],
    [Infinity],
    [Number.NEGATIVE_INFINITY],
    new Array<number | null>(1),
  ];
  for (const [index, bounds] of invalidBounds.entries())
    for (const side of ["min", "max"] as const)
      TestValidator.predicate(
        `in-width nonfinite or absent ${side} lane ${index}`,
        throwsError(
          (): IAutoMovieClampOutcome =>
            AutoMovieEngineResolve.applyChannelLimit([1, 2, 3], {
              ...LIMIT,
              [side]: bounds,
            }),
          `${side}[0] must be finite or null`,
        ),
      );
  TestValidator.equals(
    "null slots and omitted tails leave lanes free",
    AutoMovieEngineResolve.applyChannelLimit([1, 2, 3], {
      ...LIMIT,
      min: [null],
      max: [null, null, null, null],
    }),
    { value: [1, 2, 3], violations: [] },
  );
}
