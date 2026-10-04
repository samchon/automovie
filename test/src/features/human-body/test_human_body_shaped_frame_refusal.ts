import { createHumanBodyBasisBuilder, resolveHumanBodyDocumentPose, resolveHumanBodyShapeShoulderRest, resolveHumanBodySkeleton } from "@automovie/human";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { humanBodyPelvisFixture } from "../internal/humanBodyPelvisFixture";
import { throwsError } from "../internal/predicates";

/**
 * Shaped rest-frame construction refuses a missing axis at its shared owner,
 * rather than normalizing an arbitrary quaternion from degenerate columns.
 *
 * Scenarios:
 * 1. A shape endpoint makes the left knee coincide with its hip or puts the
 *    bone parallel to its declared forward reference; builder, draft reader
 *    and TT rest-query path share the named refusal and neutral recovery.
 * 2. Near-parallel finite neighbors on either side remain supported without
 *    an invented angle tolerance or replacement axis.
 * 3. Finite source offsets can overflow a bone direction, while direct malformed
 *    landmarks/references refuse before construction and preserve caller values.
 */
export const test_human_body_shaped_frame_refusal = (): void => {
  for (const forward of [0, 1]) {
    const { basis, document } = humanBodyPelvisFixture();
    for (const side of ["left", "right"] as const) {
      basis.landmarks.positions[basis.landmarks.ids.indexOf(`${side}-hip`) * 3 + 1] = 0;
      basis.landmarks.positions[basis.landmarks.ids.indexOf(`${side}-knee`) * 3 + 1] = -1;
    }
    const knee = basis.landmarks.ids.indexOf("left-knee");
    basis.landmarks.targets.wide = [knee, 0, 1, forward];
    const build = createHumanBodyBasisBuilder(basis);
    const request = { ...document, shape: { width: 1 } };
    const before = JSON.stringify({ basis, request });
    const reason = forward === 0 ? "bone direction" : "projected flexion reference";
    TestValidator.predicate("builder refuses undefined shaped frame", throwsError(() => build(request), reason));
    TestValidator.predicate("draft resolver shares frame refusal", throwsError(() => resolveHumanBodyDocumentPose(basis, request), reason));
    TestValidator.predicate("TT rest query shares frame refusal", throwsError(() => resolveHumanBodyShapeShoulderRest(basis, request.shape), reason));
    TestValidator.equals("caller input preserved", JSON.stringify({ basis, request }), before);
    TestValidator.predicate("neutral return remains supported", build(document).bones.length > 0);
  }
  for (const sign of [-1, 1]) {
    const { basis, document } = humanBodyPelvisFixture();
    const hip = basis.landmarks.ids.indexOf("left-hip"), knee = basis.landmarks.ids.indexOf("left-knee");
    basis.landmarks.positions[hip * 3 + 1] = 0;
    basis.landmarks.positions[knee * 3 + 1] = -1;
    basis.landmarks.targets.wide = [knee, 0, 1 + sign * 2 ** -24, 1];
    TestValidator.predicate("finite near-parallel reference remains supported", createHumanBodyBasisBuilder(basis)({ ...document, shape: { width: 1 } }).bones.length > 0);
  }
  const { basis, document } = humanBodyPelvisFixture();
  const hip = basis.landmarks.ids.indexOf("left-hip"), knee = basis.landmarks.ids.indexOf("left-knee");
  basis.landmarks.targets.wide = [hip, 1e308, 0, 0, knee, -1e308, 0, 0];
  const build = createHumanBodyBasisBuilder(basis);
  TestValidator.predicate("bone subtraction overflow refuses", throwsError(() => build({ ...document, shape: { width: 1 } }), "finite nonzero bone direction"));
  TestValidator.predicate("unblended source recovers", build(document).bones.length > 0);
  const landmarks: Record<string, IAutoMovieVector3> = Object.fromEntries(basis.landmarks.ids.map((id, index) => [id, { x: basis.landmarks.positions[index * 3], y: basis.landmarks.positions[index * 3 + 1], z: basis.landmarks.positions[index * 3 + 2] }]));
  const invalid = structuredClone(landmarks);
  invalid["left-knee"].x = NaN;
  TestValidator.predicate("nonfinite shaped landmark refuses", throwsError(() => resolveHumanBodySkeleton(basis, invalid), "bone direction"));
  const badReference = structuredClone(basis);
  badReference.joints.find((one) => one.bone === "leftUpperLeg")!.reference[2] = NaN;
  TestValidator.predicate("nonfinite projected reference refuses", throwsError(() => resolveHumanBodySkeleton(badReference, landmarks), "projected flexion reference"));
  TestValidator.predicate("original direct query recovers", resolveHumanBodySkeleton(basis, landmarks).skeleton.bones.length > 0);
  for (const forward of [0, 1]) {
    const fixture = humanBodyPelvisFixture();
    fixture.basis.joints.find((one) => one.bone === "leftUpperLeg")!.flexionAxis = ["left-hip", "right-hip"];
    const right = fixture.basis.landmarks.ids.indexOf("right-hip");
    fixture.basis.landmarks.targets.wide = [right, 0.2, 0, forward];
    const evaluate = createHumanBodyBasisBuilder(fixture.basis);
    const reason = forward === 0 ? "declared flexion line" : "abduction projection";
    TestValidator.predicate("optional axes refuse the same undefined-direction class", throwsError(() => evaluate({ ...fixture.document, shape: { width: 1 } }), reason));
    TestValidator.predicate("optional axes recover at neutral", evaluate(fixture.document).bones.length > 0);
  }
  const diagonal = humanBodyPelvisFixture();
  const diagonalHip = diagonal.basis.landmarks.ids.indexOf("left-hip"), diagonalKnee = diagonal.basis.landmarks.ids.indexOf("left-knee");
  diagonal.basis.landmarks.positions[diagonalHip * 3 + 1] = 0;
  diagonal.basis.landmarks.positions[diagonalKnee * 3 + 1] = -1;
  diagonal.basis.joints.find((one) => one.bone === "leftUpperLeg")!.reference = [1 / Math.sqrt(2), 1 / Math.sqrt(2), 0];
  diagonal.basis.landmarks.targets.wide = [diagonalKnee, 1, 2, 0];
  TestValidator.predicate("rounded projection residue is not a transverse frame", throwsError(() => createHumanBodyBasisBuilder(diagonal.basis)({ ...diagonal.document, shape: { width: 1 } }), "X frame direction"));
};
