import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieMotionHumanBody,
} from "@automovie/interface";
import {
  readHumanBone
} from "../../../../../packages/motions/src/body/internal/readHumanBone";
import { TestValidator } from "@nestia/e2e";

import type { IHumanFixture } from "../../internal/fixtures/IHumanFixture";
import { humanFixture } from "../../internal/fixtures/humanFixture";

/**
 * `readHumanBone` reads a bone's record from the body's index of its rig: the
 * indexed object itself, or undefined for a bone the rig lacks.
 *
 * Scenarios, on an index of the stored rig's hips and left hand:
 *
 * 1. The hips' record is the indexed object.
 * 2. The left hand's record is the indexed object.
 * 3. A bone left out of the index reads undefined.
 */
export async function test_motions_body_read_human_bone(): Promise<void> {
  const stored: IHumanFixture = await humanFixture("m-average");
  const record = (name: AutoMovieHumanoidBone): IAutoMovieBone =>
    stored.skeleton.bones.find(
      (bone: IAutoMovieBone): boolean => bone.bone === name,
    )!;
  const hips: IAutoMovieBone = record("hips");
  const hand: IAutoMovieBone = record("leftHand");
  const body: Pick<IAutoMovieMotionHumanBody, "bones"> = {
    bones: new Map<AutoMovieHumanoidBone, IAutoMovieBone>([
      ["hips", hips],
      ["leftHand", hand],
    ]),
  };
  TestValidator.predicate("the hips", readHumanBone(body, "hips") === hips);
  TestValidator.predicate(
    "the left hand",
    readHumanBone(body, "leftHand") === hand,
  );
  TestValidator.equals(
    "a bone left out",
    readHumanBone(body, "rightHand"),
    undefined,
  );
}
