import {
  StrikingQuality
} from "../../../../../packages/motions/src/striking/internal/StrikingQuality";
import {
  punchReach
} from "../../../../../packages/motions/src/striking/internal/punchReach";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * A strike's quality helpers: the fist's depth from the hand's length, which
 * accuracies stop on the struck body, and whether two punch reaches are the
 * same solve.
 *
 * Scenarios:
 *
 * 1. The fist is 0.23 of the hand: 0.046 m for a 0.2 m hand.
 * 2. A hit and an unset accuracy stop; a graze and a miss do not.
 * 3. Two reaches with equal advance, wrist and elbow are the same; another advance
 *    is not.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines virtual hand depth, contact-stop categories and equality of solved reach records.
 * @evidence contracts/development/testing.md#behavioral-verification Reads depth for a fixed hand length, enumerates simulated contact labels and compares reach records that differ only in advance.
 * @evidence contracts/development/testing.md#independent-expectations The declared factor 0.23 gives 0.046 m at length 0.2. Hit and unset allow the stop, and changing advance alone breaks equality.
 */
export function test_motions_striking_quality(): void {
  TestValidator.predicate(
    "the fist's depth",
    nclose(StrikingQuality.fist(0.2), 0.046, 1e-12),
  );
  TestValidator.equals(
    "which accuracies stop",
    [
      StrikingQuality.stops("hit"),
      StrikingQuality.stops(undefined),
      StrikingQuality.stops("graze"),
      StrikingQuality.stops("miss"),
    ],
    [true, true, false, false],
  );
  const reach: punchReach.ISame = {
    advance: 0.3,
    solved: {
      end: { x: 0.1, y: 1.4, z: 0.5 },
      middle: { x: 0.2, y: 1.3, z: 0.2 },
    },
  };
  TestValidator.predicate(
    "the same solve, and another advance",
    punchReach.same(reach, {
      advance: 0.3,
      solved: { ...reach.solved },
    }) && !punchReach.same(reach, { ...reach, advance: 0.31 }),
  );
}
