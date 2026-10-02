import { solveHumanBodySimpleOffsets } from "@automovie/human/body/simple/solveHumanBodySimpleOffsets";
import { TestValidator } from "@nestia/e2e";

/**
 * An unresolved numerical solve returns control to the strict measurement
 * inverse, preserving unreadable, singular and nonconvergent distinctions.
 *
 * Scenarios:
 * 1. Null initial data and a null finite-difference reading return null.
 * 2. A constant nonzero residual has a singular Jacobian; x^2+1 has no root
 *    and accepts no norm-reducing step from zero.
 * 3. x-1 is readable only through 0.7: damped progress stalls, a fresh
 *    derivative is tried once, and the unsupported root is not fabricated.
 * 4. A narrower readable domain can make the fresh derivative itself null.
 * 5. A double root with zero error budget cannot reach exact zero within the
 *    bounded iteration count; no approximate answer is labelled exact.
 */
export const test_human_body_simple_offsets_unresolved = (): void => {
  const met = (values: readonly number[]): boolean => values.every((value) => Math.abs(value) <= 1e-8);
  TestValidator.equals("unreadable initial state", solveHumanBodySimpleOffsets({
    ranges: [[-1, 1]], initial: null, evaluate: () => [1], met,
  }), null);
  TestValidator.equals("unreadable derivative state", solveHumanBodySimpleOffsets({
    ranges: [[-1, 1]], initial: [1], evaluate: () => null, met,
  }), null);
  TestValidator.equals("singular response", solveHumanBodySimpleOffsets({
    ranges: [[-1, 1]], initial: [1], evaluate: () => [1], met,
  }), null);
  TestValidator.equals("no decreasing step", solveHumanBodySimpleOffsets({
    ranges: [[-1, 1]], initial: [1], evaluate: ([x]) => [x * x + 1], met,
  }), null);
  const reads: number[] = [];
  TestValidator.equals("unreadable reach does not create a solution", solveHumanBodySimpleOffsets({
    ranges: [[-1, 1]], initial: [-1],
    evaluate: ([x]) => { reads.push(x); return x > 0.7 ? null : [x - 1]; }, met,
  }), null);
  TestValidator.predicate("reduced valid steps and invalid attempts both occur",
    reads.some((x) => x > 0 && x < 0.7) && reads.some((x) => x > 0.7));
  TestValidator.predicate("one fresh derivative lies between two failed step searches",
    reads.some((value, index) => value <= 0.7 && index >= 4 &&
      reads.slice(index - 4, index).every((x) => x > 0.7) &&
      reads.slice(index + 1, index + 5).length === 4 &&
      reads.slice(index + 1, index + 5).every((x) => x > 0.7)));
  const limited: number[] = [];
  TestValidator.equals("a fresh derivative can be unreadable", solveHumanBodySimpleOffsets({
    ranges: [[-1, 1]], initial: [-1],
    evaluate: ([x]) => { limited.push(x); return x > 0.672 ? null : [x - 1]; }, met,
  }), null);
  TestValidator.predicate("the last reading is the unreadable local derivative",
    limited[limited.length - 1] > 0.672 && limited[limited.length - 1] < 0.674);
  TestValidator.equals("iteration budget does not weaken exactness", solveHumanBodySimpleOffsets({
    ranges: [[-1, 1]], initial: [0.09], evaluate: ([x]) => [(x - 0.3) ** 2],
    met: (values) => values.every((value) => value === 0),
  }), null);
};
