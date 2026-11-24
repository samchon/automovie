import type { IAutoMovieMotionHumanBody } from "@automovie/interface";
import { HumanSignature } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../../internal/nclose";
import { resolvedBones } from "../../../internal/resolvedBones";

/** Rounding of an arccosine, degrees. */
const ROUNDING: number = 1e-9;

/**
 * `HumanSignature.knee` reads a knee's flexion: the shank's turn from the
 * thigh at the knee, hip to knee to ankle joint centres, 0 straight.
 *
 * Scenario: the left thigh hangs from (0.1, 1, 0) to (0.1, 0.5, 0), the shank
 * runs back to (0.1, 0, -0.5): 45 degrees; the right leg hangs straight: 0.
 *
 * The body is built whole (`humanFixtureBody`) only for the reader's record.
 */
export async function test_unit_motions_audit_human_signature_knee(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const reader = HumanSignature(
    {
      duration: 1,
      bones: () =>
        resolvedBones([
          ["leftUpperLeg", { x: 0.1, y: 1, z: 0 }],
          ["leftLowerLeg", { x: 0.1, y: 0.5, z: 0 }],
          ["leftFoot", { x: 0.1, y: 0, z: -0.5 }],
          ["rightUpperLeg", { x: -0.1, y: 1, z: 0 }],
          ["rightLowerLeg", { x: -0.1, y: 0.5, z: 0 }],
          ["rightFoot", { x: -0.1, y: 0.05, z: 0 }],
        ]),
    },
    "a",
    body,
    0,
  );
  TestValidator.predicate(
    "the knees",
    nclose(HumanSignature.knee(reader, 0, "left"), 45, ROUNDING) &&
      nclose(HumanSignature.knee(reader, 0, "right"), 0, ROUNDING),
  );
}
