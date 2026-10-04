import { createHumanBodyAnatomicalInspection } from "@automovie/human/body/anatomy/articulation/createHumanBodyAnatomicalInspection";
import { TestValidator } from "@nestia/e2e";

import { bodyAnatomicalInspectionFixture } from "../internal/bodyAnatomicalInspectionFixture";
import { nclose, vclose, throwsError } from "../internal/predicates";

/**
 * Explicit targets use known reference joints while requested context and whole anatomy remain distinct.
 *
 * Scenarios:
 * 1. Independent left and right targets use known reference centres and millimetre conversion while complete anatomy remains unavailable.
 * 2. Basis mismatch, unregistered imaging and absent radii refuse; owned outputs and recovery preserve unrelated targets.
 */
export function test_human_body_anatomical_inspection(): void {
  const { basis, document } = bodyAnatomicalInspectionFixture();
  if (document.tier !== "detailed") throw new Error("fixture tier");
  const before = JSON.stringify({ basis, document });
  const inspect = createHumanBodyAnatomicalInspection(basis);
  const first = inspect(document);
  TestValidator.equals("independent part identity", first.candidates.map((one) => one.part), ["leftHumerus", "leftFemur"]);
  TestValidator.predicate("independent known centres and mm conversion", nclose(first.candidates[0].radiusMetres, .024) && nclose(first.candidates[1].radiusMetres, .025) && vclose(first.candidates[0].center, { x: .2, y: 3, z: 0 }) && vclose(first.candidates[1].center, { x: .1, y: -.2, z: 0 }));
  TestValidator.equals("no source or caller mutation", JSON.stringify({ basis, document }), before);
  TestValidator.equals("requested context is not reference geometry", first.requested, document.targets);
  TestValidator.equals("skin stays unavailable", first.skin, { status: "unavailable", reason: "geometry-not-validated" });
  TestValidator.predicate("complete bones stay unavailable", first.candidates.every((one) => one.partResolution.status === "unavailable"));
  TestValidator.predicate("owned request context", first.requested !== document.targets && first.requested.age !== document.targets.age);
  first.candidates[0].center.x = 99;
  TestValidator.predicate("owned outputs do not poison reference or request", nclose(inspect(document).candidates[0].center.x, .2));
  const both = { ...document, targets: { ...document.targets,
    rightUpperLimb: { upperArm: { humerus: { sphereFittedHeadRadius: { kind: "target" as const, millimetres: 21 } } } },
    rightLowerLimb: { thigh: { femur: { sphereFittedHeadRadius: { kind: "target" as const, millimetres: 22 } } } },
  } };
  const mirrored = inspect(both).candidates;
  TestValidator.equals("four independent anatomical sides", mirrored.map((one) => one.part), ["leftHumerus", "rightHumerus", "leftFemur", "rightFemur"]);
  TestValidator.predicate("independent side radii and reference centres", mirrored.every((one, index) => nclose(one.radiusMetres, [.024, .021, .025, .022][index]) && nclose(one.center.x, [.2, -.2, .1, -.1][index])));
  TestValidator.predicate("reference mismatch refuses", throwsError(() => inspect({ ...document, basis: "other" }), "basis"));
  for (const posture of ["supine", "prone", "seated", "standing"] as const) {
    const observed = { ...document, targets: { ...document.targets,
      leftUpperLimb: { upperArm: { humerus: { sphereFittedHeadRadius: { kind: "observed" as const, millimetres: 24, modality: "ct" as const, acquisitionPosture: posture } } } },
    } };
    TestValidator.predicate("registration must precede placement", throwsError(() => inspect(observed), posture === "standing" ? "acquisition-not-registered" : "posture-unregistered"));
  }
  TestValidator.predicate("global context alone does not invent a head", throwsError(() => inspect({ ...document, targets: { age: document.targets.age, surface: document.targets.surface } }), "missing-anatomical-input"));
  for (const [side, limb] of [["left", "Lower"], ["right", "Lower"], ["right", "Upper"]] as const) {
    const observation = { kind: "observed" as const, millimetres: 25, modality: "mri" as const, acquisitionPosture: "standing" as const };
    const group = limb === "Lower"
      ? { thigh: { femur: { sphereFittedHeadRadius: observation } } }
      : { upperArm: { humerus: { sphereFittedHeadRadius: observation } } };
    TestValidator.predicate("each observed side requires registration", throwsError(() => inspect({ ...document, targets: { ...document.targets, [`${side}${limb}Limb`]: group } }), "acquisition-not-registered"));
  }
  TestValidator.predicate("simple context supplies no prior radius", throwsError(() => inspect({ ...document, tier: "simple", targets: { ageYears: 30, standingStatureMetres: 1.7, bodyMassKilograms: 65 } }), "missing-anatomical-input"));
  const recovery = { ...document, targets: { ...document.targets,
    leftUpperLimb: { upperArm: { humerus: { sphereFittedHeadRadius: { kind: "target" as const, millimetres: 23 } } } },
  } };
  TestValidator.predicate("recovery retains unrelated femoral target", inspect(recovery).candidates.every((one, index) => nclose(one.radiusMetres, [.023, .025][index])));
}
