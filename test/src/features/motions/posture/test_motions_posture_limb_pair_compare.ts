import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieHumanPostureRotation,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  compareHumanLimbPair
} from "../../../../../packages/motions/src/posture/internal/compareHumanLimbPair";
import {
  createHumanPostureRotation
} from "../../../../../packages/motions/src/posture/internal/createHumanPostureRotation";
import { TestValidator } from "@nestia/e2e";

import { IDENTITY_TRANSFORM } from "../../internal/IDENTITY_TRANSFORM";
import { joint } from "../../internal/joint";
import { makePose } from "../../internal/makePose";

/** A pair of arm goals with the left hand at a height. */
function goals(
  height: number,
): Record<AutoMovieHumanSide, IAutoMovieHumanLimbGoal> {
  return {
    left: {
      point: { x: 0.3, y: height, z: 0.2 },
      bend: { x: 0.4, y: 1, z: 0 },
    },
    right: { point: { x: -0.3, y: 1, z: 0.2 }, bend: { x: -0.4, y: 1, z: 0 } },
  };
}

/**
 * `compareHumanLimbPair` orders a paired-arm problem against its mirror image
 * by one complete key, compared as a string: the root, the joints sorted by
 * name with each angle or null, the left goal, the right goal; 0 for equal
 * keys, −1 where the original's key is the lesser, 1 where it is the greater.
 * `createHumanPostureRotation` copies a turn into fresh records.
 *
 * Scenarios:
 *
 * 1. A pose against the same pose with its joints listed in another order and the
 *    same goals: 0.
 * 2. Differing only in the left hand's height, 1 against 2: −1, and reversed 1.
 * 3. Differing in the root: ordered by the root before the joints.
 * 4. A rotation's records are fresh and equal.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines deterministic ordering of paired limb inputs and fresh identity for rotation records.
 * @evidence contracts/development/testing.md#behavioral-verification Compares equivalent reordered joints, reversed goal heights and differing roots, and creates two rotation records.
 * @evidence contracts/development/testing.md#independent-expectations Sorted joint names make insertion order irrelevant. Goal heights 1 and 2 give opposite comparison signs, while root precedence and new record identity follow independently.
 */
export function test_motions_posture_limb_pair_compare(): void {
  const root: IAutoMovieTransform = {
    ...IDENTITY_TRANSFORM,
    translation: { x: 0, y: 0.9, z: 0 },
  };
  const pose: IAutoMoviePose = makePose(
    [joint("spine", { flexion: 5 }), joint("chest", { twist: 3 })],
    root,
  );
  const reordered: IAutoMoviePose = makePose([...pose.joints].reverse(), root);

  // 1. Equal keys.
  TestValidator.equals(
    "the joint order does not count",
    compareHumanLimbPair(pose, goals(1), reordered, goals(1)),
    0,
  );

  // 2. The goals.
  TestValidator.equals(
    "ordered by the goals",
    [
      compareHumanLimbPair(pose, goals(1), pose, goals(2)),
      compareHumanLimbPair(pose, goals(2), pose, goals(1)),
    ],
    [-1, 1],
  );

  // 3. The root first.
  TestValidator.equals(
    "the root before the goals",
    compareHumanLimbPair(
      { ...pose, root: { ...root, translation: { x: 1, y: 0.9, z: 0 } } },
      goals(1),
      pose,
      goals(2),
    ),
    1,
  );

  // 4. A rotation.
  const about: IAutoMovieVector3 = { x: 1, y: 2, z: 3 };
  const turn: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  const rotation: IAutoMovieHumanPostureRotation = createHumanPostureRotation(
    about,
    turn,
  );
  TestValidator.predicate(
    "fresh equal records",
    rotation.about !== about &&
      rotation.turn !== turn &&
      JSON.stringify(rotation) === JSON.stringify({ about, turn }),
  );
}
