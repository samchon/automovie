import type {
  IAutoMovieBone,
  IAutoMovieMotionHumanBody,
} from "@automovie/interface";
import { readHumanBone } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";

/**
 * `readHumanBone` reads a bone's record from the body's index of its rig, built
 * when the body is made: the rig's own record, the first of that name in the
 * bone list.
 *
 * Scenarios:
 *
 * 1. The hips' record is the rig's own object, the first named `hips`.
 * 2. Every bone of the rig is read as the first record of its name.
 */
export async function test_unit_motions_body_read_human_bone(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const first = (name: string): IAutoMovieBone | undefined =>
    body.skeleton.bones.find(
      (bone: IAutoMovieBone): boolean => bone.bone === name,
    );
  TestValidator.predicate(
    "the hips' own record",
    readHumanBone(body, "hips") === first("hips") &&
      readHumanBone(body, "hips") !== undefined,
  );
  TestValidator.predicate(
    "every bone",
    body.skeleton.bones.every(
      (bone: IAutoMovieBone): boolean =>
        readHumanBone(body, bone.bone) === first(bone.bone),
    ),
  );
}
