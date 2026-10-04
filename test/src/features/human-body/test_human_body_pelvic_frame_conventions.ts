import { Quaternion } from "@automovie/engine";
import { createHumanBodyBasisBuilder, resolveHumanBodyDocumentPose } from "@automovie/human";
import type { IAutoMovieJointPose } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { humanBodyPelvisFixture } from "../internal/humanBodyPelvisFixture";
import { humanBodyShoulderFixture } from "../internal/humanBodyShoulderFixture";
import { nclose, throwsError, vclose } from "../internal/predicates";

/**
 * Actual clinical reporting follows the shaped tree and source frame, while
 * sagittal shared-axis identities preserve authored degree endpoints.
 *
 * Scenarios:
 * 1. A declared bilateral flexion line works in either landmark order, at a
 *    nonzero clinical neutral and with asymmetric landmark shape endpoints.
 * 2. An additional root child participates in post-pelvis admission; a parent
 *    rotation cannot hide its actual twist overshoot.
 * 3. A basis without rhythm keeps its original motion and neutral return.
 * 4. TT shoulders retain their own owner: supported goals read no generic
 *    humeral Euler coordinates, while absent and exceeded contracts refuse.
 */
export const test_human_body_pelvic_frame_conventions = (): void => {
  const joint = (bone: IAutoMovieJointPose["bone"], flexion: number, abduction: number | null = null, twist: number | null = null): IAutoMovieJointPose => ({ bone, flexion, abduction, twist });
  for (const reversed of [false, true]) {
    const { basis, document } = humanBodyPelvisFixture();
    for (const side of ["left", "right"] as const) {
      const hip = basis.joints.find((one) => one.bone === `${side}UpperLeg`)!;
      hip.flexionAxis = reversed ? ["right-hip", "left-hip"] : ["left-hip", "right-hip"];
      hip.neutral.flexion = 5;
    }
    basis.pelvifemoral!.curve = [[5, 0], [105, 20]];
    const left = basis.landmarks.ids.indexOf("left-hip");
    basis.landmarks.targets.wide = [left, 0, 0.04, 0.03];
    basis.landmarks.targets.narrow = [left, 0, -0.04, -0.03];
    for (const width of [-1, 0, 1]) {
      const request = { ...document, shape: { width }, pose: [joint("leftUpperLeg", 55)] };
      const built = createHumanBodyBasisBuilder(basis)(request);
      const clinical = resolveHumanBodyDocumentPose(basis, request);
      TestValidator.equals("shared-axis clinical flexion is exact", clinical.find((one) => one.bone === "leftUpperLeg")!.flexion, 45);
      const thigh = built.bones.find((one) => one.bone === "leftUpperLeg")!;
      const noRhythm = createHumanBodyBasisBuilder({ ...basis, pelvifemoral: undefined })(request);
      const plain = noRhythm.bones.find((one) => one.bone === thigh.bone)!;
      TestValidator.predicate("shape and rhythm retain authored thigh direction", vclose(Quaternion.rotateVector(thigh.posed.rotation, { x: 0, y: 1, z: 0 }), Quaternion.rotateVector(plain.posed.rotation, { x: 0, y: 1, z: 0 }), 1e-9));
    }
  }
  const { basis, document } = humanBodyPelvisFixture();
  const extra = structuredClone(basis.joints.find((one) => one.bone === "spine")!);
  extra.bone = "chest";
  extra.constraint!.twist = { min: -10, max: 10 };
  basis.joints.push(extra);
  const pose = [joint("hips", 0, 20, 10), joint("leftUpperLeg", 100), joint("chest", 0, 10, 10)];
  TestValidator.predicate("every actual direct child is checked", throwsError(() => createHumanBodyBasisBuilder(basis)({ ...document, pose }), "chest"));
  const fallback = structuredClone(basis);
  fallback.joints.find((one) => one.bone === "chest")!.constraint = null;
  const fallbackBuild = createHumanBodyBasisBuilder(fallback);
  TestValidator.predicate("engine default bound keeps its exact sagittal endpoint", fallbackBuild({ ...document, pose: [joint("leftUpperLeg", 100), joint("chest", 20)] }).bones.length > 0);
  TestValidator.predicate("default-bound adjacent overshoot refuses", throwsError(() => fallbackBuild({ ...document, pose: [joint("leftUpperLeg", 100), joint("chest", 20.5)] }), "chest"));
  const plain = { ...basis, pelvifemoral: undefined };
  const read = resolveHumanBodyDocumentPose(plain, { ...document, pose: [joint("leftUpperLeg", 50, 30, 25)] });
  TestValidator.equals("without rhythm authored coordinates survive", read.find((one) => one.bone === "leftUpperLeg"), joint("leftUpperLeg", 50, 30, 25));
  const neutral = resolveHumanBodyDocumentPose(plain, document);
  TestValidator.predicate("return restores all source-rig neutral values", neutral.every((one) => nclose(one.flexion!, plain.joints.find((entry) => entry.bone === one.bone)!.neutral.flexion)));
  const alias = humanBodyPelvisFixture();
  alias.basis.landmarks.ids.push("axis-start", "axis-end");
  alias.basis.landmarks.positions.push(0.1, -0.2, 0, -0.1, -0.2, 0);
  alias.basis.joints.find((one) => one.bone === "leftUpperLeg")!.flexionAxis = ["axis-start", "axis-end"];
  const aliasPose = [joint("rightUpperLeg", 100), joint("leftUpperLeg", -10)];
  TestValidator.equals("a separately named shared line uses exact source directions", resolveHumanBodyDocumentPose(alias.basis, { ...alias.document, pose: aliasPose }).find((one) => one.bone === "leftUpperLeg")!.flexion, -30);
  const shoulders = humanBodyShoulderFixture(true);
  const shoulder = { bone: "leftUpperArm" as const, plane: 0, elevation: 90, axialRotation: 0 };
  TestValidator.predicate("TT goals keep the distinct owner", !resolveHumanBodyDocumentPose(shoulders.basis, { ...shoulders.document, shoulders: [shoulder] }).some((one) => one.bone === shoulder.bone));
  TestValidator.predicate("absent TT contract refuses", throwsError(() => resolveHumanBodyDocumentPose(basis, { ...document, shoulders: [shoulder] }), "shoulder goal"));
  TestValidator.predicate("exceeded TT contract refuses", throwsError(() => resolveHumanBodyDocumentPose(shoulders.basis, { ...shoulders.document, shoulders: [{ ...shoulder, elevation: 181 }] }), "shoulder goal"));
};
