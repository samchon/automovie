import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSignature,
} from "@automovie/interface";
import { HumanSignature } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { resolvedBones } from "../../../internal/resolvedBones";

/**
 * `HumanSignature` makes the reader of one performer every signature reading
 * takes: the motion, the subject, the body and the heading its forward is read
 * along, as given.
 *
 * Scenario: a reader of `b` facing 90 degrees keeps each of the four, and its
 * `bones` reads the motion's bones of `b`.
 *
 * The body is built whole (`humanFixtureBody`): the reader carries the body
 * record its body readings use.
 */
export async function test_unit_motions_audit_human_signature(): Promise<void> {
  // The parameter is the whole body record (closures and maps, no stored or partial typed form without a cast); this reading reads no field of it.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const motion: IAutoMovieMotionHumanSignature.IMotion = {
    duration: 1,
    bones: (subject: string) =>
      resolvedBones([["hips", { x: subject === "b" ? 1 : 0, y: 1, z: 0 }]]),
  };
  const reader: IAutoMovieMotionHumanSignature.IReader = HumanSignature(
    motion,
    "b",
    body,
    90,
  );
  TestValidator.predicate(
    "the reader",
    reader.motion === motion &&
      reader.subject === "b" &&
      reader.body === body &&
      reader.yaw === 90 &&
      HumanSignature.bones(reader, 0.5).get("hips")!.worldPosition.x === 1,
  );
}
