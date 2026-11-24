import { sampleMotion } from "@automovie/engine";
import type {
  IAutoMovieMotion,
  IAutoMovieMotionClock,
} from "@automovie/interface";
import { AutoMovieMotionClock as C } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import {
  joint,
  keyframe,
  makeMotion,
  makePose,
} from "../../../../features/internal/fixtures";
import { nclose } from "../../../../features/internal/nclose";

/**
 * Sampling selects the enclosing pair of authored keys in clip seconds.
 *
 * Scenarios:
 * 1. A triangular elbow ramp rises for one second and falls for three.
 * 2. The same clock after the clip ends holds or wraps with its loop flag.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the elbow angle from the sampled pose.
 * @evidence contracts/development/testing.md#independent-expectations The first segment rises at 60 degrees per second and the second falls at 20.
 * @evidence contracts/development/testing.md#distinguishing-cases At five seconds the held elbow rests while the looping elbow reaches its peak.
 * @evidence contracts/development/testing.md#execution-ownership Calls the public sampler with an in-memory clip.
 * @evidence contracts/development/common.md#meaningful-documentation Gives the shape and the clock boundary.
 */
export function test_motion_dynamics_sample_keys(): void {
  const clip: IAutoMovieMotion = makeMotion(
    [
      keyframe(0, makePose([joint("leftLowerArm", { flexion: 0 })])),
      keyframe(1, makePose([joint("leftLowerArm", { flexion: 60 })])),
      keyframe(4, makePose([joint("leftLowerArm", { flexion: 0 })])),
    ],
    4,
    false,
  );
  for (const [seconds, loop, expected] of [
    [-1, false, 0],
    [0.5, false, 30],
    [1, false, 60],
    [2, false, 40],
    [5, false, 0],
    [5, true, 60],
    [1, false, 60],
    [-1, true, 20],
  ] as const) {
    const sample = sampleMotion({ ...clip, loop }, seconds).pose;
    TestValidator.equals("target skeleton", sample.skeleton, clip.skeleton);
    TestValidator.predicate(
      `elbow at ${seconds}s, loop=${loop}`,
      nclose(sample.joints[0]?.flexion ?? NaN, expected, 1e-9),
    );
  }
  const zero = sampleMotion({ ...clip, duration: 0, loop: true }, 5);
  TestValidator.predicate(
    "a zero-duration clip holds its entry",
    nclose(zero.pose.joints[0]?.flexion ?? NaN, 0, 0),
  );
  nativeReplacements();
}
/** A prepared interval forwards later replacements on its own native clock. */
function nativeReplacements(): void {
  const clock: IAutoMovieMotionClock = C.of(8, [
    { name: "open", seconds: 2 },
    { name: "peak", seconds: 4 },
    { name: "close", seconds: 6 },
  ]);
  const rise: readonly [string, string] = ["open", "peak"];
  const fall: readonly [string, string] = ["peak", "close"];
  const interval: ReturnType<typeof C.prepare> = C.prepare(
    clock,
    "open",
    "close",
  );
  const envelope: ReturnType<typeof C.prepareEnvelope> = C.prepareEnvelope(
    clock,
    rise,
    fall,
  );
  const originalLinear: IAutoMovieMotionClock["linear"] = clock.linear;
  clock.at = (): number => {
    throw new Error("replaced public at");
  };

  TestValidator.predicate(
    "original factory callbacks keep fixed timing with a replaced public at",
    nclose(interval.linear(3), 0.25, 0) &&
      nclose(interval.progress(3), 53 / 512, 0) &&
      nclose(envelope(3), 0.5, 0),
  );

  clock.linear = function (
    this: IAutoMovieMotionClock,
    from: string,
    to: string,
    seconds: number,
  ): number {
    TestValidator.predicate(
      "replacement linear receives its factory clock and window",
      this === clock && from === "open" && to === "close" && seconds === 3,
    );
    return 0.75;
  };
  clock.envelope = function (
    this: IAutoMovieMotionClock,
    up: readonly [string, string],
    down: readonly [string, string],
    seconds: number,
  ): number {
    TestValidator.predicate(
      "replacement envelope receives its factory clock and windows",
      this === clock &&
        up[0] === "open" &&
        up[1] === "peak" &&
        down[0] === "peak" &&
        down[1] === "close" &&
        seconds === 3,
    );
    return 0.25;
  };
  TestValidator.predicate(
    "each sample follows its own callback after native intervals are resolved",
    nclose(interval.linear(3), 0.75, 0) &&
      nclose(interval.progress(3), 53 / 512, 0) &&
      nclose(envelope(3), 0.25, 0),
  );
  clock.progress = (): number => 0.5;
  clock.linear = originalLinear;
  TestValidator.predicate(
    "restored linear and replaced progress each follow the current callback",
    nclose(interval.linear(3), 0.25, 0) && nclose(interval.progress(3), 0.5, 0),
  );
}
