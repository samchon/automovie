import {
  HUMAN_BODY_SIMPLE_SHAPE,
  type IAutoMovieHumanBodyBasis,
  expandHumanBodySimpleShape,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanBodySimpleFixture } from "../internal/humanBodySimpleFixture";
import { nclose } from "../internal/predicates";

/** The channels the ANSUR II people rows name, on an endpoint that moves nothing. */
const POPULATION = [
  "glutealProjection",
  "hipScaleHoriz",
  "hipScaleDepth",
  "lowerlegFatLeft",
  "lowerlegFatRight",
  "breastTransDownUp",
];

/**
 * The ANSUR II people rows set the gluteal projection, the hip breadth and
 * depth, the calf fat and a woman's breast position by sex over the body
 * mass index.
 *
 * The analytic box of the simple fixture gains the six channels on an
 * endpoint that moves nothing, so the solved stature, girths and mass are the
 * fixture's and each weight is the row's own value. At 25 years:
 * 1. A woman at BMI 22 gets gluteal projection -0.013, hip breadth -0.104,
 *    hip depth 0.143 and calf fat 0.246 on both sides; at BMI 30, 0.053,
 *    -0.22, 0.255 and 0.237.
 * 2. A man at BMI 22 gets -0.016, 0.24, 0.376 and 0.038; at BMI 30, 0.098,
 *    -0.138, 0.449 and 0.226.
 * 3. Between knots the weight is linear: a woman at BMI 24 gets the
 *    projection halfway between -0.013 and 0.023.
 * 4. The projection grows with the body mass index for both sexes and the
 *    hip breadth narrows, as the survey's people read deeper buttocks and
 *    narrower waists than the basis gave them.
 * 5. A woman's breast is lowered at BMI 22 (-0.257, the only row firing at
 *    25 years) and, at BMI 30, raised by 0.411 against the heavier breast's
 *    older row (-0.3 times 0.7), 0.201 in all; a man's is untouched.
 */
export const test_human_body_simple_population = (): void => {
  const { wide, narrow } = humanBodySimpleFixture.weights;
  const box = humanBodySimpleFixture.basis(wide, narrow);
  const basis: IAutoMovieHumanBodyBasis = {
    ...box,
    channels: [
      ...box.channels,
      ...POPULATION.map((id) => ({
        id,
        kind: "shape" as const,
        group: "hip",
        mirror: null,
        minimum: -1,
        maximum: 1,
        positive: "still",
        negative: "still",
      })),
    ],
    surfaces: [
      {
        ...box.surfaces[0],
        targets: { ...box.surfaces[0].targets, still: [] },
      },
    ],
  };
  const stature = 1.75 + HUMAN_BODY_SIMPLE_SHAPE.stature.headAboveRingMetres;
  const body = (sex: number, bmi: number) =>
    expandHumanBodySimpleShape(basis, {
      sex,
      ageYears: 25,
      statureMetres: stature,
      massKilograms: bmi * stature * stature,
      muscle: 0,
    });
  const expect = (
    title: string,
    shape: Record<string, number>,
    [projection, breadth, depth, calf]: number[],
  ): void => {
    TestValidator.predicate(
      title,
      nclose(shape.glutealProjection, projection, 1e-9) &&
        nclose(shape.hipScaleHoriz, breadth, 1e-9) &&
        nclose(shape.hipScaleDepth, depth, 1e-9) &&
        nclose(shape.lowerlegFatLeft, calf, 1e-9) &&
        nclose(shape.lowerlegFatRight, calf, 1e-9),
    );
  };
  const woman22 = body(-1, 22);
  const woman30 = body(-1, 30);
  const man22 = body(1, 22);
  const man30 = body(1, 30);
  expect("woman at BMI 22", woman22, [-0.013, -0.104, 0.143, 0.246]);
  expect("woman at BMI 30", woman30, [0.053, -0.22, 0.255, 0.237]);
  expect("man at BMI 22", man22, [-0.016, 0.24, 0.376, 0.038]);
  expect("man at BMI 30", man30, [0.098, -0.138, 0.449, 0.226]);
  TestValidator.predicate(
    "breast position by the body mass index",
    nclose(woman22.breastTransDownUp, -0.257, 1e-9) &&
      nclose(woman30.breastTransDownUp, 0.411 - 0.3 * 0.7, 1e-9) &&
      nclose(man22.breastTransDownUp ?? 0, 0, 1e-9),
  );
  TestValidator.predicate(
    "linear between knots",
    nclose(body(-1, 24).glutealProjection, (-0.013 + 0.023) / 2, 1e-9),
  );
  TestValidator.predicate(
    "projection grows and hip breadth narrows with the body mass index",
    woman30.glutealProjection > woman22.glutealProjection &&
      man30.glutealProjection > man22.glutealProjection &&
      woman30.hipScaleHoriz < woman22.hipScaleHoriz &&
      man30.hipScaleHoriz < man22.hipScaleHoriz,
  );
};
