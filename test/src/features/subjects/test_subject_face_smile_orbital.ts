import { TestValidator } from "@nestia/e2e";

import {
  FACE_SMILE_FISSURE_PER_LABIAL,
  faceSmileOrbital,
} from "../../../scripts/face-review/faceSmileOrbital";
import { nclose, throwsError } from "../internal/predicates";

/**
 * A smile's orbital part set by the posed-smile norm.
 * Scenarios:
 * 1. The norm is the posed smile's 1.885 mm of fissure per 10.39 mm of
 *    mouth. A side smiling at 0.6 whose smile adds 7.58 mm of mouth per
 *    unit and narrows its fissure 0.23 mm per unit, with a raiser
 *    narrowing it 1.07 mm per unit, takes the raiser that closes the rest
 *    of the norm's narrowing; the other side, smiling at 0.3, half of it
 *    less its own smaller share.
 * 2. A broad smile's raiser stops at the maximum; a side not smiling, a
 *    raiser that does not narrow, and a smile that narrows the fissure more
 *    than the norm by itself take none.
 * 3. A negative maximum refuses.
 */
export const test_subject_face_smile_orbital = (): void => {
  const rates = {
    labial: { left: 0.00758, right: 0.00758 },
    fissure: { left: -0.00023, right: -0.00023 },
    raiser: { left: -0.00107, right: -0.00107 },
  };
  const expected = (smile: number) =>
    (FACE_SMILE_FISSURE_PER_LABIAL * 0.00758 * smile - 0.00023 * smile) /
    0.00107;
  const orbital = faceSmileOrbital({
    smile: { left: 0.6, right: 0.3 },
    ...rates,
    maximum: 1,
  });
  TestValidator.predicate(
    "norm",
    nclose(FACE_SMILE_FISSURE_PER_LABIAL, 0.181424, 1e-6) &&
      nclose(orbital.left, expected(0.6), 1e-12) &&
      nclose(orbital.right, expected(0.3), 1e-12) &&
      orbital.left > 0.6 &&
      orbital.left < 0.7,
  );
  const broad = faceSmileOrbital({
    smile: { left: 1, right: 0 },
    ...rates,
    labial: { left: 0.02, right: 0.02 },
    maximum: 1,
  });
  const idle = faceSmileOrbital({
    smile: { left: 0.8, right: -0.2 },
    ...rates,
    raiser: { left: 0, right: -0.00107 },
    maximum: 1,
  });
  const enough = faceSmileOrbital({
    smile: { left: 0.8, right: 0.8 },
    ...rates,
    fissure: { left: -0.003, right: -0.003 },
    maximum: 1,
  });
  TestValidator.predicate(
    "bounds",
    broad.left === 1 &&
      broad.right === 0 &&
      idle.left === 0 &&
      idle.right === 0 &&
      enough.left === 0 &&
      enough.right === 0,
  );
  TestValidator.predicate(
    "refusal",
    throwsError(
      () =>
        faceSmileOrbital({
          smile: { left: 1, right: 1 },
          ...rates,
          maximum: -1,
        }),
      "zero or more",
    ),
  );
};
