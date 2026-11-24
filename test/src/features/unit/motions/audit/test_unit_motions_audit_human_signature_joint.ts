import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSignature,
} from "@automovie/interface";
import { HumanSignature } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { resolvedBones } from "../../../internal/resolvedBones";
import { throwsError } from "../../../internal/throwsError";

/**
 * `HumanSignature.joint` reads one joint centre of the performer at a second,
 * the bone's displayed world position, and refuses a bone the rig lacks.
 *
 * Scenario: a head rising 0.1 m a second from 1.5 m reads 1.55 m at 0.5 s; a
 * hand the motion does not display is refused.
 *
 * The body is built whole (`humanFixtureBody`) only for the reader's record.
 */
export async function test_unit_motions_audit_human_signature_joint(): Promise<void> {
  // The parameter is the whole body record (closures and maps, no stored or partial typed form without a cast); this reading reads no field of it.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const reader: IAutoMovieMotionHumanSignature.IReader = HumanSignature(
    {
      duration: 1,
      bones: (_subject: string, t: number) =>
        resolvedBones([["head", { x: 0, y: 1.5 + 0.1 * t, z: 0 }]]),
    },
    "a",
    body,
    0,
  );
  TestValidator.equals("the head", HumanSignature.joint(reader, 0.5, "head"), {
    x: 0,
    y: 1.55,
    z: 0,
  });
  TestValidator.predicate(
    "a missing hand",
    throwsError(
      () => HumanSignature.joint(reader, 0.5, "leftHand"),
      "leftHand",
    ),
  );
}
