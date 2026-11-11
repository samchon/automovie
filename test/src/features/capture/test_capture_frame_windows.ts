import {
  type IAutoMovieCaptureTime,
  planAutoMovieCaptureFrames,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * Around every event and cut a capture plans the subject's own consecutive frames at its frame rate, merged once each with the even samples in time order, for a drawn scene and a video file alike.
 *
 * Scenarios:
 *
 * 1. A 30 fps subject of four seconds sampled at 5 per second with one event at 2.0 s and a window of 3 frames plans frames 57 to 63 each once, merged in order with the even samples every 6 frames, and records the window unclipped.
 * 2. An event at 0.05 s and one at 3.98 s are cut at frame 0 and frame 119, and the windows say they were clipped.
 * 3. Two cuts at 1.0 s and 2.5 s plan the frames around both, recorded as `cut` windows after the events.
 * 4. No cut plans no cut window, and a window of 0 plans only the frame nearest the event.
 * 5. Explicit seconds keep an off-grid second without a frame and an on-grid second as its frame.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Plans times through the public planner and reads the frame indices and windows; a planner that sampled events at a fixed fraction of a second, repeated a frame, left the frames out of order or let a window leave the subject fails.
 * @evidence contracts/development/testing.md#independent-expectations Frames are seconds times 30 worked by hand: 2.0 s is frame 60, so a window of 3 is 57 to 63; the subject's last frame is 4 × 30 - 1 = 119; even samples at 5 per second fall every 6 frames.
 * @evidence contracts/development/testing.md#distinguishing-cases An interior event against events at both bounds, cuts against none, a zero window, and on-grid against off-grid explicit seconds. Refusals of instants outside the subject are owned by `test_capture_plan_refusals`.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_capture_frame_windows`; it plans in memory.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_capture_frame_windows(): void {
  const frames: (times: IAutoMovieCaptureTime[]) => (number | null)[] = (
    times: IAutoMovieCaptureTime[],
  ): (number | null)[] => times.map((time: IAutoMovieCaptureTime): number | null => time.frame);
  const even: { kind: "even"; from: number; to: number | null; rate: number } = {
    kind: "even",
    from: 0,
    to: null,
    rate: 5,
  };

  // 1. One event inside the subject.
  const event: ReturnType<typeof planAutoMovieCaptureFrames> = planAutoMovieCaptureFrames({
    durationSeconds: 4,
    fps: 30,
    sampling: even,
    events: [2],
    cuts: [],
    window: 3,
  });
  const sampled: number[] = Array.from({ length: 20 }, (_: unknown, index: number): number => index * 6);
  TestValidator.equals(
    "frames 57 to 63 merge once with the samples",
    frames(event.times),
    [...new Set([...sampled, 57, 58, 59, 60, 61, 62, 63])].sort((a: number, b: number): number => a - b),
  );
  TestValidator.equals("the window is recorded", event.windows, [
    { kind: "event", seconds: 2, frame: 60, first: 57, last: 63, clipped: false },
  ]);

  // 2. Events at the bounds.
  const bounds: ReturnType<typeof planAutoMovieCaptureFrames> = planAutoMovieCaptureFrames({
    durationSeconds: 4,
    fps: 30,
    sampling: { kind: "at", seconds: [1] },
    events: [0.05, 3.98],
    cuts: [],
    window: 3,
  });
  TestValidator.equals("windows are cut at the bounds", bounds.windows, [
    { kind: "event", seconds: 0.05, frame: 2, first: 0, last: 5, clipped: true },
    { kind: "event", seconds: 3.98, frame: 119, first: 116, last: 119, clipped: true },
  ]);
  TestValidator.equals(
    "no frame lies outside the subject",
    frames(bounds.times),
    [0, 1, 2, 3, 4, 5, 30, 116, 117, 118, 119],
  );

  // 3. Two cuts.
  const cut: ReturnType<typeof planAutoMovieCaptureFrames> = planAutoMovieCaptureFrames({
    durationSeconds: 4,
    fps: 30,
    sampling: { kind: "at", seconds: [0] },
    events: [],
    cuts: [1, 2.5],
    window: 1,
  });
  TestValidator.equals("frames around both cuts", frames(cut.times), [0, 29, 30, 31, 74, 75, 76]);
  TestValidator.equals(
    "cut windows are recorded",
    cut.windows.map((window: { kind: string; frame: number }): [string, number] => [window.kind, window.frame]),
    [
      ["cut", 30],
      ["cut", 75],
    ],
  );

  // 4. No cut, and a zero window.
  const none: ReturnType<typeof planAutoMovieCaptureFrames> = planAutoMovieCaptureFrames({
    durationSeconds: 4,
    fps: 30,
    sampling: { kind: "at", seconds: [0] },
    events: [2],
    cuts: [],
    window: 0,
  });
  TestValidator.equals("a zero window is the nearest frame", frames(none.times), [0, 60]);
  TestValidator.equals("no cut gives no cut window", none.windows.filter((window: { kind: string }): boolean => window.kind === "cut"), []);

  // 5. Explicit seconds.
  TestValidator.equals(
    "explicit seconds keep their frames or none",
    planAutoMovieCaptureFrames({
      durationSeconds: 4,
      fps: 30,
      sampling: { kind: "at", seconds: [1.01, 0.5] },
      events: [],
      cuts: [],
      window: 3,
    }).times,
    [
      { seconds: 0.5, frame: 15 },
      { seconds: 1.01, frame: null },
    ],
  );
}
