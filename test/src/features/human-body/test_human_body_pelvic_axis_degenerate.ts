import { createHumanBodyBasisBuilder, resolveHumanBodyDocumentPose } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanBodyPelvisFixture } from "../internal/humanBodyPelvisFixture";
import { throwsError } from "../internal/predicates";

/**
 * A nonzero posterior tilt needs two distinct finite hip centres, instead of
 * accepting an identity rotation about a fabricated zero axis.
 *
 * Scenarios:
 * 1. Coincident centres refuse a nonzero tilt through both builder and draft
 *    reading, preserve the caller and recover at zero tilt or without rhythm.
 * 2. A finite input blend whose resolved subtraction overflows refuses, while
 *    its unblended neighbor recovers through the same builder.
 * 3. A nearby nonzero line remains supported; no anatomical width threshold
 *    is invented by the geometric direction precondition.
 */
export const test_human_body_pelvic_axis_degenerate = (): void => {
  const { basis, document } = humanBodyPelvisFixture();
  const left = basis.landmarks.ids.indexOf("left-hip") * 3;
  const right = basis.landmarks.ids.indexOf("right-hip") * 3;
  basis.landmarks.positions.splice(right, 3, ...basis.landmarks.positions.slice(left, left + 3));
  const request = { ...document, pose: [{ bone: "leftUpperLeg" as const, flexion: 50, abduction: null, twist: null }] };
  const before = JSON.stringify({ basis, request });
  const build = createHumanBodyBasisBuilder(basis);
  TestValidator.predicate("zero line cannot turn a pelvis", throwsError(() => build(request), "nonzero line"));
  TestValidator.predicate("draft uses the same zero-line refusal", throwsError(() => resolveHumanBodyDocumentPose(basis, request), "nonzero line"));
  TestValidator.equals("no caller value changed on refusal", JSON.stringify({ basis, request }), before);
  TestValidator.predicate("zero tilt recovers", build(document).bones.length > 0);
  TestValidator.predicate("absence of rhythm needs no hip-line turn", createHumanBodyBasisBuilder({ ...basis, pelvifemoral: undefined })(request).bones.length > 0);
  const distinct = structuredClone(basis);
  distinct.landmarks.positions[right] -= 0.001;
  TestValidator.predicate("nearby distinct axis is supported", createHumanBodyBasisBuilder(distinct)(request).bones.length > 0);
  const overflow = humanBodyPelvisFixture();
  const leftAt = overflow.basis.landmarks.ids.indexOf("left-hip"), rightAt = overflow.basis.landmarks.ids.indexOf("right-hip");
  overflow.basis.landmarks.targets.wide = [leftAt, 1e308, 0, 0, rightAt, -1e308, 0, 0];
  const overflowBuild = createHumanBodyBasisBuilder(overflow.basis);
  const overflowRequest = { ...overflow.document, shape: { width: 1 }, pose: request.pose };
  TestValidator.predicate("resolved subtraction overflow refuses", throwsError(() => overflowBuild(overflowRequest), "finite nonzero line"));
  TestValidator.predicate("finite unblended neighbor recovers", overflowBuild({ ...overflowRequest, shape: {} }).bones.length > 0);
};
