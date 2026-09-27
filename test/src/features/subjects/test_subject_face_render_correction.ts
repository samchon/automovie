import { TestValidator } from "@nestia/e2e";

import { faceRenderCorrection } from "../../../scripts/face-review/faceRenderCorrection";

/**
 * One render correction per index, shared by the subjects.
 * Scenarios:
 * 1. An index three subjects read takes the middle of their gaps (model
 *    less render), not the mean an outlier would pull.
 * 2. An index two subjects read takes the mean of the middle two.
 * 3. A subject missing either reading on an index does not count toward it.
 * 4. An index no subject reads on both takes zero, and an empty population
 *    corrects nothing.
 */
export const test_subject_face_render_correction = (): void => {
  const correction = faceRenderCorrection(
    ["odd", "even", "none"],
    [
      {
        model: { odd: 1, even: 2, none: 5 },
        rendered: { odd: 0.9, even: 1.5, none: null },
      },
      {
        model: { odd: 1, even: null, none: null },
        rendered: { odd: 1.2, even: 1, none: 4 },
      },
      {
        model: { odd: 3, even: 2 },
        rendered: { odd: 0, even: 1.9 },
      },
      {
        model: { odd: 1 },
        rendered: { odd: null, even: 0.8 },
      },
    ],
  );
  TestValidator.equals(
    "median per index, missing readings skipped, zero when none",
    Object.fromEntries(
      Object.entries(correction).map(([id, v]) => [id, Number(v.toFixed(12))]),
    ),
    { odd: 0.1, even: 0.3, none: 0 },
  );
  TestValidator.equals("no subjects", faceRenderCorrection(["odd"], []), {
    odd: 0,
  });
};
