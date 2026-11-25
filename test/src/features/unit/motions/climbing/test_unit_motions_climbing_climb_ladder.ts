import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanFrame,
  climbLadderBeats,
  climbLadderContacts,
  ladderAccessRails,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

namespace part_climb_ladder_beats {
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
  export function run(): void {
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
   * `climbLadderContacts` plants each limb on a ladder between its moves: a hand
   * grips from the first beat (when it first takes a rung) to each move's start
   * and from each move's end on, a foot bears on the ground until its first move
   * and on the ladder after, every window a share of the climb.
   *
   * Scenarios, a 4 s climb of `ladder` with 0.5 s beats, the right hand moving
   * from 1 to 1.5 s and the right foot from 2 to 2.5 s:
   *
   * 1. The right hand grips the ladder from 0.125 to 0.25 and from 0.375 to the end.
   * 2. The right foot bears on the ground until 0.5, on the ladder from 0.625.
   * 3. A limb that never moves holds the whole climb, a hand from its beat.
   */
  export function run(): void {
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

namespace part_ladder_access_rails {
  /** Rounding of a few rotations, metres. */
  const ROUNDING: number = 1e-12;

  /**
   * `ladderAccessRails` reads a fixed ladder's two upright side rails: its `bar`
   * affordances named `...Rail`, each placed in the world, sorted to the
   * climber's left and right by its offset in the ladder's frame, and kept only
   * when its axis is within about 8 degrees of upright; either side missing gives
   * none.
   *
   * Scenarios, a ladder 2 m along +Z, the climber facing it from the origin, its
   * 1.8 m rails 0.25 m either side and 0.9 m up, gripped all but a 0.1 m
   * aperture:
   *
   * 1. The left rail stands at (0.25, 0.9, 2), upright, half 0.85 m long, and the
   *    right at (-0.25, 0.9, 2).
   * 2. A ladder whose right rail lies level, or that has no right rail, gives none.
   */
  export function run(): void {
    const upright: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
      { x: 0, y: 0, z: 1 },
      90,
    );
    const rail: (
      id: string,
      x: number,
      rotation: IAutoMovieQuaternion,
    ) => IAutoMovieAffordance = (
      id: string,
      x: number,
      rotation: IAutoMovieQuaternion,
    ): IAutoMovieAffordance => ({
      id,
      kind: "bar",
      frame: {
        translation: { x, y: 0.9, z: 0 },
        rotation,
        scale: { x: 1, y: 1, z: 1 },
      },
      extent: null,
      length: 1.8,
      aperture: 0.1,
    });
    const placed: IAutoMovieRigidTransform = {
      position: { x: 0, y: 0, z: 2 },
      rotation: Quaternion.identity(),
    };
    const ladder: (
      affordances: IAutoMovieAffordance[],
    ) => Parameters<typeof ladderAccessRails.read>[0] = (
      affordances: IAutoMovieAffordance[],
    ): Parameters<typeof ladderAccessRails.read>[0] => ({
      prop: { subject: "ladder", frame: placed, points: {}, affordances },
      frame: (): IAutoMovieRigidTransform => placed,
    });
    const frame: HumanFrame.IPrepared = HumanFrame.prepare({
      origin: { x: 0, y: 0, z: 0 },
      yaw: 0,
    });
    const pair: ladderAccessRails.IPair | undefined = ladderAccessRails.read(
      ladder([
        rail("leftRail", 0.25, upright),
        rail("rightRail", -0.25, upright),
        rail("rung1", 0, Quaternion.identity()),
      ]),
      frame,
      0,
    );
    const axis: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    TestValidator.predicate(
      "the rails",
      pair !== undefined &&
        pair.left.id === "leftRail" &&
        vclose(pair.left.center, { x: 0.25, y: 0.9, z: 2 }, ROUNDING) &&
        vclose(pair.left.axis, axis, ROUNDING) &&
        nclose(pair.left.half, 0.85, ROUNDING) &&
        vclose(pair.right.center, { x: -0.25, y: 0.9, z: 2 }, ROUNDING),
    );
    TestValidator.equals(
      "no pair",
      [
        ladderAccessRails.read(
          ladder([
            rail("leftRail", 0.25, upright),
            rail("rightRail", -0.25, Quaternion.identity()),
          ]),
          frame,
          0,
        ),
        ladderAccessRails.read(
          ladder([rail("leftRail", 0.25, upright)]),
          frame,
          0,
        ),
      ],
      [undefined, undefined],
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
 * - `ladder_access_rails`: `ladderAccessRails` reads a fixed ladder's two upright
 *   side rails:
 */
export async function test_unit_motions_climbing_climb_ladder(): Promise<void> {
  part_climb_ladder_beats.run();
  part_climb_ladder_contacts.run();
  part_ladder_access_rails.run();
}
