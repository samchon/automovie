import { applyChannelLimit } from "@automovie/engine";
import type {
  IAutoMovieChannelLimit,
  IAutoMovieClampOutcome,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/throwsError";

/** Component 0 within [0, 3], component 1 above -2, component 2 free. */
const LIMIT: IAutoMovieChannelLimit = {
  channel: { kind: "node", node: "arm", path: "translation" },
  min: [0, -2],
  max: [3, null, null],
};

/**
 * `applyChannelLimit` clamps each component to its bounds and lists each
 * violation in component order, a null or absent bound leaving a component
 * free.
 *
 * Scenarios:
 *
 * 1. (5, -5, 7) becomes (3, -2, 7) with a max violation of component 0 (limit 3,
 *    actual 5) and a min violation of component 1 (limit -2, actual -5).
 * 2. A value inside the bounds is returned as is, without violation.
 * 3. A bound beyond the value width, and a minimum above its maximum, are refused.
 */
export function test_unit_engine_resolve_apply_channel_limit(): void {
  const clamped: IAutoMovieClampOutcome = applyChannelLimit([5, -5, 7], LIMIT);
  TestValidator.equals("a clamped value", clamped, {
    value: [3, -2, 7],
    violations: [
      { component: 0, bound: "max", limit: 3, actual: 5 },
      { component: 1, bound: "min", limit: -2, actual: -5 },
    ],
  });
  TestValidator.equals("a free value", applyChannelLimit([1, 0, 9], LIMIT), {
    value: [1, 0, 9],
    violations: [],
  });
  TestValidator.predicate(
    "a bound beyond the width",
    throwsError(
      () => applyChannelLimit([1], { ...LIMIT, min: [0, 5] }),
      "outside value width",
    ),
  );
  TestValidator.predicate(
    "a minimum above its maximum",
    throwsError(
      () => applyChannelLimit([1, 1, 1], { ...LIMIT, min: [4] }),
      "must be <=",
    ),
  );
}
