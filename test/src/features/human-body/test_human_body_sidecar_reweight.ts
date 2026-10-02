import { TestValidator } from "@nestia/e2e";

import { bodyCorrectiveBasisDigest } from "../../../scripts/body-basis/bodyCorrectiveBasisDigest";
import { regirdleHumanBodyBasis } from "../../../scripts/body-basis/regirdleHumanBodyBasis";
import { humanBodyShoulderFixture } from "../internal/humanBodyShoulderFixture";
import { throwsError } from "../internal/predicates";

/**
 * The actual sidecar producer preserves its original payload and reports every
 * stale corrective target touched by reweighting, regardless of its name.
 *
 * Scenarios:
 * 1. Four upper box vertices transfer to the girdles while unchanged lower
 *    vertices, geometry and old targets remain unchanged and accounted for.
 * 2. Input/output fingerprints differ and result skin arrays are independent.
 * 3. Changed input, reused/empty revision, missing rig/landmark and invalid
 *    ramp are refused; no-corrective input keeps an empty affected-row record.
 */
export const test_human_body_sidecar_reweight = (): void => {
  const { basis } = humanBodyShoulderFixture();
  const surface = basis.surfaces[0];
  for (let v = 4; v < 8; ++v) surface.positions[3 * v + 1] = 4;
  surface.skin.joints = ["leftUpperArm", "leftShoulder", "rightUpperArm", "rightShoulder"];
  for (let v = 0; v < 8; ++v) surface.skin.boneIndices[4 * v] = surface.positions[3 * v] > 0 ? 0 : 2;
  basis.correctives!.push({ id: "lower-only", target: "lower-only", weight: 1, inputs: [{ channel: "width", side: "positive" }] });
  surface.targets["lower-only"] = [0, 0.001, 0, 0];
  const before = JSON.stringify(basis);
  const options = { input: basis, revision: "candidate/1", expectedSha256: bodyCorrectiveBasisDigest(basis), onsetDegrees: 70, fullDegrees: 110 };
  const candidate = regirdleHumanBodyBasis(options);
  TestValidator.equals("upper vertices and every affected corrective are reported", candidate.receipt.surfaces, [{ id: surface.id, changed: 4, correctiveRows: { wideTall: 1 } }]);
  TestValidator.equals("the original skin and payload remain intact", JSON.stringify(basis), before);
  TestValidator.predicate("old geometry and rows remain borrowed unchanged", candidate.basis.surfaces[0].positions === surface.positions && candidate.basis.surfaces[0].targets === surface.targets);
  TestValidator.equals("the receipt carries exact input and output fingerprints", [candidate.receipt.inputSha256, candidate.receipt.outputSha256], [options.expectedSha256, bodyCorrectiveBasisDigest(candidate.basis)]);
  TestValidator.predicate("a changed skin is a different candidate", candidate.receipt.inputSha256 !== candidate.receipt.outputSha256);
  candidate.basis.surfaces[0].skin.weights[0] = 0.5;
  candidate.basis.surfaces[0].skin.joints[0] = "hips";
  candidate.basis.surfaces[0].skin.boneIndices[0] = 1;
  TestValidator.equals("all changed skin arrays are independent", JSON.stringify(basis), before);
  for (const invalid of [
    { ...options, expectedSha256: "different" }, { ...options, revision: basis.id }, { ...options, revision: "" },
    { ...options, onsetDegrees: -1 },
  ]) TestValidator.predicate("an invalid recipe is refused", throwsError(() => regirdleHumanBodyBasis(invalid)));
  const noArm = structuredClone(basis);
  noArm.joints = noArm.joints.filter((joint) => joint.bone !== "leftUpperArm");
  TestValidator.predicate("a missing rig centre is not fabricated", throwsError(() => regirdleHumanBodyBasis({ ...options, input: noArm, expectedSha256: bodyCorrectiveBasisDigest(noArm) }), "no joint"));
  const noLandmark = structuredClone(basis);
  const arm = noLandmark.joints.find((joint) => joint.bone === "leftUpperArm")!;
  arm.head = "missing-landmark";
  TestValidator.predicate("a missing landmark is not fabricated", throwsError(() => regirdleHumanBodyBasis({ ...options, input: noLandmark, expectedSha256: bodyCorrectiveBasisDigest(noLandmark) }), "no landmark"));
  const noCorrectives = structuredClone(basis);
  delete noCorrectives.correctives;
  TestValidator.equals("absence of correctives is represented honestly", regirdleHumanBodyBasis({ ...options, input: noCorrectives, expectedSha256: bodyCorrectiveBasisDigest(noCorrectives) }).receipt.surfaces[0].correctiveRows, {});
};
