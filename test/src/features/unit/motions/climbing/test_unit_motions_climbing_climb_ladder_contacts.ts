import type { IAutoMovieMotionHumanContactWindow } from "@automovie/interface";
import { climbLadderContacts } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `climbLadderContacts` plants each limb on a ladder between its moves: a hand
 * grips from the first beat (when it first takes a rung) to each move's start
 * and from each move's end on, a foot bears on the ground until its first move
 * and on the ladder after, every window a share of the climb.
 *
 * Scenarios, a 4 s climb of `ladder` with 0.5 s beats, the right hand moving
 * from 1 to 1.5 s and the right foot from 2 to 2.5 s:
 *
 * 1. The right hand grips the ladder from 0.125 to 0.25 and from 0.375 to the
 *    end.
 * 2. The right foot bears on the ground until 0.5, on the ladder from 0.625.
 * 3. A limb that never moves holds the whole climb, a hand from its beat.
 */
export function test_unit_motions_climbing_climb_ladder_contacts(): void {
  const windows: IAutoMovieMotionHumanContactWindow[] = climbLadderContacts(
    {
      leftHand: [],
      rightHand: [{ n: 1, from: 1, to: 1.5 }],
      leftFoot: [],
      rightFoot: [{ n: 1, from: 2, to: 2.5 }],
    },
    ["rightHand", "rightFoot", "leftHand", "leftFoot"],
    0.5,
    4,
    "ladder",
  );
  TestValidator.equals(
    "the windows",
    windows.map((w: IAutoMovieMotionHumanContactWindow): unknown[] => [
      w.part,
      w.kind,
      w.from,
      w.to,
      w.support.kind,
    ]),
    [
      ["rightHand", "grip", 0.125, 0.25, "prop"],
      ["rightHand", "grip", 0.375, 1, "prop"],
      ["rightFoot", "plant", 0, 0.5, "ground"],
      ["rightFoot", "plant", 0.625, 1, "prop"],
      ["leftHand", "grip", 0.125, 1, "prop"],
      ["leftFoot", "plant", 0, 1, "ground"],
    ],
  );
}
