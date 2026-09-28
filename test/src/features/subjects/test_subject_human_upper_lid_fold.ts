import {
  createPortraitEyeComponent,
  parseHumanFaceDocument,
  replaceHumanFaceRegion,
  resolveHumanFaceDocument,
  serializeHumanFaceDocument,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceFixture } from "../internal/humanFaceFixture";
import { throwsError } from "../internal/predicates";
import { upperLidFoldFixture } from "../internal/upperLidFoldFixture";

/**
 * Folded and closed tissue populations belong to source eye anatomy; a side
 * may retain that exact profile but cannot author new section coordinates.
 *
 * Scenarios:
 * 1. A left scalar edit inherits the source folded profile and round-trips
 *    both arrays while the right and source remain unchanged.
 * 2. A missing closed hood refuses at schema admission. A changed array
 *    refuses in detail; a mismatched source refuses at geometric admission.
 */
export const test_subject_human_upper_lid_fold = (): void => {
  const source = humanFaceFixture(),
    profile = upperLidFoldFixture();
  source.basis.recipe.eye.upperLidProfile = structuredClone(profile);
  const before = resolveHumanFaceDocument(source),
    edited = replaceHumanFaceRegion({
      document: source,
      basisId: source.basis.id,
      region: "eye",
      side: "left",
      value: { foldDepth: 0.25 },
    }),
    loaded = parseHumanFaceDocument(serializeHumanFaceDocument(edited)),
    resolved = resolveHumanFaceDocument(loaded);
  TestValidator.equals(
    "folded and closed arrays retained",
    resolved.left.eye.upperLidProfile,
    profile,
  );
  TestValidator.equals(
    "opposite eye retained",
    resolved.right.eye,
    before.right.eye,
  );
  TestValidator.equals("source untouched", source.detail, undefined);
  const reset = replaceHumanFaceRegion({
    document: loaded,
    basisId: source.basis.id,
    region: "eye",
    side: "left",
    value: undefined,
  });
  TestValidator.equals(
    "reset restores inheritance",
    resolveHumanFaceDocument(reset).left.eye,
    before.left.eye,
  );
  const missing = JSON.parse(serializeHumanFaceDocument(loaded));
  delete missing.basis.recipe.eye.upperLidProfile.closedSections[0].section
    .hood;
  TestValidator.predicate(
    "missing closed tissue refuses",
    throwsError(() => parseHumanFaceDocument(JSON.stringify(missing))),
  );
  const mismatch = upperLidFoldFixture();
  mismatch.closedSections![0].section.attachment = 6;
  TestValidator.predicate(
    "changed closed section refuses as an edit",
    throwsError(
      () =>
        replaceHumanFaceRegion({
          document: source,
          basisId: source.basis.id,
          region: "eye",
          side: "left",
          value: { upperLidProfile: mismatch } as never,
        }),
      "source geometry array",
    ),
  );
  const mismatched = humanFaceFixture();
  mismatched.basis.recipe.eye.upperLidProfile = mismatch;
  TestValidator.predicate(
    "mismatched closed attachment refuses at construction",
    throwsError(
      () =>
        createPortraitEyeComponent(
          source.basis.bindings.eyes.left,
          resolveHumanFaceDocument(mismatched).left.eye,
        ),
      "attachment",
    ),
  );
};
