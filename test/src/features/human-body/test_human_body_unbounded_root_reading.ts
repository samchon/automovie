import { Quaternion, jointToQuaternion } from "@automovie/engine";
import { createHumanBodyBasisBuilder, resolveHumanBodyDocumentPose, resolveHumanBodySkeleton } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanBodyPelvisFixture } from "../internal/humanBodyPelvisFixture";
import { qclose } from "../internal/predicates";

/**
 * Unbounded root reporting reads the actual post-turn rotation, rather than
 * a scalar sum whose finite mantissa can erase the posterior tilt.
 *
 * Scenarios:
 * 1. An authored root flexion of 1e308 is finite and accepted; subtracting ten
 *    is lost in double arithmetic, but the reported three-axis coordinates
 *    reconstruct the actual rendered root rotation through the shared engine.
 * 2. Returning to neutral preserves caller values and the source-rig rest.
 */
export const test_human_body_unbounded_root_reading = (): void => {
  const { basis, document } = humanBodyPelvisFixture();
  const request = { ...document, pose: [{ bone: "hips" as const, flexion: 1e308, abduction: null, twist: null }, { bone: "leftUpperLeg" as const, flexion: 50, abduction: null, twist: null }] };
  const before = JSON.stringify(request);
  const build = createHumanBodyBasisBuilder(basis);
  const built = build(request);
  const rig = resolveHumanBodySkeleton(basis, built.landmarks);
  const root = built.bones.find((one) => one.bone === "hips")!;
  const actual = Quaternion.multiply(Quaternion.inverse(root.rest.rotation), root.posed.rotation);
  const reported = resolveHumanBodyDocumentPose(basis, request).find((one) => one.bone === "hips")!;
  TestValidator.equals("scalar arithmetic really loses the tilt", 1e308 - 10, 1e308);
  TestValidator.predicate("source output stays finite", Object.values(actual).every(Number.isFinite));
  TestValidator.predicate("actual root reading reconstructs the posed quaternion", qclose(jointToQuaternion(reported, rig.axes.hips, rig.frames.hips), actual, 1e-9));
  const neutral = build(document).bones.find((one) => one.bone === "hips")!;
  TestValidator.predicate("neutral return keeps rest orientation", qclose(neutral.rest.rotation, neutral.posed.rotation, 1e-9));
  TestValidator.equals("caller keeps the original unbounded input", JSON.stringify(request), before);
};
