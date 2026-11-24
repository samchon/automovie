import type { IAutoMovieMotionHumanBody } from "@automovie/interface";
import { HumanSignature } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../../internal/nclose";
import { resolvedBones } from "../../../internal/resolvedBones";

/** Rounding of an arccosine, degrees. */
const ROUNDING: number = 1e-9;

/**
 * `HumanSignature.hip` reads a hip's flexion: the thigh's turn from the trunk's
 * line continued through the hip, neck to hip to knee, 0 with the thigh on that
 * line.
 *
 * Scenario: the neck at (0, 1.5, 0) above a hip at (0, 1, 0); the left thigh
 * raised level ahead to (0, 1, 0.45): 90 degrees; the right thigh hanging
 * straight down to (0, 0.55, 0): 0.
 *
 * The body is built whole (`humanFixtureBody`) only for the reader's record.
 */
export async function test_unit_motions_audit_human_signature_hip(): Promise<void> {
  // The parameter is the whole body record (closures and maps, no stored or partial typed form without a cast); this reading reads no field of it.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const reader = HumanSignature(
    {
      duration: 1,
      bones: () =>
        resolvedBones([
          ["neck", { x: 0, y: 1.5, z: 0 }],
          ["leftUpperLeg", { x: 0, y: 1, z: 0 }],
          ["leftLowerLeg", { x: 0, y: 1, z: 0.45 }],
          ["rightUpperLeg", { x: 0, y: 1, z: 0 }],
          ["rightLowerLeg", { x: 0, y: 0.55, z: 0 }],
        ]),
    },
    "a",
    body,
    0,
  );
  TestValidator.predicate(
    "the hips",
    nclose(HumanSignature.hip(reader, 0, "left"), 90, ROUNDING) &&
      nclose(HumanSignature.hip(reader, 0, "right"), 0, ROUNDING),
  );
}
