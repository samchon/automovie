import { humanBodyShoulderTtRotation } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { qclose, qunit } from "../internal/predicates";

/**
 * Quaternion oracles are calculated directly from axis-angle half angles.
 * Frontal and forward elevation must not pre-rotate the humeral long axis.
 */
export const test_human_body_shoulder_tt_rotation = (): void => {
  const rootHalf = Math.SQRT1_2;
  const q = (
    bone: "leftUpperArm" | "rightUpperArm",
    plane: number,
    elevation: number,
    axialRotation = 0,
  ) => humanBodyShoulderTtRotation({ bone, plane, elevation, axialRotation });
  TestValidator.predicate(
    "left frontal raise is +Z quarter turn",
    qclose(q("leftUpperArm", 0, 90), {
      x: 0,
      y: 0,
      z: rootHalf,
      w: rootHalf,
    }),
  );
  TestValidator.predicate(
    "right frontal raise is -Z quarter turn",
    qclose(q("rightUpperArm", 0, 90), {
      x: 0,
      y: 0,
      z: -rootHalf,
      w: rootHalf,
    }),
  );
  for (const bone of ["leftUpperArm", "rightUpperArm"] as const) {
    TestValidator.predicate(
      `${bone} forward raise is -X quarter turn`,
      qclose(q(bone, 90, 90), {
        x: -rootHalf,
        y: 0,
        z: 0,
        w: rootHalf,
      }),
    );
    TestValidator.predicate(
      `${bone} posterior raise is +X quarter turn`,
      qclose(q(bone, -90, 90), {
        x: rootHalf,
        y: 0,
        z: 0,
        w: rootHalf,
      }),
    );
    TestValidator.predicate(
      `${bone} mixed plane has no preparatory axial turn`,
      qclose(q(bone, 45, 90), {
        x: -0.5,
        y: 0,
        z: bone === "leftUpperArm" ? 0.5 : -0.5,
        w: rootHalf,
      }),
    );
    TestValidator.predicate(
      `${bone} zero pole ignores plane but keeps axial rotation`,
      qclose(q(bone, 0, 0, 30), q(bone, 137, 0, 30)) &&
        !qclose(q(bone, 0, 0, 30), q(bone, 0, 0, -30)),
    );
    TestValidator.predicate(
      `${bone} 180 pole plane and axial equivalence`,
      qclose(q(bone, 0, 180, 30), q(bone, 45, 180, -60)) &&
        !qclose(q(bone, 0, 180, 30), q(bone, 45, 180, 30)),
    );
    TestValidator.predicate(
      `${bone} pole quaternions remain unit length`,
      qunit(q(bone, -179, 0, 75)) && qunit(q(bone, 179, 180, -75)),
    );
  }
};
