import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionClock,
  HumanFoot,
  climbStairsPelvis,
  climbStairsPlants,
  climbStairsToes,
  humanFootOffset,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixture } from "../../internal/fixtures/humanFixture";
import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

namespace part_climb_stairs_pelvis {
  /** Rounding of a few minimum-jerk products, metres. */
  const ROUNDING: number = 1e-9;

  /**
   * `climbStairsPelvis` is a stair climb's root: its height rises by each
   * step's riser from the step's toe-off to its tread contact on the clock's
   * own progress, and its ground point travels from one stance root to the next
   * by a minimum-jerk share between the middles of neighbouring tread contacts,
   * the first from the start and the last to the end.
   *
   * Scenarios, two steps over 3 s from (0, 0.9, 0) through (0, 1.07, 0.3) to
   * (0, 1.24, 0.6), toe-offs at 0.2 and 1.2 s and tread contacts at 1 and 2 s:
   *
   * 1. At 0 s the root stands on the first stance, and from 2 s on at the last
   *    one's height, at 3 s on the last stance.
   * 2. Between the first tread contact and the second toe-off, at 1.1 s, the root
   *    has risen the first riser to 1.07 m.
   * 3. Its ground point is half way between the first two stances at 1 s, the
   *    middle of its span from 0.5 s, half way to the first tread contact, to
   *    1.5 s, half way between the two.
   */
  export function verify(): void {
    const stance: IAutoMovieVector3[] = [
      { x: 0, y: 0.9, z: 0 },
      { x: 0, y: 1.07, z: 0.3 },
      { x: 0, y: 1.24, z: 0.6 },
    ];
    const root: (seconds: number) => IAutoMovieVector3 = climbStairsPelvis(
      stance,
      AutoMovieMotionClock(3, [
        { name: "toeOff1", seconds: 0.2 },
        { name: "treadContact1", seconds: 1 },
        { name: "toeOff2", seconds: 1.2 },
        { name: "treadContact2", seconds: 2 },
      ]),
      2,
      3,
    );
    TestValidator.predicate(
      "the ends",
      vclose(root(0), stance[0]!, ROUNDING) &&
        vclose(root(3), stance[2]!, ROUNDING) &&
        Math.abs(root(2.2).y - 1.24) < ROUNDING,
    );
    TestValidator.predicate(
      "the first riser",
      Math.abs(root(1.1).y - 1.07) < ROUNDING,
    );
    const half: IAutoMovieVector3 = root(1);
    TestValidator.predicate(
      "half way along",
      Math.abs(half.x) < ROUNDING && Math.abs(half.z - 0.15) < ROUNDING,
    );
  }
}

namespace part_climb_stairs_plants {
  /**
   * `climbStairsPlants` plants each foot of a stair climb between its swings:
   * from the tread contact that brings it to a print to the next toe-off that
   * leaves it, on the floor at level 0 and on the flight above it, a flight on
   * a named prop bearing on that prop.
   *
   * Scenarios, a 2 s climb (toe-off 0.2 s, tread contact 1 s) whose right foot
   * steps from the floor to level 1 of a flight of 0.17 m risers rising from
   * 0.05 m, the left foot staying on the floor:
   *
   * 1. The left foot bears on the floor over the whole climb.
   * 2. The right foot bears on the floor until 0.1 of the climb, then from 0.5 on
   *    the flight at 0.05 + 0.17 = 0.22 m.
   * 3. On a prop named `deck` the right foot's second plant bears on it.
   */
  export function verify(): void {
    const clock: IAutoMovieMotionClock = AutoMovieMotionClock(2, [
      { name: "toeOff1", seconds: 0.2 },
      { name: "treadContact1", seconds: 1 },
    ]);
    const prints: Parameters<typeof climbStairsPlants>[0] = {
      left: [{ print: { level: 0 }, step: 0 }],
      right: [
        { print: { level: 0 }, step: 0 },
        { print: { level: 1 }, step: 1 },
      ],
    };
    const fixed: IAutoMovieMotionHumanContactWindow[] = climbStairsPlants(
      prints,
      clock,
      2,
      { floor: 0.05, riser: 0.17, sign: 1 },
    );
    TestValidator.equals(
      "the plants",
      fixed.map((w: IAutoMovieMotionHumanContactWindow): unknown[] => [
        w.part,
        w.from,
        w.to,
        w.support,
      ]),
      [
        ["leftFoot", 0, 1, { kind: "ground" }],
        ["rightFoot", 0, 0.1, { kind: "ground" }],
        ["rightFoot", 0.5, 1, { kind: "ground", height: 0.05 + 0.17 }],
      ],
    );
    const carried: IAutoMovieMotionHumanContactWindow[] = climbStairsPlants(
      prints,
      clock,
      2,
      { floor: 0.05, riser: 0.17, sign: 1, on: "deck" },
    );
    TestValidator.equals("on a prop", carried[2]!.support, {
      kind: "prop",
      subject: "deck",
    });
  }
}

namespace part_climb_stairs_toes {
  /** Rounding of a pivot and its read-back, metres and degrees. */
  const ROUNDING: number = 1e-9;

  /**
   * `climbStairsToes` courses a stair climb's toe extension: the rocker's
   * heel-rise search runs at knots AutoKnots places, each foot's course split
   * at its own toe-offs and tread contacts; `place` pivots a scheduled foot
   * about its ball by the extension.
   *
   * Scenarios:
   *
   * 1. `place` with no extension keeps the scheduled foot; with 25 degrees it
   *    pitches the foot 25 degrees heel-up about its ball, which keeps its
   *    place.
   * 2. A one-step climb of 2 s (toe-off 0.2 s, tread contact 1 s), the right foot
   *    stepping, with a rocker whose extension is the hip's height in degrees
   *    and a frame whose hips stand at `10 t` for the right foot and `5 t` for
   *    the left: each course passes the exact extension at every second the
   *    rocker read, the climb's two ends among them, and the right foot's
   *    course also at its toe-off and tread contact, 0.2 and 1 s, where it is
   *    split.
   */
  export async function verify(): Promise<void> {
    const body: humanFootOffset.IBody = {
      rest: new Map<AutoMovieHumanoidBone, IAutoMovieVector3>([
        ["leftFoot", { x: 0.09, y: 0.08, z: 0 }],
        ["leftToes", { x: 0.09, y: 0.02, z: 0.13 }],
      ]),
      surfaces: (await humanFixture("m-average")).surfaces,
    };

    // 1. The placement.
    const scheduled: IAutoMovieMotionHumanFoot.IPlacement = {
      ankle: { x: 0.1, y: 0.25, z: 0.4 },
      rotation: HumanFoot.rotation(0, 0),
    };
    const raised: IAutoMovieMotionHumanFoot.IPlacement = climbStairsToes.place(
      body,
      "left",
      scheduled,
      25,
    );
    TestValidator.predicate(
      "no extension",
      climbStairsToes.place(body, "left", scheduled, 0) === scheduled,
    );
    TestValidator.predicate(
      "about the ball",
      nclose(HumanFoot.headingPitch(raised.rotation).pitch, -25, ROUNDING) &&
        vclose(
          HumanFoot.point(body, "left", "mtp", raised),
          HumanFoot.point(body, "left", "mtp", scheduled),
          ROUNDING,
        ),
    );

    // 2. The course.
    const standing: IAutoMovieMotionHumanPosture = {
      root: { x: 0, y: 0.9, z: 0 },
      yaw: 0,
      pitch: 0,
      roll: 0,
      joints: {},
      limbs: {},
    };
    const at: (y: number) => IAutoMovieVector3 = (
      y: number,
    ): IAutoMovieVector3 => ({ x: 0, y, z: 0 });
    const reads: number[] = [];
    const toes: ReturnType<typeof climbStairsToes> = climbStairsToes({
      duration: 2,
      clock: AutoMovieMotionClock(2, [
        { name: "toeOff1", seconds: 0.2 },
        { name: "treadContact1", seconds: 1 },
      ]),
      steps: [{ side: "right" }],
      frameAt: (
        posture: IAutoMovieMotionHumanPosture,
        seconds: number,
      ): climbStairsToes.IFrame => {
        reads.push(seconds);
        return {
          placed: posture,
          feet: {
            left: { placement: scheduled, planted: true },
            right: { placement: scheduled, planted: true },
          },
          root: posture.root,
          hips: { left: at(5 * seconds), right: at(10 * seconds) },
        };
      },
      rightLoad: (): number => 0.5,
      rock: (
        _side: "left" | "right",
        placement: IAutoMovieMotionHumanFoot.IPlacement,
        hip: IAutoMovieVector3,
      ): ReturnType<climbStairsToes.IScope["rock"]> => ({
        placement,
        flexion: hip.y,
      }),
      standing,
    });
    TestValidator.predicate(
      "exact at the knots",
      [0, 0.2, 1, 2].every((t: number): boolean =>
        reads.some((r: number): boolean => nclose(r, t, ROUNDING)),
      ) &&
        [0, 0.2, 1, 2].every((t: number): boolean =>
          nclose(toes.right(t)[0]!, 10 * t, ROUNDING),
        ) &&
        [0, 2].every((t: number): boolean =>
          nclose(toes.left(t)[0]!, 5 * t, ROUNDING),
        ),
    );
  }
}

/**
 * `climbStairs`'s unit contract: its plants, pelvis, toes, weight and rail
 * line.
 *
 * Its parts, each documented with its own scenarios:
 *
 * - `climb_stairs_pelvis`: `climbStairsPelvis` is a stair climb's root:
 * - `climb_stairs_plants`: `climbStairsPlants` plants each foot of a stair climb
 *   between its swings:
 * - `climb_stairs_toes`: `climbStairsToes` courses a stair climb's toe extension:
 */
export async function test_motions_terrain_climb_stairs(): Promise<void> {
  part_climb_stairs_pelvis.verify();
  part_climb_stairs_plants.verify();
  await part_climb_stairs_toes.verify();
}
