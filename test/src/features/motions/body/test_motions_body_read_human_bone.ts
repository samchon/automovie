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
 * Check direct lookup of a human bone by its index key.
 *
 * Scenarios:
 *
 * 1. Look up the stored hips and left hand and receive their indexed objects.
 * 2. Read a bone absent from the fixture's index and receive `undefined` .
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases specify identity-preserving lookup and absence.
 * @evidence contracts/development/testing.md#behavioral-verification The lookup uses a map of actual fixture rig records.
 * @evidence contracts/development/testing.md#independent-expectations Expected object references come directly from the fixture's map entries.
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
