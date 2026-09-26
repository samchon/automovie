import {
  HUMAN_BODY_SIMPLE_SHAPE,
  type IAutoMovieHumanBodyBasis,
  expandHumanBodySimpleShape,
  humanBodySimpleShapeMath,
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
  "hipScaleVert",
  "measureWristCirc",
  "measureAnkleCirc",
  "upperlegFatLeft",
  "upperlegFatRight",
  "torsoScaleHoriz",
  "torsoScaleDepth",
  "stomachPregnant",
  "measureUpperlegHeight",
  "measureLowerlegHeight",
];

/**
 * The ANSUR II people rows set a woman's gluteal projection, hip breadth,
 * depth and height, thigh and calf fat, trunk breadth and depth and breast
 * position, a man's leg length, trunk breadth and depth, belly and gluteal
 * projection, and both sexes' wrist and ankle girths, over the body mass
 * index and, for the rows refitted under the rearmost hip rule and the
 * kept-neck mass model, over the survey's ages.
 *
 * The analytic box of the simple fixture gains the sixteen channels on an
 * endpoint that moves nothing, so the solved stature, girths and mass are the
 * fixture's and each weight is the row's own value. At 25 years:
 * 1. A woman at BMI 22 gets gluteal projection 0.473, hip breadth 0.339, hip
 *    depth 0.145 and calf fat 0.268 on both sides; at BMI 30, 0.751,
 *    -0.084, 0.489 and 0.86.
 * 2. A man gets none of the woman's hip or calf rows, and his own gluteal
 *    projection, 0.042 at BMI 22 and 0.056 at 30.
 * 3. Between knots the weight is linear: a woman at BMI 24 gets the
 *    projection halfway between 0.473 and 0.616; below the survey's support
 *    the rows fade, to zero at BMI 15 and halfway at 16.5.
 * 4. A woman's projection grows with the body mass index and her hip
 *    breadth narrows.
 * 5. A woman's breast is lowered at BMI 22 (-0.257, the only row firing at
 *    25 years) and, at BMI 30, raised by 0.411 against the heavier breast's
 *    older row (-0.3 times 0.7), 0.201 in all; a man's is untouched.
 * 6. A woman's pelvis is shortened by 0.989 at BMI 22 and 1 at 30, which
 *    raises her crotch, and fades with the other rows (zero at 15); a man's
 *    is untouched.
 * 7. Wrists and ankles: a woman's wrist girth channel is 0.517 at BMI 22
 *    and 0.256 at 30 and her ankle's 0.423 and 0.68; a man's wrist 0.413
 *    and -0.098 and his ankle -0.104 and 0.184. They fade like the others:
 *    zero at BMI 15, half the BMI 18 knot (a man's wrist 0.645, ankle
 *    -0.249) at 16.5.
 * 8. The trunk and a man's legs: a woman's trunk breadth is 0.259 at BMI 22
 *    and 0.04 at 30 and its depth 0.651 and 0.898; a man's leg segments
 *    shorten by 0.22 and 0.604, his trunk breadth reads -0.131 and 0.066,
 *    its depth -0.37 and -0.15 and his belly 0.198 and 0.314.
 * 9. The survey's support: the refitted rows rise from nothing at 11 to
 *    their full value at 17 and fall to nothing from 60 to 80, so a man of
 *    14 at BMI 22 gets half his leg shortening and a woman of 70 half her
 *    projection, and one of 90 none; the new rows fade at a body mass index
 *    of 40 (a man's leg length is zero there) while a woman's refitted hip
 *    rows keep their fade to 45 (her projection at 40 is half its BMI 35
 *    value, 0.429).
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
  const body = (sex: number, bmi: number, ageYears = 25) =>
    expandHumanBodySimpleShape(basis, {
      sex,
      ageYears,
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
  expect("woman at BMI 22", woman22, [0.473, 0.339, 0.145, 0.268]);
  expect("woman at BMI 30", woman30, [0.751, -0.084, 0.489, 0.86]);
  expect("man at BMI 22", man22, [0.042, 0, 0, 0]);
  expect("man at BMI 30", man30, [0.056, 0, 0, 0]);
  TestValidator.predicate(
    "breast position by the body mass index",
    nclose(woman22.breastTransDownUp, -0.257, 1e-9) &&
      nclose(woman30.breastTransDownUp, 0.411 - 0.3 * 0.7, 1e-9) &&
      nclose(man22.breastTransDownUp ?? 0, 0, 1e-9),
  );
  TestValidator.predicate(
    "a woman's shorter pelvis",
    nclose(woman22.hipScaleVert, -0.989, 1e-9) &&
      nclose(woman30.hipScaleVert, -1, 1e-9) &&
      nclose(body(-1, 15).hipScaleVert, 0, 1e-9) &&
      nclose(man22.hipScaleVert ?? 0, 0, 1e-9),
  );
  TestValidator.predicate(
    "linear between knots",
    nclose(body(-1, 24).glutealProjection, (0.473 + 0.616) / 2, 1e-9),
  );
  TestValidator.predicate(
    "fading below the survey's support",
    nclose(body(-1, 15).glutealProjection, 0, 1e-9) &&
      nclose(body(-1, 16.5).glutealProjection, 0.322 / 2, 1e-9),
  );
  const distal = (
    title: string,
    shape: Record<string, number>,
    wrist: number,
    ankle: number,
  ): void =>
    TestValidator.predicate(
      title,
      nclose(shape.measureWristCirc ?? 0, wrist, 1e-9) &&
        nclose(shape.measureAnkleCirc ?? 0, ankle, 1e-9),
    );
  distal("a woman's wrist and ankle at BMI 22", woman22, 0.517, 0.423);
  distal("a woman's wrist and ankle at BMI 30", woman30, 0.256, 0.68);
  distal("a man's wrist and ankle at BMI 22", man22, 0.413, -0.104);
  distal("a man's wrist and ankle at BMI 30", man30, -0.098, 0.184);
  distal("wrist and ankle faded at BMI 15", body(1, 15), 0, 0);
  distal(
    "wrist and ankle half faded at BMI 16.5",
    body(1, 16.5),
    0.645 / 2,
    -0.249 / 2,
  );
  TestValidator.predicate(
    "a woman's projection grows and hip breadth narrows with the body mass index",
    woman30.glutealProjection > woman22.glutealProjection &&
      woman30.hipScaleHoriz < woman22.hipScaleHoriz,
  );
  const trunk = (
    title: string,
    shape: Record<string, number>,
    [breadth, depth, belly, legs]: number[],
  ): void =>
    TestValidator.predicate(
      title,
      nclose(shape.torsoScaleHoriz ?? 0, breadth, 1e-9) &&
        nclose(shape.torsoScaleDepth ?? 0, depth, 1e-9) &&
        nclose(shape.stomachPregnant ?? 0, belly, 1e-9) &&
        nclose(shape.measureUpperlegHeight ?? 0, legs, 1e-9) &&
        nclose(shape.measureLowerlegHeight ?? 0, legs, 1e-9),
    );
  trunk("a woman's trunk at BMI 22", woman22, [0.259, 0.651, 0, 0]);
  trunk("a woman's trunk at BMI 30", woman30, [0.04, 0.898, 0, 0]);
  trunk(
    "a man's trunk and legs at BMI 22",
    man22,
    [-0.131, -0.37, 0.198, -0.22],
  );
  trunk(
    "a man's trunk and legs at BMI 30",
    man30,
    [0.066, -0.15, 0.314, -0.604],
  );
  TestValidator.predicate(
    "the refitted rows follow the survey's ages",
    nclose(body(1, 22, 14).measureUpperlegHeight, -0.22 / 2, 1e-9) &&
      nclose(body(-1, 22, 70).glutealProjection, 0.473 / 2, 1e-9) &&
      nclose(body(-1, 22, 90).glutealProjection ?? 0, 0, 1e-9) &&
      nclose(body(1, 22, 11).measureUpperlegHeight ?? 0, 0, 1e-9),
  );
  // past the fixture's reach, the rows themselves: the new ones fade to
  // nothing at 40, a woman's refitted hip rows to nothing at 45
  const at40 = (sex: number, channel: string): number =>
    HUMAN_BODY_SIMPLE_SHAPE.terms
      .filter(
        (row) =>
          row.channel === channel &&
          row.curves[0].parameter === "sex" &&
          row.curves[0].points[0][0] === (sex < 0 ? -1 : 0),
      )
      .reduce(
        (sum, row) =>
          sum +
          humanBodySimpleShapeMath.term(
            row,
            humanBodySimpleShapeMath.parameters({
              sex,
              ageYears: 25,
              statureMetres: 1.75,
              massKilograms: 40 * 1.75 * 1.75,
              muscle: 0,
            }),
          ),
        0,
      );
  TestValidator.predicate(
    "the new rows fade at 40, the refitted hip rows at 45",
    nclose(at40(1, "measureUpperlegHeight"), 0, 1e-9) &&
      nclose(at40(-1, "torsoScaleDepth"), 0, 1e-9) &&
      nclose(at40(-1, "glutealProjection"), 0.858 / 2, 1e-9),
  );
};
