import { assertHumanFaceHair, humanFaceHairLength } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { createNumericalHairFixture } from "../internal/createNumericalHairFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * A layer's front scale cuts or grows its roots by their frontal share.
 * Scenarios:
 * 1. With axes left 1, right 2, crown 3, nape 4, front 5, back 6 and no
 *    variation: a root straight in front takes 5 times the scale; one
 *    between crown and front, (3 + 5) / 2 times one plus half the scale's
 *    change; one straight back and one straight up keep their lengths; an
 *    omitted scale is one.
 * 2. Admission refuses a zero, negative or non-finite scale and admits a
 *    positive one.
 */
export const test_subject_human_hair_front_scale = (): void => {
  const base = {
    lengthAxes: [1, 2, 3, 4, 5, 6] as [
      number,
      number,
      number,
      number,
      number,
      number,
    ],
    lengthVariation: 0,
  };
  const origin = { x: 0, y: 0, z: 0 };
  const at = (
    frontScale: number | undefined,
    x: number,
    y: number,
    z: number,
  ) => humanFaceHairLength({ ...base, frontScale }, origin, { x, y, z }, 1);
  TestValidator.predicate(
    "lengths",
    nclose(at(0.4, 0, 0, 1), 2) &&
      nclose(at(0.4, 0, 1, 1), 4 * (1 - 0.6 / 2)) &&
      nclose(at(0.4, 0, 0, -1), 6) &&
      nclose(at(0.4, 0, 1, 0), 3) &&
      nclose(at(undefined, 0, 0, 1), 5) &&
      nclose(at(2, 0, 0, 1), 10),
  );
  const hair = createNumericalHairFixture();
  TestValidator.predicate(
    "admission",
    [0, -1, Number.NaN, Infinity].every((frontScale) =>
      throwsError(
        () =>
          assertHumanFaceHair({
            ...hair,
            layers: [{ ...hair.layers[0]!, frontScale }],
          }),
        "Hair roots, lengths",
      ),
    ) &&
      !throwsError(() =>
        assertHumanFaceHair({
          ...hair,
          layers: [{ ...hair.layers[0]!, frontScale: 1.5 }],
        }),
      ),
  );
};
