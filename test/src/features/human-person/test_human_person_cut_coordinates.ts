import { createHumanLoopParameterLookup } from "@automovie/human/human/seam/createHumanLoopParameterLookup";
import { mergeHumanBoundaryLoops } from "@automovie/human/human/seam/mergeHumanBoundaryLoops";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../internal/predicates";

/**
 * Collar lookup uses the strictly admitted shared face correspondence.
 * Native radial shape does not enter this already projected cyclic coordinate.
 *
 * Scenarios:
 * 1. Decreasing samples bracket interior, exact, wrap and negative queries;
 *    tied samples retain last-resident ownership without a zero denominator.
 * 2. A small positive coordinate stays distinguishable from zero. A nonzero
 *    first sample exercises a query before the first and across the wrap.
 * 3. An unordered follow remains refused by the original merge admission;
 *    coordinate lookup never substitutes a repaired order for that guard.
 */
export const test_human_person_cut_coordinates = (): void => {
  const lookup = createHumanLoopParameterLookup([3, 2, 1, 0], 4);
  for (const [value, low, high, along] of [[0.5, 3, 2, 0.5], [2, 1, 0, 0], [3.5, 0, 3, 0.5], [-0.5, 0, 3, 0.5], [4, 3, 2, 0]]) {
    const found = lookup(value);
    TestValidator.predicate("cyclic parameter interval", found.low === low && found.high === high && nclose(found.along, along));
  }
  const tie = createHumanLoopParameterLookup([3, 2, 2, 1, 0], 4)(2);
  TestValidator.equals("last tied resident owns exact sample", tie, { low: 2, high: 0, along: 0 });
  const small = createHumanLoopParameterLookup([3, 1e-15, 0], 4)(1e-15);
  TestValidator.equals("positive sample does not round through an added period", small.low, 1);
  const wrap = createHumanLoopParameterLookup([3.5, 2.5, 1.5, 0.5], 4)(0);
  TestValidator.predicate("before first sample uses wrap interval", wrap.low === 0 && wrap.high === 3 && nclose(wrap.along, 0.5));
  TestValidator.predicate("strict ordering refusal remains armed", throwsError(() => mergeHumanBoundaryLoops(4, [3, 1, 2, 0]), "in order"));
  TestValidator.equals("ordered negative twin still merges", mergeHumanBoundaryLoops(4, [3, 2, 1, 0]).length, 24);
};
