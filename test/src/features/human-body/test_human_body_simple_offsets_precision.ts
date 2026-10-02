import { solveHumanBodySimpleOffsets } from "@automovie/human/body/simple/solveHumanBodySimpleOffsets";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

/**
 * A tiny but finite scalar interval still has the representable linear root
 * x/scale=0.5. The full offset owner must not call it a zero secant step.
 *
 * Scenarios:
 * 1. Ordinary and 1e-200 intervals solve 2*x/scale-1=0; the independent
 *    assertion normalizes x so an incorrect zero cannot pass an absolute epsilon.
 * 2. A 1e200 interval has a derivative below the solver's declared 1e-12
 *    pivot ceiling and remains unresolved/null, not a physiological refusal.
 * 3. Constant response also returns null; caller intervals remain unchanged.
 */
export const test_human_body_simple_offsets_precision = (): void => {
  const met = (values: readonly number[]): boolean => values.every((value) => Math.abs(value) <= 1e-8);
  for (const scale of [1, 1e-200]) {
    const ranges: [number, number][] = [[-scale, scale]];
    const snapshot = JSON.stringify(ranges);
    const result = solveHumanBodySimpleOffsets({
      ranges, initial: [-1], evaluate: ([x]) => [2 * (x / scale) - 1], met,
    });
    TestValidator.predicate("representable linear root", result !== null &&
      Number.isFinite(result[0]) && nclose(result[0] / scale, 0.5, 1e-12));
    TestValidator.equals("caller interval unchanged", JSON.stringify(ranges), snapshot);
  }
  TestValidator.equals("declared unresolved pivot ceiling", solveHumanBodySimpleOffsets({
    ranges: [[-1e200, 1e200]], initial: [-1],
    evaluate: ([x]) => [2 * (x / 1e200) - 1], met,
  }), null);
  TestValidator.equals("constant instrument remains unresolved", solveHumanBodySimpleOffsets({
    ranges: [[-1, 1]], initial: [1], evaluate: () => [1], met,
  }), null);
};
