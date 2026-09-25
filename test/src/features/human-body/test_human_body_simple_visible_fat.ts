import {
  HUMAN_BODY_SIMPLE_SHAPE,
  humanBodySimpleShapeMath,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

/**
 * The fat the definition gates read knows the body's muscle: Deurenberg's
 * regression estimates fat from the mass index, age and sex alone, so a
 * trained body at the same mass index reads the fat of an untrained one.
 * The visible fat is the regression's excess over essential fat less the
 * fat-free mass one unit of muscle adds per sex, `100 · Δ · muscle / BMI`
 * points, never below one point.
 *
 * Scenarios:
 * 1. At muscle 0 the visible fat is the regression's excess, for both sexes.
 * 2. A man at muscle 1 reads 100 · 2.2 / BMI points less, a woman 100 · 1.8
 *    / BMI less; muscle -1 reads that much more.
 * 3. A lean muscular man is floored at one point over essential fat.
 * 4. A trained man's definition gates open where an untrained man's of the
 *    same mass index stay shut: the swimmer (1.90 m, 86 kg, muscle 1.1)
 *    reads under 4 points over essential fat, the same body at muscle 0
 *    over 12.
 * 5. The simple tier's muscle reaches 2, the source's competition node.
 * 6. Maturity runs from 12.5 to 16.5 years for a boy and from 10.8 to 14.8
 *    for a girl, linear between (half way for a girl at 12.8, and from
 *    11.65 to 15.65 at sex 0); the developed muscle is the muscle times it,
 *    so an 11-year-old boy has built none and an adult all of it.
 * 7. A child who has not built muscle keeps the regression's fat, whatever
 *    the muscle parameter, and a row calibrated on adult training (the
 *    gluteal mass) reads nothing on him and its full gain on an adult.
 */
export const test_human_body_simple_visible_fat = (): void => {
  const math = humanBodySimpleShapeMath;
  for (const sex of [-1, 1])
    TestValidator.predicate(
      `muscle 0 reads the regression (sex ${sex})`,
      nclose(
        math.visibleFat({ sex, ageYears: 30, muscle: 0 }, 24),
        Math.max(1, math.fat({ sex, ageYears: 30 }, 24).excess),
      ),
    );
  const at = (sex: number, muscle: number): number =>
    math.visibleFat({ sex, ageYears: 30, muscle }, 25);
  TestValidator.predicate(
    "a unit of muscle takes 100 * 2.2 / BMI points off a man",
    nclose(at(1, 0) - at(1, 1), (100 * 2.2) / 25),
  );
  TestValidator.predicate(
    "and 100 * 1.8 / BMI off a woman",
    nclose(at(-1, 0) - at(-1, 1), (100 * 1.8) / 25),
  );
  TestValidator.predicate(
    "negative muscle adds as much",
    nclose(at(1, -1) - at(1, 0), (100 * 2.2) / 25),
  );
  TestValidator.predicate(
    "a lean muscular man is floored at one point",
    math.visibleFat({ sex: 1, ageYears: 25, muscle: 2 }, 21) === 1,
  );
  const swimmer = 86 / (1.9 * 1.9);
  TestValidator.predicate(
    "a trained swimmer's gates open where an untrained body's stay shut",
    math.visibleFat({ sex: 1, ageYears: 23, muscle: 1.1 }, swimmer) < 4 &&
      math.visibleFat({ sex: 1, ageYears: 23, muscle: 0 }, swimmer) > 12,
  );
  TestValidator.predicate(
    "the simple tier's muscle reaches the competition node",
    HUMAN_BODY_SIMPLE_SHAPE.limits.muscle[1] === 2,
  );

  TestValidator.predicate(
    "maturity ramps over each sex's adolescence",
    math.maturity({ sex: 1, ageYears: 12.5 }) === 0 &&
      math.maturity({ sex: 1, ageYears: 16.5 }) === 1 &&
      nclose(math.maturity({ sex: -1, ageYears: 12.8 }), 0.5) &&
      nclose(math.maturity({ sex: 0, ageYears: 13.65 }), 0.5) &&
      math.maturity({ sex: -1, ageYears: 30 }) === 1,
  );
  const boy = { sex: 1, ageYears: 11, muscle: 1.5 };
  const man = { sex: 1, ageYears: 25, muscle: 1.5 };
  TestValidator.predicate(
    "the developed muscle is the muscle times maturity",
    math.developedMuscle(boy) === 0 && math.developedMuscle(man) === 1.5,
  );
  TestValidator.predicate(
    "a child keeps the regression's fat",
    nclose(math.visibleFat(boy, 22), math.fat(boy, 22).excess),
  );
  const gluteal = HUMAN_BODY_SIMPLE_SHAPE.terms.find(
    (row) =>
      row.channel === "buttocksVolume" &&
      row.curves.some((curve) => curve.parameter === "developedMuscle"),
  )!;
  const reading = (simple: typeof boy): number =>
    math.term(
      gluteal,
      math.parameters({ ...simple, statureMetres: 1.5, massKilograms: 45 }),
    );
  TestValidator.predicate(
    "an adult-trained row reads nothing on a child and its gain on an adult",
    reading(boy) === 0 && nclose(reading({ ...man, muscle: 1 }), 0.5),
  );
};
