import { humanFaceDetailValue, setHumanFaceDetail } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceFixture } from "../internal/humanFaceFixture";
import { throwsError } from "../internal/predicates";

/**
 * Scalar detail writes preserve override intent, side ownership and inheritance.
 * Envelope endpoints are exercised separately by the lower/upper limits cases;
 * this case follows document state without repeatedly cloning every channel.
 *
 * Scenarios:
 * 1. Omitted oral depth resolves to zero; an explicit basis value remains applied.
 * 2. A left-only edit leaves the common/right profile and unrelated traits unchanged.
 * 3. Removing the leaf restores inheritance; absent optional profiles remain absent.
 * 4. Unknown channels, fractional fibre populations and invalid side owners refuse.
 */
export const test_subject_human_detail = (): void => {
  const document = humanFaceFixture();
  TestValidator.equals(
    "omitted oral depth defaults to zero",
    humanFaceDetailValue(document, "mouth.seamProjection"),
    0,
  );
  const inheritedDepth = humanFaceFixture();
  inheritedDepth.basis.recipe.mouth.seamProjection = -2;
  TestValidator.equals(
    "basis oral depth remains explicit",
    humanFaceDetailValue(inheritedDepth, "mouth.seamProjection"),
    -2,
  );
  document.controls = { noseWidth: 0.2 };
  const common = setHumanFaceDetail(document, "eye.foldDepth", 0.3);
  const left = setHumanFaceDetail(common, "eye.foldDepth", 0.7, "left");
  TestValidator.equals(
    "independent left",
    humanFaceDetailValue(left, "eye.foldDepth", "left"),
    0.7,
  );
  TestValidator.equals(
    "inherited right",
    humanFaceDetailValue(left, "eye.foldDepth", "right"),
    0.3,
  );
  TestValidator.equals("traits retained", left.controls, document.controls);
  const reset = setHumanFaceDetail(left, "eye.foldDepth", undefined, "left");
  TestValidator.equals(
    "side restores inheritance",
    humanFaceDetailValue(reset, "eye.foldDepth", "left"),
    0.3,
  );
  const inherited = setHumanFaceDetail(reset, "eye.foldDepth", undefined);
  TestValidator.equals(
    "basis restored",
    humanFaceDetailValue(inherited, "eye.foldDepth"),
    document.basis.recipe.eye.foldDepth,
  );
  TestValidator.equals(
    "absent profile",
    humanFaceDetailValue(document, "cheek.malar.projection"),
    undefined,
  );
  const bare = humanFaceFixture();
  delete bare.basis.recipe.mouth.section;
  TestValidator.equals(
    "absent nested group",
    humanFaceDetailValue(bare, "mouth.section.upperBody"),
    undefined,
  );
  TestValidator.equals("caller untouched", document.detail, undefined);
  TestValidator.predicate(
    "unknown write",
    throwsError(() => setHumanFaceDetail(document, "eye.unknown", 1)),
  );
  TestValidator.predicate(
    "unknown read",
    throwsError(() => humanFaceDetailValue(document, "eye.unknown")),
  );
  TestValidator.predicate(
    "fractional fibres",
    throwsError(() => setHumanFaceDetail(document, "eye.browFibres", 1.5)),
  );
  TestValidator.predicate(
    "unpaired owner",
    throwsError(() =>
      setHumanFaceDetail(document, "nose.widthScale", 1, "left"),
    ),
  );
  TestValidator.predicate(
    "unknown side",
    throwsError(() =>
      setHumanFaceDetail(document, "eye.widthScale", 1, "other" as "left"),
    ),
  );
};
