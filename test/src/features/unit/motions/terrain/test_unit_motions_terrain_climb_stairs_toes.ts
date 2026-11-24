import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionClock,
  HumanFoot,
  climbStairsToes,
  humanFootOffset,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixture } from "../../../internal/fixtures/humanFixture";
import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/** Rounding of a pivot and its read-back, metres and degrees. */
const ROUNDING: number = 1e-9;

/**
 * `climbStairsToes` courses a stair climb's toe extension: the rocker's
 * heel-rise search runs at knots AutoKnots places, each foot's course split at
 * its own toe-offs and tread contacts; `place` pivots a scheduled foot about
 * its ball by the extension.
 *
 * Scenarios:
 *
 * 1. `place` with no extension keeps the scheduled foot; with 25 degrees it
 *    pitches the foot 25 degrees heel-up about its ball, which keeps its
 *    place.
 * 2. A one-step climb of 2 s (toe-off 0.2 s, tread contact 1 s), the right foot
 *    stepping, with a rocker whose extension is the hip's height in degrees and
 *    a frame whose hips stand at `10 t` for the right foot and `5 t` for the
 *    left: each course passes the exact extension at every second the rocker
 *    read, the climb's two ends among them, and the right foot's course also at
 *    its toe-off and tread contact, 0.2 and 1 s, where it is split.
 */
export async function test_unit_motions_terrain_climb_stairs_toes(): Promise<void> {
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
