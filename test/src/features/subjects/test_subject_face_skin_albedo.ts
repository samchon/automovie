import { TestValidator } from "@nestia/e2e";

import { faceSkinAlbedo } from "../../../scripts/face-review/faceSkinAlbedo";
import { nclose, throwsError } from "../internal/predicates";

const group = (subjects: number, mean: [number, number, number]) => ({
  subjects,
  mean,
  sd: [0, 0, 0] as [number, number, number],
});
const NORMS = {
  groups: {
    CA: {
      all: group(3, [0.4, 0.3, 0.2]),
      F: group(2, [0.45, 0.3, 0.2]),
      M: group(1, [0.3, 0.3, 0.2]),
    },
    CN: { all: group(1, [0.5, 0.3, 0.2]), F: group(1, [0.5, 0.3, 0.2]) },
    JP: { all: group(3, [0.3, 0.2, 0.1]), F: group(3, [0.3, 0.2, 0.1]) },
    AF: { all: group(2, [0.2, 0.1, 0.05]) },
  },
};

/**
 * Skin albedo from recorded facts.
 * Scenarios:
 * 1. A European woman takes the Caucasian women's mean, a man the men's, a
 *    subject without a recorded sex the whole group's.
 * 2. An East Asian woman takes the subject-weighted mean of the Chinese and
 *    Japanese women: (1 x 0.5 + 3 x 0.3) / 4 = 0.35 in red, over 4 subjects.
 * 3. A sex the group does not split falls back to the whole group; an
 *    unrecorded ancestry gives none; norms lacking a group refuse.
 */
export const test_subject_face_skin_albedo = (): void => {
  const red = (facts: Parameters<typeof faceSkinAlbedo>[0]) =>
    faceSkinAlbedo(facts, NORMS)!.albedo[0];
  TestValidator.predicate(
    "by sex",
    nclose(red({ ancestry: "european", sex: "female" }), 0.45, 1e-12) &&
      nclose(red({ ancestry: "european", sex: "male" }), 0.3, 1e-12) &&
      nclose(red({ ancestry: "european", sex: null }), 0.4, 1e-12),
  );
  const asian = faceSkinAlbedo({ ancestry: "asian", sex: "female" }, NORMS)!;
  TestValidator.predicate(
    "pooled",
    nclose(asian.albedo[0], 0.35, 1e-12) &&
      nclose(asian.albedo[2], 0.125, 1e-12) &&
      asian.subjects === 4,
  );
  TestValidator.predicate(
    "fallbacks",
    nclose(red({ ancestry: "african", sex: "male" }), 0.2, 1e-12) &&
      faceSkinAlbedo({ ancestry: null, sex: "male" }, NORMS) === null &&
      throwsError(
        () =>
          faceSkinAlbedo({ ancestry: "african", sex: null }, { groups: {} }),
        "lack the group AF",
      ),
  );
};
