import { createHumanBodyMeasurementReader } from "@automovie/human/body/measure/createHumanBodyMeasurementReader";
import { assertHumanBodySimpleValues } from "@automovie/human/body/simple/assertHumanBodySimpleValues";
import { humanBodySimpleChannel } from "@automovie/human/body/simple/humanBodySimpleChannel";
import { humanBodySimpleShapeDirection } from "@automovie/human/body/simple/humanBodySimpleShapeDirection";
import { solveHumanBodySimpleCoupling } from "@automovie/human/body/simple/solveHumanBodySimpleCoupling";
import { TestValidator } from "@nestia/e2e";

import { humanBodySimpleFixture } from "../internal/humanBodySimpleFixture";
import { throwsError } from "../internal/predicates";

/**
 * The body adapter rejects invalid request budgets, unreadable/fixed directions
 * and unreachable readings; its final assertion names genuine measurement misses.
 *
 * Scenarios:
 * 1. Nonfinite/nonpositive targets and negative/nonfinite budgets refuse before
 *    numerical normalization; a nonfinite reading cannot become a solution.
 * 2. The analytic box lacks the bust landmark, so its real bust rule reads null;
 *    a zero waist direction and a requested 5 m waist cannot solve.
 * 3. Final assertion admits the neutral 0.84 m waist and reports a 5 m waist
 *    miss or an unavailable bust, without changing the caller's input shape.
 */
export const test_human_body_simple_coupling_refusal = (): void => {
  const { wide, narrow } = humanBodySimpleFixture.weights;
  const basis = humanBodySimpleFixture.basis(wide, narrow);
  const waist = {
    name: "waistMetres", target: 0.84, tolerance: 0.001,
    along: humanBodySimpleShapeDirection.alone(basis, "measureWaistCirc"),
    read: (reader: ReturnType<typeof createHumanBodyMeasurementReader>) => humanBodySimpleChannel(reader, "measureWaistCirc"),
  };
  for (const target of [NaN, Infinity, 0, -1])
    TestValidator.predicate("invalid target refuses", throwsError(() =>
      solveHumanBodySimpleCoupling(basis, {}, [{ ...waist, target }]), "positive finite"));
  for (const tolerance of [NaN, Infinity, -1])
    TestValidator.predicate("invalid tolerance refuses", throwsError(() =>
      solveHumanBodySimpleCoupling(basis, {}, [{ ...waist, tolerance }]), "nonnegative finite"));
  TestValidator.equals("nonfinite instrument", solveHumanBodySimpleCoupling(
    basis, {}, [{ ...waist, read: () => Infinity }],
  ), null);
  const bust = { ...waist, name: "bustMetres", target: 1,
    read: (reader: ReturnType<typeof createHumanBodyMeasurementReader>) => humanBodySimpleChannel(reader, "measureBustCirc") };
  TestValidator.equals("actual missing bust landmark", solveHumanBodySimpleCoupling(basis, {}, [bust]), null);
  const zero = { ...waist, target: 1,
    along: { ...waist.along, direction: [{ channel: "measureWaistCirc", coefficient: 0 }] } };
  TestValidator.equals("fixed direction", solveHumanBodySimpleCoupling(basis, {}, [zero]), null);
  TestValidator.equals("unreachable waist", solveHumanBodySimpleCoupling(
    basis, {}, [{ ...waist, target: 5 }],
  ), null);
  assertHumanBodySimpleValues(basis, {}, [waist]);
  TestValidator.predicate("miss identifies the requested measurement", throwsError(() =>
    assertHumanBodySimpleValues(basis, {}, [{ ...waist, target: 5 }]), "waistMetres 5 reads 0.8400"));
  TestValidator.predicate("unreadable measurement identifies the missing reading", throwsError(() =>
    assertHumanBodySimpleValues(basis, {}, [bust]), "bustMetres 1 reads nothing"));
};
