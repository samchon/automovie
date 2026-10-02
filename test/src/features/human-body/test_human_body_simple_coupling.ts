import { createHumanBodyMeasurementReader } from "@automovie/human/body/measure/createHumanBodyMeasurementReader";
import { assertHumanBodySimpleValues } from "@automovie/human/body/simple/assertHumanBodySimpleValues";
import { humanBodySimpleChannel } from "@automovie/human/body/simple/humanBodySimpleChannel";
import { humanBodySimpleShapeDirection } from "@automovie/human/body/simple/humanBodySimpleShapeDirection";
import { humanBodySimpleVolume } from "@automovie/human/body/simple/humanBodySimpleVolume";
import { solveHumanBodySimpleCoupling } from "@automovie/human/body/simple/solveHumanBodySimpleCoupling";
import { TestValidator } from "@nestia/e2e";

import { humanBodySimpleFixture } from "../internal/humanBodySimpleFixture";
import { nclose } from "../internal/predicates";

/**
 * Coupling reads mass and waist on one actual analytic body, then verifies
 * both at that same solved skin. No target is taken from the solver's output.
 *
 * Scenarios:
 * 1. The box starts 0.14 by 0.28 by 2 m. Weight 0.3 widens it to 0.17 m;
 *    waist 0.5 deepens it to 0.31 m, so its volume at 1000 kg/m3 is
 *    0.17*0.31*2*1000=105.4 kg and its waist is 2*(0.17+0.31)=0.96 m.
 * 2. The same readings are reachable from a +1 weight endpoint; offsets are
 *    based on that current shape rather than its absolute [-1,1] envelope.
 * 3. The basis, caller's shape and request rows remain unchanged; assertion
 *    after solving reads the achieved quantities rather than just weights.
 */
export const test_human_body_simple_coupling = (): void => {
  const { wide, narrow } = humanBodySimpleFixture.weights;
  const basis = humanBodySimpleFixture.basis(wide, narrow);
  const unknowns = [
    {
      name: "massKilograms", target: 105.4, tolerance: 0.0001,
      along: humanBodySimpleShapeDirection.alone(basis, "macroWeight"),
      read: (reader: ReturnType<typeof createHumanBodyMeasurementReader>) => humanBodySimpleVolume(basis, reader.shaped) * 1000,
    },
    {
      name: "waistMetres", target: 0.96, tolerance: 0.000001,
      along: humanBodySimpleShapeDirection.alone(basis, "measureWaistCirc"),
      read: (reader: ReturnType<typeof createHumanBodyMeasurementReader>) => humanBodySimpleChannel(reader, "measureWaistCirc"),
    },
  ];
  const snapshot = JSON.stringify(basis);
  const shapes: Record<string, number>[] = [{}, { macroWeight: 1 }];
  for (const shape of shapes) {
    const original = { ...shape };
    const solved = solveHumanBodySimpleCoupling(basis, shape, unknowns);
    TestValidator.predicate("both requested body readings converge", solved !== null &&
      nclose(solved.macroWeight, 0.3, 0.00001) && nclose(solved.measureWaistCirc, 0.5, 0.00001));
    if (solved === null) throw new Error("The analytic coupled body must be solvable.");
    assertHumanBodySimpleValues(basis, solved, unknowns);
    const reader = createHumanBodyMeasurementReader(basis, solved);
    TestValidator.predicate("hand-derived mass", nclose(humanBodySimpleVolume(basis, reader.shaped) * 1000, 105.4, 0.0001));
    const measuredWaist = humanBodySimpleChannel(reader, "measureWaistCirc");
    TestValidator.predicate("hand-derived waist", measuredWaist !== null &&
      nclose(measuredWaist, 0.96, 0.000001));
    TestValidator.equals("caller shape unchanged", shape, original);
  }
  const metShape = { macroWeight: 0.3, measureWaistCirc: 0.5 };
  const already = solveHumanBodySimpleCoupling(basis, metShape, unknowns);
  TestValidator.predicate("already met shape is an owned copy", already !== null && already !== metShape &&
    nclose(already.macroWeight, 0.3) && nclose(already.measureWaistCirc, 0.5));
  const empty = solveHumanBodySimpleCoupling(basis, metShape, []);
  TestValidator.predicate("empty request is an owned copy", empty !== null && empty !== metShape &&
    nclose(empty.macroWeight, 0.3));
  TestValidator.equals("basis unchanged", JSON.stringify(basis), snapshot);
};
