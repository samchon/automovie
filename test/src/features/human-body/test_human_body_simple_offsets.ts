import { solveHumanBodySimpleOffsets } from "@automovie/human/body/simple/solveHumanBodySimpleOffsets";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

/**
 * Bounded simultaneous offsets solve independent equations through the actual
 * numerical owner, rather than a copied Newton implementation.
 *
 * Scenarios:
 * 1. x+2y=1.3, 3x+4y=2.9 has x=0.3,y=0.5; elimination must swap its
 *    first pivot row, and both offsets stay inside [-1,1].
 * 2. Starting at offset zero on [-2,0], x+2=0 reaches the inward endpoint;
 *    the initial derivative must sample toward the interior.
 * 3. (x+0.1)^2=1 from zero needs a damped first step and reaches x=0.9.
 * 4. An already met reading is returned without another evaluation; an
 *    empty met system returns a fresh empty vector.
 */
export const test_human_body_simple_offsets = (): void => {
  const met = (values: readonly number[]): boolean => values.every((value) => Math.abs(value) <= 1e-8);
  const evaluate = ([x, y]: readonly number[]): number[] => [x + 2 * y - 1.3, 3 * x + 4 * y - 2.9];
  const ranges: [number, number][] = [[-1, 1], [-1, 1]];
  const initial = [-1.3, -2.9];
  const solved = solveHumanBodySimpleOffsets({ ranges, initial, evaluate, met });
  TestValidator.predicate("independent linear solution", solved !== null &&
    nclose(solved[0], 0.3, 1e-8) && nclose(solved[1], 0.5, 1e-8));
  TestValidator.equals("ranges unchanged", ranges, [[-1, 1], [-1, 1]]);
  TestValidator.predicate("initial residual unchanged", nclose(initial[0], -1.3) && nclose(initial[1], -2.9));
  const inward = solveHumanBodySimpleOffsets({
    ranges: [[-2, 0]], initial: [2], evaluate: ([x]) => [x + 2], met,
  });
  TestValidator.predicate("full inward interval remains available", inward !== null && nclose(inward[0], -2));
  const calls: number[] = [];
  const curved = solveHumanBodySimpleOffsets({
    ranges: [[-10, 10]], initial: [-0.99],
    evaluate: ([x]) => { calls.push(x); return [(x + 0.1) ** 2 - 1]; }, met,
  });
  TestValidator.predicate("curved equation root", curved !== null && nclose(curved[0], 0.9, 1e-7));
  TestValidator.predicate("damping rejects the full overshoot", calls.some((x) => x > 1) &&
    calls.some((x) => x > 0 && x < 1));
  let reads = 0;
  const already = solveHumanBodySimpleOffsets({
    ranges: [[-1, 1]], initial: [0], evaluate: () => { ++reads; return null; }, met,
  });
  TestValidator.equals("met body keeps its offset", already, [0]);
  TestValidator.equals("no derivative after a met reading", reads, 0);
  TestValidator.equals("empty system", solveHumanBodySimpleOffsets({
    ranges: [], initial: [], evaluate: () => [], met,
  }), []);
};
