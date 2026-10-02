import {
  HUMAN_BODY_SIMPLE_SHAPE,
  humanBodySimpleShapeMath,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

const CHANNELS = [
  "measureUpperarmLength",
  "measureLowerarmLength",
  "handScaleLeft",
  "handScaleRight",
];

/**
 * The arm-length rows close the arm span the survey measures: one weight per
 * sex shared by the upper arm, the forearm and both hands, rising over the
 * adolescent years and fading in old age.
 *
 * The expectations are hand arithmetic. At full weight the three channels add
 * 0.138, 0.077 and 0.088 m of span, 0.303 m together. The span gaps to the
 * survey's means are 0.144 m for women and 0.041 m for men, so the weights are
 * 0.144 / 0.303 = 0.476 and 0.041 / 0.303 = 0.135, and the weight at the
 * neutral's sex of zero is their mean.
 *
 * Scenarios:
 * 1. One row exists per arm channel, and no other channel carries one.
 * 2. An adult woman and an adult man read the closed-form weights on every
 *    row, and the neutral's sex reads the mean of the two.
 * 3. The age curve is zero at 11, half at 14, whole at 17 and 60, and zero
 *    again at 80, so a child and the very old keep the source arm.
 */
export const test_human_body_simple_arm_length_survey = (): void => {
  const rows = HUMAN_BODY_SIMPLE_SHAPE.terms.filter((row) =>
    CHANNELS.includes(row.channel),
  );
  TestValidator.equals(
    "one row per arm channel",
    rows.map((row) => row.channel).sort((a, b) => a.localeCompare(b)),
    [...CHANNELS].sort((a, b) => a.localeCompare(b)),
  );
  const weights = (sex: number, ageYears: number): number[] => {
    const parameters = humanBodySimpleShapeMath.parameters({
      sex,
      ageYears,
      statureMetres: 1.7,
      massKilograms: 65,
      muscle: 0,
    });
    return rows.map((row) => humanBodySimpleShapeMath.term(row, parameters));
  };
  const close = (values: number[], expected: number): boolean =>
    values.every((value) => nclose(value, expected, 0.006));
  const reach = 0.138 + 0.077 + 0.088;
  const women = 0.144 / reach;
  const men = 0.041 / reach;
  TestValidator.predicate("an adult woman closes the women's span gap", close(weights(-1, 30), women));
  TestValidator.predicate("an adult man closes the men's span gap", close(weights(1, 30), men));
  TestValidator.predicate(
    "the neutral's sex reads the mean of the two",
    close(weights(0, 30), (women + men) / 2),
  );
  TestValidator.predicate("a child keeps the source arm", close(weights(-1, 11), 0));
  TestValidator.predicate("adolescence is half way at 14", close(weights(-1, 14), women / 2));
  TestValidator.predicate(
    "the full value holds from 17 to 60",
    close(weights(-1, 17), women) && close(weights(-1, 60), women),
  );
  TestValidator.predicate("the very old keep the source arm", close(weights(1, 80), 0));
};
