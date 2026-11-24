import { applyChannelLimit } from "@automovie/engine";
import {
  IAutoMovieChannel,
  IAutoMovieChannelLimit,
  type IAutoMovieClampOutcome,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";

/** Compare array length and finite scalar values with zero absolute tolerance. */
function sameValues(actual: number[], expected: number[]): boolean {
  return (
    actual.length === expected.length &&
    actual.every((value: number, index: number): boolean =>
      nclose(value, expected[index]!, 0),
    )
  );
}

const CHANNEL: IAutoMovieChannel = {
  kind: "node",
  node: "n",
  path: "translation",
};

const limit: (
  min: (number | null)[] | null,
  max: (number | null)[] | null,
) => IAutoMovieChannelLimit = (
  min: (number | null)[] | null,
  max: (number | null)[] | null,
): IAutoMovieChannelLimit => ({ channel: CHANNEL, min, max });

/**
 * Clamp sampled components to channel bounds and report each crossing, preserving null-side and null-component freedoms.
 *
 * Scenarios:
 *
 * 1. A both-sides-null limit clamps nothing and reports no violation: the value
 *    passes through untouched.
 * 2. A mixed limit (`min=[0,null,-5]`, `max=[10,null,50]`) on `[-3,99,100]`:
 *    component 0 underflows and clamps up to 0, component 1 is free on both
 *    sides (null component), component 2 overflows and clamps down to 50. The
 *    two violations are reported in component order with their bound, limit,
 *    and pre-clamp actual.
 * 3. A value already inside the bounds yields the value verbatim and no violations
 *    (the not-below / not-above sides of both comparisons).
 * 4. A component with both bounds present rejects when `min > max`, because no
 *    clamp result can satisfy both sides of that range.
 * 5. Non-null bound components beyond the sampled value width reject instead of
 *    being silently ignored.
 */
export function test_unit_engine_resolve_channel_limit(): void {
  // 1. both sides null → untouched
  const free: IAutoMovieClampOutcome = applyChannelLimit(
    [1, 2, 3],
    limit(null, null),
  );
  TestValidator.predicate(
    "null limit keeps value",
    sameValues(free.value, [1, 2, 3]),
  );
  TestValidator.equals(
    "null limit has no violations",
    free.violations.length,
    0,
  );

  // 2. mixed under/over/free
  const mixed: IAutoMovieClampOutcome = applyChannelLimit(
    [-3, 99, 100],
    limit([0, null, -5], [10, null, 50]),
  );
  TestValidator.predicate(
    "mixed clamp value",
    sameValues(mixed.value, [0, 99, 50]),
  );
  TestValidator.equals(
    "mixed clamp violation addresses",
    mixed.violations.map(
      (
        entry: (typeof mixed.violations)[number],
      ): { component: number; bound: "min" | "max" } => ({
        component: entry.component,
        bound: entry.bound,
      }),
    ),
    [
      { component: 0, bound: "min" },
      { component: 2, bound: "max" },
    ],
  );
  TestValidator.predicate(
    "mixed clamp violation numbers",
    nclose(mixed.violations[0]!.limit, 0, 0) &&
      nclose(mixed.violations[0]!.actual, -3, 0) &&
      nclose(mixed.violations[1]!.limit, 50, 0) &&
      nclose(mixed.violations[1]!.actual, 100, 0),
  );
  TestValidator.equals(
    "mixed clamp violation output fields",
    mixed.violations.map((entry: (typeof mixed.violations)[number]): string[] =>
      Object.keys(entry).sort((a: string, b: string): number =>
        a < b ? -1 : a > b ? 1 : 0,
      ),
    ),
    [
      ["actual", "bound", "component", "limit"],
      ["actual", "bound", "component", "limit"],
    ],
  );

  // 3. within range → untouched, both comparisons take the "not crossed" side
  const inside: IAutoMovieClampOutcome = applyChannelLimit(
    [5, 5, 5],
    limit([0, 0, 0], [10, 10, 10]),
  );
  TestValidator.predicate(
    "in-range keeps value",
    sameValues(inside.value, [5, 5, 5]),
  );
  TestValidator.equals(
    "in-range has no violations",
    inside.violations.length,
    0,
  );

  TestValidator.predicate(
    "inverted component range rejects",
    throwsError(
      (): IAutoMovieClampOutcome =>
        applyChannelLimit([7, 2, 3], limit([10, null, null], [5, null, null])),
      ["node:n:translation", "min[0]", "10", "max[0]", "5"],
    ),
  );

  TestValidator.predicate(
    "extra min component rejects",
    throwsError(
      (): IAutoMovieClampOutcome =>
        applyChannelLimit([5], limit([0, 10], null)),
      ["node:n:translation", "min[1]", "value width", "1", "10"],
    ),
  );

  TestValidator.predicate(
    "extra max component rejects",
    throwsError(
      (): IAutoMovieClampOutcome =>
        applyChannelLimit([5], limit(null, [10, 20])),
      ["node:n:translation", "max[1]", "value width", "1", "20"],
    ),
  );
}
