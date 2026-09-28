import {
  type IPortraitUpperLidProfile,
  parseHumanFaceDocument,
  replaceHumanFaceRegion,
  resolveHumanFaceDocument,
  serializeHumanFaceDocument,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceFixture } from "../internal/humanFaceFixture";
import { throwsError } from "../internal/predicates";

/**
 * Upper lid sections belong to the source recipe. The editor may retain them
 * while side-specific scalar values remain independently editable.
 *
 * Scenarios:
 * 1. A source three-station profile round-trips its roles and depths.
 * 2. A new left two-station array refuses, while a left scalar adjustment
 *    retains the right profile and unrelated nose trait.
 * 3. Missing a required crease point refuses at JSON admission.
 */
export const test_subject_human_upper_lid_document = (): void => {
  const source = humanFaceFixture();
  source.controls = { noseWidth: 0.1 };
  const profile: IPortraitUpperLidProfile = {
    sections: [0, 0.5, 1].map((at) => ({
      at,
      section: {
        margin: { offset: 0.2, projection: 0.1 },
        tarsal: { offset: 1.5, projection: 0.3 },
        creaseInner: { offset: 3, projection: -0.2 },
        creaseOuter: { offset: 3.5, projection: -0.1 },
        hood: { offset: 4.5, projection: 0.2 },
        preseptal: { offset: 6, projection: 0 },
        attachment: 8,
      },
    })),
  };
  source.basis.recipe.eye.upperLidProfile = structuredClone(profile);
  const common = parseHumanFaceDocument(serializeHumanFaceDocument(source));
  const loaded = parseHumanFaceDocument(serializeHumanFaceDocument(common));
  TestValidator.equals(
    "complete profile survives JSON",
    resolveHumanFaceDocument(loaded).recipe.eye.upperLidProfile,
    profile,
  );
  const left = { sections: [profile.sections[0], profile.sections[2]] };
  TestValidator.predicate(
    "new left tissue stations refuse",
    throwsError(
      () =>
        replaceHumanFaceRegion({
          document: loaded,
          basisId: source.basis.id,
          region: "eye",
          side: "left",
          value: { upperLidProfile: left } as never,
        }),
      "source geometry array",
    ),
  );
  const paired = replaceHumanFaceRegion({
    document: loaded,
    basisId: source.basis.id,
    region: "eye",
    side: "left",
    value: { widthScale: 1.08 },
  });
  const resolved = resolveHumanFaceDocument(paired);
  TestValidator.equals(
    "left inherits source tissue population",
    resolved.left.eye.upperLidProfile,
    profile,
  );
  TestValidator.equals(
    "left scalar remains independent",
    resolved.left.eye.widthScale,
    1.08,
  );
  TestValidator.equals(
    "right inherits untouched common",
    resolved.right.eye.upperLidProfile,
    profile,
  );
  TestValidator.equals(
    "other trait retained",
    paired.controls,
    source.controls,
  );
  TestValidator.equals("source remains untouched", source.detail, undefined);
  const reset = replaceHumanFaceRegion({
    document: paired,
    basisId: source.basis.id,
    region: "eye",
    side: "left",
    value: undefined,
  });
  TestValidator.equals(
    "side clear restores inheritance",
    resolveHumanFaceDocument(reset).left.eye.upperLidProfile,
    profile,
  );
  const malformed = JSON.parse(serializeHumanFaceDocument(common));
  delete malformed.basis.recipe.eye.upperLidProfile.sections[0].section
    .creaseOuter;
  TestValidator.predicate(
    "missing required upper point refuses",
    throwsError(() => parseHumanFaceDocument(JSON.stringify(malformed))),
  );
};
