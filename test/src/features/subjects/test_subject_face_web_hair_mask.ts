import { TestValidator } from "@nestia/e2e";

import {
  portraitWebHairMaskPart,
  portraitWebHairMaskPixels,
} from "../../../scripts/face-review/web/logic.mjs";
import { throwsError } from "../internal/predicates";

/**
 * The GPU silhouette pass identifies hair by geometry ownership and fibre alpha.
 * Scenarios:
 * 1. A dark numerical hair part is selected while skin, brows and a lookalike
 *    label are not; the choice does not depend on a material colour.
 * 2. Black, coloured and transparent RGBA texels become white with their exact
 *    original alpha while the caller's bytes remain untouched.
 * 3. Empty pixels give an empty mask; an incomplete final pixel refuses.
 */
export const test_subject_face_web_hair_mask = (): void => {
  TestValidator.predicate(
    "numerical hair belongs to the mask",
    portraitWebHairMaskPart("numerical-hair:scalp"),
  );
  for (const id of ["Human", "Human.eyebrow001", "hair", "numerical-hair"])
    TestValidator.predicate(
      "other parts do not become hair",
      !portraitWebHairMaskPart(id),
    );
  const source = new Uint8ClampedArray([
    0, 0, 0, 255, 20, 40, 60, 127, 230, 120, 90, 0,
  ]);
  const mask = portraitWebHairMaskPixels(source);
  TestValidator.equals(
    "white fibres retain alpha",
    Array.from(mask),
    [255, 255, 255, 255, 255, 255, 255, 127, 255, 255, 255, 0],
  );
  TestValidator.equals(
    "source pixels are unchanged",
    Array.from(source),
    [0, 0, 0, 255, 20, 40, 60, 127, 230, 120, 90, 0],
  );
  TestValidator.equals(
    "empty texture",
    Array.from(portraitWebHairMaskPixels(new Uint8ClampedArray())),
    [],
  );
  TestValidator.predicate(
    "partial pixel refuses",
    throwsError(
      () => portraitWebHairMaskPixels(new Uint8ClampedArray([1, 2, 3])),
      "complete RGBA",
    ),
  );
};
