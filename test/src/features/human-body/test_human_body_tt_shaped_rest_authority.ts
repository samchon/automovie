import { createHumanBodyBasisBuilder } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanBodyShoulderFixture } from "../internal/humanBodyShoulderFixture";
import { nclose, qclose } from "../internal/predicates";

/**
 * Omission and an explicit goal matching the same shaped rest orientation
 * must select identical corrective deformation through the public builder.
 * The analytic arm's landmarks establish its angle independently of the
 * resolver, while a kernel that is off at the base rest distinguishes whether
 * activation still reads a fixed base orientation after shape changes.
 *
 * Scenarios:
 * 1. The original 45-degree rest admits a kernel centred at 80 with outer25.
 * 2. A named landmark target changes the arm direction to (0.2,-0.1,0),
 *    whose elevation is independently atan2(0.2,0.1), about63.435degrees.
 * 3. Omitted and explicit shaped rest give the same actual bone rotation and
 *    must give identical basis-ordered skin positions.
 */
export const test_human_body_tt_shaped_rest_authority = (): void => {
  const { basis, document } = humanBodyShoulderFixture();
  const elbow = basis.landmarks.ids.indexOf("left-elbow");
  TestValidator.predicate("the intended landmark exists", elbow >= 0);
  basis.landmarks.targets.raised.push(elbow, 0, 0.1, 0);
  basis.correctives!.push({
    id: "shaped-rest-probe",
    target: "shaped-rest-probe",
    weight: 1,
    inputs: [{
      shoulder: "leftUpperArm",
      orientation: { plane: 0, elevation: 80, axialRotation: 0 },
      innerDegrees: 0,
      outerDegrees: 25,
    }],
  });
  basis.surfaces[0].targets["shaped-rest-probe"] = [4, 0, 0, 0.001];
  const build = createHumanBodyBasisBuilder(basis);
  const omitted = build({ ...document, shape: { tall: 1 }, pose: [] });
  const explicit = build({
    ...document,
    shape: { tall: 1 },
    pose: [],
    shoulders: [{
      bone: "leftUpperArm",
      plane: 0,
      elevation: Math.atan2(0.2, 0.1) * 180 / Math.PI,
      axialRotation: 0,
    }],
  });
  const left = omitted.bones.find((bone) => bone.bone === "leftUpperArm")!;
  const other = explicit.bones.find((bone) => bone.bone === "leftUpperArm")!;
  TestValidator.predicate(
    "the inputs denote the same shaped arm orientation",
    qclose(left.posed.rotation, other.posed.rotation, 1e-9),
  );
  TestValidator.predicate(
    "equivalent shaped rest inputs select the same skin deformation",
    omitted.posedSurfaces[0].positions.every((value, index) =>
      nclose(value, explicit.posedSurfaces[0].positions[index], 1e-9),
    ),
  );
};
