import type { IAutoMovieMotionHumanPosture } from "@automovie/interface";
import {
  AutoMovieMotionHumanTrunk
} from "../../../../../packages/motions/src/compose/internal/AutoMovieMotionHumanTrunk";
import {
  StrikingBlade
} from "../../../../../packages/motions/src/striking/internal/StrikingBlade";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Standing at the origin, the chest already turned 5 degrees. */
const POSTURE: IAutoMovieMotionHumanPosture = {
  root: { x: 0, y: 0, z: 0 },
  yaw: 0,
  pitch: 0,
  roll: 0,
  joints: { chest: [0, 0, 5] },
  limbs: {},
};

/**
 * A blade stroke's trunk turn (`StrikingBlade.turned`): the turn shared between
 * the chest and the spine by the trunk's chest share, added to what each
 * already holds; no turn leaves the posture as it is.
 *
 * Scenario: turned 20 degrees, the chest holds 5 plus its share of 20 and the
 * spine the rest; turned none, the posture is the same object.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Explains additive trunk rotation across chest and spine and zero-turn identity.
 * @evidence contracts/development/testing.md#behavioral-verification Turns an authored virtual posture by 20 degrees and zero using the same chest share.
 * @evidence contracts/development/testing.md#independent-expectations The chest keeps its existing 5 degrees plus its stated share, the spine receives the complement, and zero turn returns the original object.
 */
export function test_motions_striking_blade(): void {
  const turned = StrikingBlade.turned(POSTURE, 20);
  const chest: number = AutoMovieMotionHumanTrunk.CHEST;
  TestValidator.predicate(
    "the turn",
    nclose(turned.joints.chest![2], 5 + 20 * chest, 1e-12) &&
      nclose(turned.joints.spine![2], 20 * (1 - chest), 1e-12) &&
      StrikingBlade.turned(POSTURE, 0) === POSTURE,
  );
}
