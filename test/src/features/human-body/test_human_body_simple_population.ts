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
 * The ANSUR II people rows set a woman's hip breadth, depth and height,
 * thigh and calf fat, trunk breadth and depth and breast position, a man's
 * leg length, trunk breadth and depth and pelvis height, and both sexes'
 * wrist and ankle girths, over the body mass index and, for the rows
 * refitted under the rearmost hip rule and the kept-neck mass model, over
 * the survey's ages. Neither sex has a gluteal projection or belly row: under
 * the fit's surface cost they came out at zero.
 *
 * The analytic box of the simple fixture gains the sixteen channels on an
 * endpoint that moves nothing, so the solved stature, girths and mass are the
 * fixture's and each weight is the row's own value. At 25 years:
 * 1. A woman at BMI 22 gets hip breadth -0.119, hip depth 0 and calf fat
 *    0.099 on both sides; at BMI 30, -0.544, 0.168 and 0.119. Neither sex
 *    gets a gluteal projection.
 * 2. A man gets none of the woman's hip or calf rows.
 * 3. Between knots the weight is linear: a woman at BMI 24 gets the hip
 *    breadth halfway between -0.119 and -0.342; below the survey's support
 *    the rows fade, to zero at BMI 15 and halfway at 16.5.
 * 4. A woman's hip breadth narrows with the body mass index and her hip
 *    depth grows.
 * 5. A woman's breast is lowered at BMI 22 (-0.257, the only row firing at
 *    25 years) and, at BMI 30, raised by 0.411 against the heavier breast's
 *    older row (-0.3 times 0.7), 0.201 in all; a man's is untouched.
 * 6. A woman's pelvis is shortened by 0.143 at BMI 22 and 0.1 at 30 and
 *    fades with the other rows (zero at 15); a man's is lengthened by 0.088
 *    and 0.111.
 * 7. Wrists and ankles: a woman's wrist girth channel is 0.517 at BMI 22
 *    and 0.256 at 30 and her ankle's 0.423 and 0.68; a man's wrist 0.413
 *    and -0.098 and his ankle -0.104 and 0.184. They fade like the others:
 *    zero at BMI 15, half the BMI 18 knot (a man's wrist 0.645, ankle
 *    -0.249) at 16.5.
 * 8. The trunk and a man's legs: a woman's trunk breadth is -0.181 at BMI
 *    22 and -0.544 at 30 and its depth 0.202 and 0.166; a man's leg
 *    segments shorten by 0.05 and 0.436, his trunk breadth reads -0.179 and
 *    0.309 and its depth -0.327 and 0.224.
 * 9. The survey's support: the refitted rows rise from nothing at 11 to
 *    their full value at 17 and fall to nothing from 60 to 80, so a man of
 *    14 at BMI 22 gets half his leg shortening and a woman of 70 half her
 *    hip breadth, and one of 90 none; the new rows fade at a body mass index
 *    of 40 (a man's leg length is zero there) while a woman's refitted hip
 *    rows keep their fade to 45 (her hip depth at 40 is half its BMI 35
 *    value, 0.268).
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
      nclose(shape.glutealProjection ?? 0, projection, 1e-9) &&
        nclose(shape.hipScaleHoriz ?? 0, breadth, 1e-9) &&
        nclose(shape.hipScaleDepth ?? 0, depth, 1e-9) &&
        nclose(shape.lowerlegFatLeft ?? 0, calf, 1e-9) &&
        nclose(shape.lowerlegFatRight ?? 0, calf, 1e-9),
    );
  };
  const woman22 = body(-1, 22);
  const woman30 = body(-1, 30);
  const man22 = body(1, 22);
  const man30 = body(1, 30);
  expect("woman at BMI 22", woman22, [0, -0.119, 0, 0.099]);
  expect("woman at BMI 30", woman30, [0, -0.544, 0.168, 0.119]);
  expect("man at BMI 22", man22, [0, 0, 0, 0]);
  expect("man at BMI 30", man30, [0, 0, 0, 0]);
  TestValidator.predicate(
    "breast position by the body mass index",
    nclose(woman22.breastTransDownUp, -0.257, 1e-9) &&
      nclose(woman30.breastTransDownUp, 0.411 - 0.3 * 0.7, 1e-9) &&
      nclose(man22.breastTransDownUp ?? 0, 0, 1e-9),
  );
  TestValidator.predicate(
    "a woman's shorter pelvis, a man's taller one",
    nclose(woman22.hipScaleVert, -0.143, 1e-9) &&
      nclose(woman30.hipScaleVert, -0.1, 1e-9) &&
      nclose(body(-1, 15).hipScaleVert, 0, 1e-9) &&
      nclose(man22.hipScaleVert, 0.088, 1e-9) &&
      nclose(man30.hipScaleVert, 0.111, 1e-9),
  );
  TestValidator.predicate(
    "linear between knots",
    nclose(body(-1, 24).hipScaleHoriz, (-0.119 - 0.342) / 2, 1e-9),
  );
  TestValidator.predicate(
    "fading below the survey's support",
    nclose(body(-1, 15).hipScaleHoriz, 0, 1e-9) &&
      nclose(body(-1, 16.5).hipScaleHoriz, 0.143 / 2, 1e-9),
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
    "a woman's hip depth grows and hip breadth narrows with the body mass index",
    woman30.hipScaleDepth > woman22.hipScaleDepth &&
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
  trunk("a woman's trunk at BMI 22", woman22, [-0.181, 0.202, 0, 0]);
  trunk("a woman's trunk at BMI 30", woman30, [-0.544, 0.166, 0, 0]);
  trunk("a man's trunk and legs at BMI 22", man22, [-0.179, -0.327, 0, -0.05]);
  trunk("a man's trunk and legs at BMI 30", man30, [0.309, 0.224, 0, -0.436]);
  TestValidator.predicate(
    "the refitted rows follow the survey's ages",
    nclose(body(1, 22, 14).measureUpperlegHeight, -0.05 / 2, 1e-9) &&
      nclose(body(-1, 22, 70).hipScaleHoriz, -0.119 / 2, 1e-9) &&
      nclose(body(-1, 22, 90).hipScaleHoriz ?? 0, 0, 1e-9) &&
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
      nclose(at40(-1, "hipScaleDepth"), 0.268 / 2, 1e-9),
  );
};
