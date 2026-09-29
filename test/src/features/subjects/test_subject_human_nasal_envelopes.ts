import {
  humanFaceRegionValue,
  parseHumanFaceDocument,
  replaceHumanFaceRegion,
  serializeHumanFaceDocument,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceFixture } from "../internal/humanFaceFixture";
import { throwsError } from "../internal/predicates";

/**
 * Complete nasal envelopes belong to the portable source basis; the editor
 * may retain or clear them but cannot author a new free section population.
 *
 * Scenarios:
 * 1. Source sections survive serialize and resolve, own their caller values,
 *    and clear with an empty population or region reset.
 * 2. A string width is refused at document admission without changing the input.
 */
export const test_subject_human_nasal_envelopes = (): void => {
  const original = humanFaceFixture("nasal-envelope-document");
  const profile = {
    segments: 4,
    sections: [{ at: 0, width: 1, crest: 0.3, crestPosition: 0.5, roll: 90 }],
  };
  const envelopes = original.basis.bindings.nose.nostrils.map(() =>
    structuredClone(profile),
  );
  original.basis.recipe.nose.envelopes = structuredClone(envelopes);
  const saved = structuredClone(original);
  const selected = parseHumanFaceDocument(serializeHumanFaceDocument(original));
  TestValidator.equals(
    "portable envelope",
    parseHumanFaceDocument(serializeHumanFaceDocument(selected)),
    selected,
  );
  TestValidator.equals(
    "resolved envelopes",
    humanFaceRegionValue(selected, "nose").envelopes,
    envelopes,
  );
  envelopes[0].sections[0].width = 10;
  TestValidator.equals(
    "owned widths",
    humanFaceRegionValue(selected, "nose").envelopes![0].sections[0].width,
    1,
  );
  TestValidator.predicate(
    "changed free section refuses",
    throwsError(
      () =>
        replaceHumanFaceRegion({
          document: original,
          basisId: original.basis.id,
          region: "nose",
          value: { envelopes } as never,
        }),
      "detail.nose.envelopes",
    ),
  );
  const cleared = replaceHumanFaceRegion({
    document: selected,
    basisId: selected.basis.id,
    region: "nose",
    value: { envelopes: [] },
  });
  TestValidator.equals(
    "empty replaces inherited population",
    humanFaceRegionValue(cleared, "nose").envelopes,
    [],
  );
  const reset = replaceHumanFaceRegion({
    document: selected,
    basisId: selected.basis.id,
    region: "nose",
    value: undefined,
  });
  TestValidator.equals("reset detail", reset.detail?.nose, undefined);
  const invalid = JSON.parse(serializeHumanFaceDocument(selected));
  invalid.basis.recipe.nose.envelopes[0].sections[0].width = "one";
  TestValidator.predicate(
    "numeric envelope schema",
    throwsError(() => parseHumanFaceDocument(JSON.stringify(invalid))),
  );
  TestValidator.equals("original untouched", original, saved);
};
