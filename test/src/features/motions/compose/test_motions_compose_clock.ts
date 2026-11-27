import { AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  IAutoMovieMotion,
  IAutoMovieMotionClock,
} from "@automovie/interface";
import {
  AutoMovieMotionClock,
  AutoMovieMotionClock as C
} from "../../../../../packages/motions/src/compose/internal/AutoMovieMotionClock";
import { TestValidator } from "@nestia/e2e";

import {
  joint,
  keyframe,
  makeMotion,
  makePose,
} from "../../internal/fixtures";
import { nclose } from "../../internal/nclose";

/**
 * Sampling selects the enclosing pair of authored keys in clip seconds.
 *
 * Scenarios:
 *
 * 1. A triangular elbow ramp rises for one second and falls for three.
 * 2. The same clock after the clip ends holds or wraps with its loop flag.
 */
function scenario_test_motions_compose_clock_sample_keys(): void {
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
    const sample = AutoMovieEngineMotionSampling.sampleMotion({ ...clip, loop }, seconds).pose;
    TestValidator.equals("target skeleton", sample.skeleton, clip.skeleton);
    TestValidator.predicate(
      `elbow at ${seconds}s, loop=${loop}`,
      nclose(sample.joints[0]?.flexion ?? NaN, expected, 1e-9),
    );
  }
  const zero = AutoMovieEngineMotionSampling.sampleMotion({ ...clip, duration: 0, loop: true }, 5);
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

/**
 * A prepared interval clamps action-local time and eases progress with the
 * minimum-jerk polynomial.
 *
 * Scenarios:
 *
 * 1. Query the same interval before, after and inside its window in
 *    nonchronological order.
 * 2. Check analytic progress velocity at an interior point and the constant
 *    exterior.
 * 3. Equal endpoints switch to the closed state at their shared instant.
 */
function scenario_test_motions_compose_clock_time_law(): void {
  const open: number = 2;
  const close: number = 6;
  const clock: IAutoMovieMotionClock = AutoMovieMotionClock(8, [
    { name: "open", seconds: open },
    { name: "close", seconds: close },
  ]);
  const window = AutoMovieMotionClock.prepare(clock, "open", "close");
  for (const t of [5, 1, 6, 3, 4, 8, 2, 3]) {
    const u: number = Math.min(1, Math.max(0, (t - open) / (close - open)));
    const progress: number = u ** 3 * (10 - 15 * u + 6 * u * u);
    TestValidator.predicate(
      "clamped linear and minimum-jerk progress at " + t,
      nclose(window.linear(t), u, 1e-12) &&
        nclose(window.progress(t), progress, 1e-12),
    );
    if (t === open || t === close) continue;
    const step: number = (close - open) * 1e-5;
    const slope: number =
      (window.progress(t + step) - window.progress(t - step)) / (2 * step);
    TestValidator.predicate(
      "minimum-jerk velocity at " + t,
      nclose(slope, (30 * u * u * (1 - u) ** 2) / (close - open), 1e-8),
    );
  }
  const point = AutoMovieMotionClock.prepare(clock, "open", "open");
  TestValidator.equals(
    "zero interval closes on its instant",
    [point.linear(open - 1), point.linear(open), point.linear(open + 1)],
    [0, 1, 1],
  );
}

/**
 * `AutoMovieMotionClock.prepare` and `prepareEnvelope` resolve a window's
 * instants once: the uniform share across the window, its minimum-jerk
 * progress, and an envelope that rises over one window and falls over another.
 *
 * A 2 s clock names `a` at 0.5 s and `b` at 1.5 s.
 *
 * Scenarios:
 *
 * 1. Across `a` to `b`, the share is 0 at and before `a`, one half at 1 s and 1 at
 *    and after `b`; the minimum-jerk progress is one half at 1 s too.
 * 2. Rising from `start` to `a` and falling from `b` to `end`, the envelope is 0
 *    at 0 s, 1 at 1 s and one half at 1.75 s.
 */
function scenario_test_motions_compose_motion_clock_window(): void {
  const clock: IAutoMovieMotionClock = AutoMovieMotionClock(2, [
    { name: "a", seconds: 0.5 },
    { name: "b", seconds: 1.5 },
  ]);

  // 1. The window.
  const window: ReturnType<typeof AutoMovieMotionClock.prepare> =
    AutoMovieMotionClock.prepare(clock, "a", "b");
  TestValidator.predicate(
    "the window's share and progress",
    window.linear(0.2) === 0 &&
      nclose(window.linear(1), 0.5, 1e-12) &&
      window.linear(1.8) === 1 &&
      nclose(window.progress(1), 0.5, 1e-12),
  );

  // 2. The envelope.
  const envelope: (seconds: number) => number =
    AutoMovieMotionClock.prepareEnvelope(clock, ["start", "a"], ["b", "end"]);
  TestValidator.predicate(
    "the envelope rises, holds and falls",
    envelope(0) === 0 &&
      nclose(envelope(1), 1, 1e-12) &&
      nclose(envelope(1.75), 0.5, 1e-12),
  );
}

/**
 * AutoMovieMotionClock, the time law a channel reads: its sample keys, its time
 * law and its window, each scenario below.
 */
export function test_motions_compose_clock(): void {
  scenario_test_motions_compose_clock_sample_keys();
  scenario_test_motions_compose_clock_time_law();
  scenario_test_motions_compose_motion_clock_window();
}
