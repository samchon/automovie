import { setHumanFaceDetail } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceFixture } from "../internal/humanFaceFixture";

/**
 * Authored object sharing cannot turn one side edit into a basis or sibling edit.
 * Scenarios:
 * 1. Common and paired eyes share one scalar override; a left write changes
 *    only that side and never the source basis.
 * 2. Removing a left scalar retains it in every other owner and preserves the caller.
 * 3. Pruning an empty shared side override leaves the common and opposite side intact.
 */
export const test_subject_human_detail_alias = (): void => {
  const face = humanFaceFixture(),
    basisDepth = face.basis.recipe.eye.foldDepth,
    profile = { foldDepth: basisDepth };
  face.detail = { eye: profile };
  face.asymmetry = {
    left: { eye: profile },
    right: { eye: profile },
  };
  const before = structuredClone(face);
  for (const value of [2, undefined]) {
    const next = setHumanFaceDetail(face, "eye.foldDepth", value, "left");
    TestValidator.equals(
      "basis scalar retained",
      next.basis.recipe.eye.foldDepth,
      basisDepth,
    );
    TestValidator.equals(
      "common scalar retained",
      next.detail!.eye!.foldDepth,
      profile.foldDepth,
    );
    TestValidator.equals(
      "opposite scalar retained",
      next.asymmetry!.right!.eye!.foldDepth,
      profile.foldDepth,
    );
    const expected = structuredClone(before);
    const expectedEye: Partial<typeof profile> = structuredClone(profile);
    if (value === undefined) delete expectedEye.foldDepth;
    else expectedEye.foldDepth = value;
    expected.asymmetry!.left!.eye = expectedEye;
    TestValidator.equals("only left owner changed", next, expected);
    TestValidator.equals("caller retained", face, before);
  }
  const shared = { foldDepth: 0 };
  face.detail = { eye: shared };
  face.asymmetry = { left: { eye: shared }, right: { eye: shared } };
  const next = setHumanFaceDetail(face, "eye.foldDepth", undefined, "left");
  TestValidator.equals(
    "selected empty owner pruned",
    next.asymmetry!.left,
    undefined,
  );
  TestValidator.equals("shared common retained", next.detail, {
    eye: { foldDepth: 0 },
  });
  TestValidator.equals("shared opposite retained", next.asymmetry!.right, {
    eye: { foldDepth: 0 },
  });
};
