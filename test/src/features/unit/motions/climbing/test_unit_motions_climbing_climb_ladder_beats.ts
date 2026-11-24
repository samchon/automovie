import { climbLadderBeats } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of a few sums, seconds. */
const ROUNDING: number = 1e-12;

/**
 * `climbLadderBeats` schedules a rung-ladder climb: both hands reach their
 * first rungs in one beat, then each rung takes four beats, one limb moving up
 * one rung at a time in the limb order; a limb's reading is the rung it holds
 * or moves to and its minimum-jerk progress there.
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
export function test_unit_motions_climbing_climb_ladder_beats(): void {
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
