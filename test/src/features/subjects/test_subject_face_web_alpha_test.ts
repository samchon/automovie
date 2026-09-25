import { TestValidator } from "@nestia/e2e";

import { portraitWebAlphaTest } from "../../../scripts/face-review/web/logic.mjs";

/**
 * The capture page cuts textures exactly as the product viewer does.
 * Scenarios:
 * 1. A mask material cuts at its own cutoff (the basis brow's 0.15, the
 *    lashes' 0.2, a hair card's 0.45) and at 0.5 when none is authored.
 * 2. An opaque or blended material, and an unset mode with full opacity,
 *    do not cut; an unset mode with partial opacity is blended and does not
 *    cut either.
 * 3. A record exported before alpha fields existed keeps the historical
 *    0.45 cut.
 */
export const test_subject_face_web_alpha_test = (): void => {
  TestValidator.equals(
    "authored cutoffs",
    [0.15, 0.2, 0.45].map((cutoff) =>
      portraitWebAlphaTest({ alphaMode: "mask", alphaCutoff: cutoff }),
    ),
    [0.15, 0.2, 0.45],
  );
  TestValidator.equals(
    "mask default",
    portraitWebAlphaTest({ alphaMode: "mask", alphaCutoff: null }),
    0.5,
  );
  TestValidator.equals(
    "no cut",
    [
      portraitWebAlphaTest({ alphaMode: "opaque" }),
      portraitWebAlphaTest({ alphaMode: "blend" }),
      portraitWebAlphaTest({ alphaMode: null, opacity: 1 }),
      portraitWebAlphaTest({ alphaMode: null, opacity: 0.5 }),
      portraitWebAlphaTest({ alphaMode: null }),
    ],
    [0, 0, 0, 0, 0],
  );
  TestValidator.equals("legacy record", portraitWebAlphaTest({}), 0.45);
};
