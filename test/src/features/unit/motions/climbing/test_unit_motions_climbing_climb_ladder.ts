import type { IAutoMovieMotionHumanContactWindow } from "@automovie/interface";
import { climbLadderBeats, climbLadderContacts } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

namespace part_climb_ladder_beats {
  /** Rounding of a few sums, seconds. */
  const ROUNDING: number = 1e-12;

  /**
   * `climbLadderBeats` schedules a rung-ladder climb: both hands reach their
   * first rungs in one beat, then each rung takes four beats, one limb moving
   * up one rung at a time in the limb order; a limb's reading is the rung it
   * holds or moves to and its minimum-jerk progress there.
   *
   * Scenarios, half-second beats over two rungs, the hands starting on rung 3,
   * the order right hand, left foot, left hand, right foot:
   *
   * 1. The climb lasts 0.5 (2 + 2 x 4) = 5 s; the hands are on at 0.5 s; the right
   *    hand moves 0.5 to 1 s and 2.5 to 3 s, the left foot lands its first rung
   *    at 1.5 s.
   * 2. Half way through its first move the right hand reads rung 4 at progress one
   *    half, moving; at 1.2 s it holds rung 4; the left foot holds the floor,
   *    rung 0, at 0.2 s.
   * 3. The hands' reach runs from 0 at the start to 1 at the hands-on beat.
   */
  export function verify(): void {
    const beats: climbLadderBeats.IBeats = climbLadderBeats.prepare(0.5, 2, 3, [
      "rightHand",
      "leftFoot",
      "leftHand",
      "rightFoot",
    ]);
    TestValidator.equals(
      "the schedule",
      [
        beats.duration,
        beats.clock.at("handsOn"),
        beats.moves.rightHand,
        beats.clock.at("leftFootContact1"),
      ],
      [
        5,
        0.5,
        [
          { n: 1, from: 0.5, to: 1 },
          { n: 2, from: 2.5, to: 3 },
        ],
        1.5,
      ],
    );
    const moving: climbLadderBeats.IReading = beats.level("rightHand", 0.75);
    TestValidator.predicate(
      "the readings",
      moving.index === 4 &&
        nclose(moving.u, 0.5, ROUNDING) &&
        moving.moving &&
        JSON.stringify(beats.level("rightHand", 1.2)) ===
          JSON.stringify({ index: 4, u: 1, moving: false }) &&
        beats.level("leftFoot", 0.2).index === 0 &&
        beats.nextMove("rightHand", 1.2) === 1,
    );
    TestValidator.predicate(
      "the reach",
      nclose(beats.reaching(0), 0, ROUNDING) &&
        nclose(beats.reaching(0.5), 1, ROUNDING),
    );
  }
}

namespace part_climb_ladder_contacts {
  /**
   * `climbLadderContacts` plants each limb on a ladder between its moves: a
   * hand grips from the first beat (when it first takes a rung) to each move's
   * start and from each move's end on, a foot bears on the ground until its
   * first move and on the ladder after, every window a share of the climb.
   *
   * Scenarios, a 4 s climb of `ladder` with 0.5 s beats, the right hand moving
   * from 1 to 1.5 s and the right foot from 2 to 2.5 s:
   *
   * 1. The right hand grips the ladder from 0.125 to 0.25 and from 0.375 to the
   *    end.
   * 2. The right foot bears on the ground until 0.5, on the ladder from 0.625.
   * 3. A limb that never moves holds the whole climb, a hand from its beat.
   */
  export function verify(): void {
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
}

/**
 * `climbLadder`'s unit contract: its beats, contacts and access rails.
 *
 * Its parts, each documented with its own scenarios:
 *
 * - `climb_ladder_beats`: `climbLadderBeats` schedules a rung-ladder climb:
 * - `climb_ladder_contacts`: `climbLadderContacts` plants each limb on a ladder
 *   between its moves:
 */
export async function test_unit_motions_climbing_climb_ladder(): Promise<void> {
  part_climb_ladder_beats.verify();
  part_climb_ladder_contacts.verify();
}
