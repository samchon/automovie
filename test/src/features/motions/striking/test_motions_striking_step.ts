import type { IAutoMovieMotionHumanContactWindow } from "@automovie/interface";
import {
  step
} from "../../../../../packages/motions/src/striking/internal/step";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Additions and divisions forming unit shares round by at most four ulps. */
const CONTACT_ROUNDING_SHARE: number = 4 * Number.EPSILON;

/** A placed foot has stationary intervals in film order. */
function windows(
  contacts: readonly IAutoMovieMotionHumanContactWindow[],
  part: "leftFoot" | "rightFoot",
): readonly (readonly [number, number])[] {
  return contacts
    .filter((contact: IAutoMovieMotionHumanContactWindow): boolean => contact.part === part)
    .map((contact: IAutoMovieMotionHumanContactWindow): readonly [number, number] => [contact.from, contact.to]);
}

/** Published windows retain their order and endpoints. */
function match(
  actual: readonly (readonly [number, number])[],
  expected: readonly (readonly [number, number])[],
): boolean {
  return actual.length === expected.length && actual.every(
    ([from, to], i: number): boolean =>
      nclose(from, expected[i]![0], CONTACT_ROUNDING_SHARE) &&
      nclose(to, expected[i]![1], CONTACT_ROUNDING_SHARE),
  );
}

/**
 * Straight footwork publishes the stationary portions of its left and right
 * swing windows. An action that enters over an airborne foot continues its
 * landing before it lifts the foot that was still bearing.
 *
 * Scenarios:
 *
 * 1. Over two regular beats, the first foot's swing occupies `[0, 0.5]` within
 *    each beat and the follower's occupies `[0.45, 0.95]`. The stationary
 *    intervals are their complements, expressed in shares of two beats.
 * 2. At a cut with the right foot bearing, the left lands at half of the
 *    opening beat before the right lifts. The left has no initial plant. The
 *    right leads the second beat, so its opening and regular swings differ.
 */
export function test_motions_striking_step(): void {
  const fresh: step.IPlants = step.supportWindows("left", 2);
  TestValidator.predicate(
    "regular stationary intervals",
    match(windows(fresh.contacts, "leftFoot"), [[0, 0], [0.25, 0.5], [0.75, 1]]) &&
      match(windows(fresh.contacts, "rightFoot"), [[0, 0.225], [0.475, 0.725], [0.975, 1]]),
  );

  const inherited: step.IPlants = step.supportWindows("right", 2, {
    bearing: "right",
    landings: {
      left: {
        ankle: { x: 0, y: 0.1, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
      },
    },
  });
  TestValidator.predicate(
    "the already airborne foot lands first",
    match(windows(inherited.contacts, "leftFoot"), [[0.25, 0.725], [0.975, 1]]) &&
      match(windows(inherited.contacts, "rightFoot"), [[0, 0.25], [0.475, 0.5], [0.75, 1]]) &&
      inherited.contacts.every(
        (contact: IAutoMovieMotionHumanContactWindow): boolean => contact.kind === "plant" && contact.support?.kind === "ground",
      ),
  );
}
