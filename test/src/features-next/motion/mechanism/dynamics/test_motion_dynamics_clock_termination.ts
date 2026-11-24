import {
  Quaternion,
  createAutoMovieRandom,
  deriveAutoMovieSeed,
  followPathMotion,
  resolvePose,
  sampleTimes,
  windowSampleTimes,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { AutoMovieMotionHumanConversation } from "@automovie/motions";
import {
  AutoMovieMotionHumanAuditMotion,
  HumanFreedomChoice,
  HumanWater,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { createValidMotion } from "../../../../features/internal/fixtures";
import { motionHumanBody } from "../../../../features/internal/motionHumanBody";
import { nclose } from "../../../../features/internal/nclose";
import { throwsError } from "../../../../features/internal/throwsError";

/**
 * An endpoint-inclusive clock terminates on a fractional last step.
 *
 * Scenarios:
 * 1. Evaluate the operation at the interior and the limiting case.
 *
 * @evidence contracts/development/testing.md#behavioral-verification An endpoint-inclusive clock terminates on a fractional last step.
 * @evidence contracts/development/testing.md#independent-expectations A tenth of a second contains two full 24 Hz steps and a final clipped step; zero span has no positive increment.
 * @evidence contracts/development/testing.md#distinguishing-cases The boundary outcome distinguishes physical change from normalization.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_dynamics_clock_termination(): void {
  for (const [side, sign] of [
    ["left", -1],
    ["right", 1],
  ] as const)
    TestValidator.equals(
      "turn enumeration terminates with one antipode",
      HumanFreedomChoice.turns(45, side),
      [
        0,
        sign * 45,
        -sign * 45,
        sign * 90,
        -sign * 90,
        sign * 135,
        -sign * 135,
        180,
      ],
    );
  for (const step of [0, -15, NaN, 1e-300])
    TestValidator.predicate(
      "nonadvancing turn spacing refused",
      throwsError(() => HumanFreedomChoice.turns(step, "right")),
    );
  TestValidator.equals(
    "infinite spacing leaves only zero",
    HumanFreedomChoice.turns(Infinity, "right"),
    [0],
  );
  const gaze = (from: number) =>
    AutoMovieMotionHumanConversation.gaze({
      subject: "a",
      partner: "b",
      turns: [{ speaker: "a", from, to: 30 }],
      random: createAutoMovieRandom(deriveAutoMovieSeed("talk", "0")),
      eyes: 1.6,
    });
  TestValidator.predicate(
    "glance clock starts at a valid turn boundary",
    throwsError(() => gaze(-1)) &&
      throwsError(() => gaze(-Infinity)) &&
      gaze(0)[0]?.from === 0 &&
      gaze(0)[0]?.target.kind === "person",
  );
  const body = motionHumanBody("m-average");
  const rotation = Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 90);
  const bones = new Map(
    resolvePose(
      { skeleton: body.skeleton.id, root: null, joints: [] },
      body.skeleton,
    ).map(
      (b) =>
        [
          b.bone,
          {
            ...b,
            worldPosition: Quaternion.rotateVector(rotation, b.worldPosition),
            worldRotation: Quaternion.multiply(rotation, b.worldRotation),
          },
        ] as const,
    ),
  );
  const high = 2 ** 34;
  const low = HumanWater.float(body, bones, { surface: 0 }),
    raised = HumanWater.float(body, bones, { surface: high });
  TestValidator.predicate(
    "float search terminates when surface ULP exceeds tolerance",
    low === null
      ? raised === null
      : raised !== null && nclose(raised, high + low, 1e-6 + 4 * 2 ** -18),
  );
  const gait = { ...createValidMotion(), loop: true };
  const walk = (waypoints: IAutoMovieVector3[]) =>
    followPathMotion({ id: "path", gait, waypoints, speed: 1 });
  const start: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const end: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };
  TestValidator.predicate(
    "one waypoint cannot supply a path",
    throwsError(() => walk([start])),
  );
  TestValidator.predicate(
    "nonfinite waypoint cannot supply an interval",
    throwsError(() => walk([start, { ...end, x: NaN }])),
  );
  TestValidator.predicate(
    "coincident endpoints have no direction",
    throwsError(() => walk([start, start])),
  );
  TestValidator.predicate(
    "one metre at one metre per second",
    nclose(walk([start, end]).motion.duration, 1),
  );
  const times: number[] = windowSampleTimes(3, 3.1, 24);
  TestValidator.predicate(
    "actual terminal instant",
    times.length === 4 &&
      nclose(times[3]!, 3.1, 0) &&
      times.every(
        (time: number, i: number): boolean => i === 0 || time > times[i - 1]!,
      ),
  );
  const zero: number[] = sampleTimes(0, 24);
  TestValidator.predicate(
    "zero duration stays at its endpoint",
    zero.length > 0 && zero.every((time: number): boolean => time === 0),
  );
  TestValidator.predicate(
    "nonadvancing rate refused",
    throwsError(() => AutoMovieMotionHumanAuditMotion.grid(0, 1, 0)),
  );
}
