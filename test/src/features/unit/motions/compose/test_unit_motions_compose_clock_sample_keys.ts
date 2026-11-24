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
} from "../../../internal/fixtures";
import { nclose } from "../../../internal/nclose";

/**
 * Sampling selects the enclosing pair of authored keys in clip seconds.
 *
 * Scenarios:
 *
 * 1. A triangular elbow ramp rises for one second and falls for three.
 * 2. The same clock after the clip ends holds or wraps with its loop flag.
 */
export function test_unit_motions_compose_clock_sample_keys(): void {
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
/**
 * A prepared window reads through the clock it is given: the factory's fixed
 * timing, and an authored clock's own `linear`, `progress` and `envelope`.
 */
function nativeReplacements(): void {
  const clock: IAutoMovieMotionClock = C(8, [
    { name: "open", seconds: 2 },
    { name: "peak", seconds: 4 },
    { name: "close", seconds: 6 },
  ]);
  const rise: readonly [string, string] = ["open", "peak"];
  const fall: readonly [string, string] = ["peak", "close"];
  TestValidator.predicate(
    "the factory clock's fixed timing",
    nclose(C.prepare(clock, "open", "close").linear(3), 0.25, 0) &&
      nclose(C.prepare(clock, "open", "close").progress(3), 53 / 512, 0) &&
      nclose(C.prepareEnvelope(clock, rise, fall)(3), 0.5, 0),
  );
  const authored: IAutoMovieMotionClock = {
    ...clock,
    linear: (): number => 0.75,
    progress: (): number => 0.5,
    envelope: (): number => 0.25,
  };
  TestValidator.predicate(
    "an authored clock's own timing law",
    C.prepare(authored, "open", "close").linear(3) === 0.75 &&
      C.prepare(authored, "open", "close").progress(3) === 0.5 &&
      C.prepareEnvelope(authored, rise, fall)(3) === 0.25,
  );
}
