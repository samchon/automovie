import { HumanSignature } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { resolvedBones } from "../../../internal/resolvedBones";

/** Rounding of an arccosine, degrees. */
const ROUNDING: number = 1e-9;

/**
 * `HumanSignature.elbow` reads an elbow's flexion: the forearm's turn from the
 * upper arm, shoulder to elbow to wrist joint centres, 0 straight.
 *
 * Scenario: the right upper arm hangs from (-0.2, 1.4, 0) to (-0.2, 1.1, 0) and
 * the forearm comes up ahead to (-0.2, 1.1 + 0.25 cos 60, 0.25 sin 60): 120
 * degrees.
 */
export function test_unit_motions_audit_human_signature_elbow(): void {
  const reader: HumanSignature.IBones = {
    motion: {
      duration: 1,
      bones: () =>
        resolvedBones([
          ["rightUpperArm", { x: -0.2, y: 1.4, z: 0 }],
          ["rightLowerArm", { x: -0.2, y: 1.1, z: 0 }],
          [
            "rightHand",
            {
              x: -0.2,
              y: 1.1 + 0.25 * Math.cos(Math.PI / 3),
              z: 0.25 * Math.sin(Math.PI / 3),
            },
          ],
        ]),
    },
    subject: "a",
  };
  TestValidator.predicate(
    "the elbow",
    nclose(HumanSignature.elbow(reader, 0, "right"), 120, ROUNDING),
  );
}
