import {
  HUMAN_BODY_SIMPLE_SHAPE,
  expandHumanBodySimpleShape,
  measureHumanBodySimpleShape,
  projectHumanBodySimpleShape,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanBodySimpleFixture } from "../internal/humanBodySimpleFixture";
import { nclose } from "../internal/predicates";

/**
 * The simple stature request is measured back on the final shaped skin even
 * when an anatomically authored corrective makes the height response curved.
 *
 * Scenarios:
 * 1. The box's 2 m ring lowers 0.5 m per negative height weight. A further
 *    0.2 m corrective ramps from weight magnitude 0.2 to 0.7. At magnitude
 *    0.4 the ring is 2 - 0.5(0.4) - 0.2(0.4-0.2)/(0.7-0.2) = 1.72 m.
 *    Its requested stature adds the table's head allowance. The solved body
 *    reads within half of a 0.1 mm metric display interval.
 * 2. If the mass channel also lifts or lowers the top ring by 0.04 m at its
 *    endpoints, solving mass after height changes the measured stature.
 *    The coupled result still meets the same requested height.
 */
export const test_human_body_simple_stature_inverse = (): void => {
  const { wide, narrow } = humanBodySimpleFixture.weights;
  const makeBasis = (positive: number[], negative: number[]) => {
    const basis = humanBodySimpleFixture.basis(positive, negative);
    basis.correctives = [
      {
        id: "statureRamp",
        inputs: [
          { channel: "macroHeight", side: "negative", onset: 0.2, full: 0.7 },
        ],
        weight: 1,
        target: "lowerMore",
      },
    ];
    basis.surfaces[0].targets.lowerMore = [
      4, 0, -0.2, 0, 5, 0, -0.2, 0, 6, 0, -0.2, 0, 7, 0, -0.2, 0,
    ];
    return basis;
  };
  const basis = makeBasis(wide, narrow);
  const statureMetres =
    1.72 + HUMAN_BODY_SIMPLE_SHAPE.stature.headAboveRingMetres;
  const shape = expandHumanBodySimpleShape(basis, {
    sex: 1,
    ageYears: 25,
    statureMetres,
    massKilograms: 22 * statureMetres * statureMetres,
    muscle: 0.5,
  });
  TestValidator.predicate(
    "curved stature response reaches the requested measurement",
    nclose(
      measureHumanBodySimpleShape.stature(basis, shape),
      statureMetres,
      0.00005,
    ),
  );
  const lift = (rows: number[], sign: number): number[] =>
    rows.map((value, at) =>
      at % 4 === 2 && Math.floor(at / 4) >= 4 ? sign * 0.04 : value,
    );
  const coupled = makeBasis(lift(wide, 1), lift(narrow, -1));
  const massKilograms = 30 * statureMetres * statureMetres;
  const heavy = expandHumanBodySimpleShape(coupled, {
    sex: 1,
    ageYears: 25,
    statureMetres,
    massKilograms,
    muscle: 0.5,
  });
  TestValidator.predicate(
    "stature remains met after the mass channel moves its top ring",
    nclose(
      measureHumanBodySimpleShape.stature(coupled, heavy),
      statureMetres,
      0.00005,
    ),
  );
  TestValidator.predicate(
    "mass remains met when stature is recoupled",
    nclose(
      projectHumanBodySimpleShape(coupled, heavy).massKilograms,
      massKilograms,
      0.05,
    ),
  );
};
