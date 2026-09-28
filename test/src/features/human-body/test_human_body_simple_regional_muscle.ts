import {
  HUMAN_BODY_SIMPLE_SHAPE,
  humanBodySimpleShapeMath,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

const UPPER = [
  "upperarmMuscleLeft",
  "upperarmMuscleRight",
  "upperarmShoulderMuscleLeft",
  "upperarmShoulderMuscleRight",
  "lowerarmMuscleLeft",
  "lowerarmMuscleRight",
  "torsoMusclePectoral",
  "torsoMuscleDorsi",
];
const LOWER = [
  "upperlegMuscleLeft",
  "upperlegMuscleRight",
  "lowerlegMuscleLeft",
  "lowerlegMuscleRight",
];

/**
 * The regional muscle a trained body adds is in proportion to the muscle
 * already there: training grows both sexes' muscle by a similar share, and a
 * woman carries 40 percent less muscle than a man in the upper body and 33
 * percent less in the lower (Janssen et al. 2000). The table's regional rows
 * are otherwise the same for both sexes.
 *
 * Scenarios:
 * 1. A trained man's regional channels read the row's full gain, 0.7 at
 *    muscle 1.
 * 2. A trained woman's arm, shoulder, pectoral and latissimus channels read
 *    0.6 of it and her leg channels 0.67; a body at sex 0 reads the
 *    midpoint.
 * 3. The detrained end (muscle -1) takes the same share from a woman.
 */
export const test_human_body_simple_regional_muscle = (): void => {
  const math = humanBodySimpleShapeMath;
  const reading = (channel: string, sex: number, muscle: number): number => {
    const parameters = math.parameters({
      sex,
      ageYears: 25,
      statureMetres: 1.7,
      massKilograms: 65,
      muscle,
    });
    return HUMAN_BODY_SIMPLE_SHAPE.terms
      .filter(
        (row) =>
          row.channel === channel &&
          row.curves.some((curve) => curve.parameter === "developedMuscle"),
      )
      .reduce((sum, row) => sum + math.term(row, parameters), 0);
  };
  TestValidator.predicate(
    "a trained man reads the full regional gain",
    [...UPPER, ...LOWER].every((channel) =>
      nclose(reading(channel, 1, 1), 0.7),
    ),
  );
  TestValidator.predicate(
    "a trained woman reads her share of it, upper and lower body apart",
    UPPER.every(
      (channel) =>
        nclose(reading(channel, -1, 1), 0.7 * 0.6) &&
        nclose(reading(channel, 0, 1), 0.7 * 0.8),
    ) &&
      LOWER.every(
        (channel) =>
          nclose(reading(channel, -1, 1), 0.7 * 0.67) &&
          nclose(reading(channel, 0, 1), 0.7 * 0.835),
      ),
  );
  TestValidator.predicate(
    "the detrained end takes the same share",
    UPPER.every((channel) => nclose(reading(channel, -1, -1), -0.7 * 0.6)) &&
      LOWER.every((channel) => nclose(reading(channel, -1, -1), -0.7 * 0.67)),
  );
};
