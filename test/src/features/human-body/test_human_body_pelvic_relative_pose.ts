import { createHumanBodyBasisBuilder, resolveHumanBodyDocumentPose } from "@automovie/human";
import type { IAutoMovieJointPose } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { humanBodyPelvisFixture } from "../internal/humanBodyPelvisFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * Pelvic-relative admission reads the actual composed joint frames, while the
 * document keeps its authored motion and the builder retains world targets.
 *
 * Scenarios:
 * 1. Each hip at flexion 50, abduction 45 and twist 45 produces pelvic-relative
 *    abduction beyond its declared 45-degree maximum and refuses in both paths.
 * 2. Opening only an analytic fixture's range exposes the independently
 *    calculated combined coordinates; a rotated root gives the same local result.
 * 3. A combined lumbar pose can exceed its twist range after the pelvis turns.
 * 4. Sagittal exact limits, the adjacent refusal and neutral return retain the
 *    existing admitted endpoints, without mutating caller-owned values.
 * 5. A foreign revision, duplicate bone and invalid shape refuse before replay.
 */
export const test_human_body_pelvic_relative_pose = (): void => {
  const { basis, document } = humanBodyPelvisFixture();
  const joint = (bone: IAutoMovieJointPose["bone"], flexion: number, abduction: number | null = null, twist: number | null = null): IAutoMovieJointPose => ({ bone, flexion, abduction, twist });
  const build = createHumanBodyBasisBuilder(basis);
  const unchanged = JSON.stringify({ basis, document });
  for (const bone of ["leftUpperLeg", "rightUpperLeg"] as const) {
    const request = { ...document, pose: [joint(bone, 50, 45, 45)] };
    TestValidator.predicate(`${bone} actual range refuses`, throwsError(() => build(request), "pelvic-relative"));
    TestValidator.predicate(`${bone} draft reading uses the same refusal`, throwsError(() => resolveHumanBodyDocumentPose(basis, request), "pelvic-relative"));
  }
  const opened = structuredClone(basis);
  opened.joints.find((one) => one.bone === "leftUpperLeg")!.constraint!.abduction!.max = 60;
  const request = { ...document, pose: [joint("leftUpperLeg", 50, 45, 45)] };
  for (const pose of [request.pose, [joint("hips", 0, 40, 20), ...request.pose]]) {
    const actual = resolveHumanBodyDocumentPose(opened, { ...document, pose }).find((one) => one.bone === "leftUpperLeg")!;
    TestValidator.predicate("combined coordinates use actual frames", nclose(actual.flexion!, 38.61057301749604, 1e-9) && nclose(actual.abduction!, 51.553429949772784, 1e-9) && nclose(actual.twist!, 36.47300289236523, 1e-9));
  }
  const lumbar = structuredClone(basis);
  lumbar.joints.find((one) => one.bone === "spine")!.constraint!.twist = { min: -10, max: 10 };
  TestValidator.predicate("lumbar actual twist refuses", throwsError(() => createHumanBodyBasisBuilder(lumbar)({ ...document, pose: [joint("leftUpperLeg", 100), joint("spine", 0, 10, 10)] }), "pelvic-relative"));
  for (const pose of [[joint("leftUpperLeg", 125)], [joint("leftUpperLeg", 100), joint("rightUpperLeg", -10)], [joint("leftUpperLeg", 100), joint("spine", 70)], []]) {
    const clinical = resolveHumanBodyDocumentPose(basis, { ...document, pose });
    TestValidator.predicate("supported sagittal endpoint or return builds", build({ ...document, pose }).bones.length === clinical.length);
  }
  TestValidator.predicate("adjacent pelvic extension refuses", throwsError(() => resolveHumanBodyDocumentPose(basis, { ...document, pose: [joint("leftUpperLeg", 100), joint("rightUpperLeg", -11)] }), "pelvic-relative"));
  TestValidator.predicate("foreign revision refuses", throwsError(() => resolveHumanBodyDocumentPose(basis, { ...document, basis: "foreign" }), "revision"));
  TestValidator.predicate("duplicate bone refuses", throwsError(() => resolveHumanBodyDocumentPose(basis, { ...document, pose: [joint("spine", 0), joint("spine", 0)] }), "unique"));
  TestValidator.predicate("unsupported shape refuses", throwsError(() => resolveHumanBodyDocumentPose(basis, { ...document, shape: { missing: 1 } }), "control"));
  TestValidator.equals("caller values remain unchanged through refusals and recovery", JSON.stringify({ basis, document }), unchanged);
};
