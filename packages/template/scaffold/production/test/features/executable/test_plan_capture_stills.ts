import { TestValidator } from "@nestia/e2e";

import { planCaptureStills } from "../../../src/executable/planCaptureStills";

/**
 * Pin the stills a capture draws for one interval.
 *
 * Scenarios:
 * 1. A 10-second interval at the default rate yields 50 frames, one every sixth
 *    frame at 30 fps, and at the maximum rate 100 frames, one every third.
 * 2. An event adds the off-grid frames of its one-second window at 10 per
 *    second; an event outside the interval adds nothing.
 * 3. A 24 fps film keeps 50 frames four or five frames apart although 5 per
 *    second falls between frames.
 * 4. Invalid fps, intervals, rates and events throw.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The comment lists the four scenarios and the counts and frame spacing each pins.
 * @evidence contracts/development/testing.md#behavioral-verification Calls planCaptureStills, which the capture command uses, and compares whole planned second lists or their counts and grid membership; a summed step that drifts, a missing event window, a repeat, a sample at the interval end or a silently clamped request fails.
 * @evidence contracts/development/testing.md#independent-expectations Expected frames are written from arithmetic on the literal inputs: 60 s is frame 1800 at 30 fps, 5 per second is every sixth frame, and the window of an event at 64 s spans frames 1905 to 1935 every third frame, six of which are off the default grid.
 * @evidence contracts/development/testing.md#distinguishing-cases Default and maximum rates, an inside and an outside event, a frame rate the sampling rate does not divide, and each refused input distinguish sampling, alignment and validation; capture and sheet layout belong to running the command against a Viewer.
 * @evidence contracts/development/testing.md#execution-ownership A pure unit test with in-memory numbers, discovered by test/index.ts as an exported test_ function; it starts no Viewer, browser or render.
 */
export function test_plan_capture_stills(): void {
  const segment = { fps: 30, durationSeconds: 180, start: 60, end: 70 };
  TestValidator.equals(
    "default rate",
    planCaptureStills(segment),
    Array.from(
      { length: 50 },
      (_: unknown, i: number): number => (1800 + 6 * i) / 30,
    ),
  );
  TestValidator.equals(
    "maximum rate",
    planCaptureStills({ ...segment, rate: 10 }),
    Array.from(
      { length: 100 },
      (_: unknown, i: number): number => (1800 + 3 * i) / 30,
    ),
  );

  const withEvent: number[] = planCaptureStills({ ...segment, events: [64] });
  TestValidator.equals("event window count", withEvent.length, 56);
  for (const frame of [1905, 1911, 1917, 1923, 1929, 1935])
    TestValidator.predicate(
      `event frame ${frame}`,
      withEvent.includes(frame / 30),
    );
  TestValidator.equals(
    "outside event",
    planCaptureStills({ ...segment, events: [75] }).length,
    50,
  );

  const film24: number[] = planCaptureStills({ ...segment, fps: 24 });
  TestValidator.equals("24 fps count", film24.length, 50);
  TestValidator.predicate(
    "24 fps frame spacing",
    film24.every(
      (seconds: number, i: number): boolean =>
        i === 0 || [4, 5].includes(Math.round((seconds - film24[i - 1]!) * 24)),
    ),
  );

  for (const [label, request] of [
    ["zero fps", { ...segment, fps: 0 }],
    ["empty interval", { ...segment, end: 60 }],
    ["negative start", { ...segment, start: -1 }],
    ["end past film", { ...segment, end: 181 }],
    ["zero rate", { ...segment, rate: 0 }],
    ["rate above ten", { ...segment, rate: 10.5 }],
    ["nonfinite event", { ...segment, events: [NaN] }],
  ] as const)
    TestValidator.error(label, (): number[] => planCaptureStills(request));
}
