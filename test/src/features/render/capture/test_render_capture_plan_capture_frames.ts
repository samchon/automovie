import type {
  IAutoMovieCaptureFramePlanProps,
  IAutoMovieCaptureTime,
} from "@automovie/interface";
import { AutoMovieRenderCapture } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/predicates";

/**
 * Around every event and cut a capture plans the subject's own consecutive
 * frames at its frame rate, merged once each with the even samples in time
 * order, for a drawn scene and a video file alike.
 *
 * Scenarios:
 *
 * 1. A 30 fps subject of four seconds sampled at 5 per second with one event at
 *    2.0 s and a window of 3 frames plans frames 57 to 63 each once, merged in
 *    order with the even samples every 6 frames, and records the window
 *    unclipped.
 * 2. An event at 0.05 s and one at 3.98 s are cut at frame 0 and frame 119, and
 *    the windows say they were clipped.
 * 3. Two cuts at 1.0 s and 2.5 s plan the frames around both, recorded as `cut`
 *    windows after the events.
 * 4. No cut plans no cut window, and a window of 0 plans only the frame nearest
 *    the event.
 * 5. Explicit seconds keep an off-grid second without a frame and an on-grid
 *    second as its frame.
 * 6. At 4 fps, even sampling of a one-second subject ends at frame 3. An
 *    explicitly requested subject endpoint remains a drawable second with no
 *    frame number.
 * 7. Events at the terminal boundary select the final encoded frame. Native
 *    plans refuse an invalid clock, sampling interval or window radius.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the fixture schedules, the distinction between a continuous pose and an encoded frame, and the invalid inputs.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public capture planner on small numeric clocks and reads returned frames, windows and errors directly. The test starts no draw host.
 * @evidence contracts/development/testing.md#independent-expectations At 4 fps for one second the encoded indices are 0 through 3. Both 0.999 and 1 seconds have the last frame as their nearest available image. On a 0.6-second request at 4 fps the shared encoded schedule rounds 2.4 to two frames. Refused values are chosen from each documented numeric boundary.
 */
export function test_render_capture_plan_capture_frames(): void {
  const frames: (times: IAutoMovieCaptureTime[]) => (number | null)[] = (
    times: IAutoMovieCaptureTime[],
  ): (number | null)[] =>
    times.map((time: IAutoMovieCaptureTime): number | null => time.frame);
  const even: { kind: "even"; from: number; to: number | null; rate: number } =
    {
      kind: "even",
      from: 0,
      to: null,
      rate: 5,
    };

  // 1. One event inside the subject.
  const event: ReturnType<typeof AutoMovieRenderCapture.planFrames> =
    AutoMovieRenderCapture.planFrames({
      durationSeconds: 4,
      fps: 30,
      sampling: even,
      events: [2],
      cuts: [],
      window: 3,
    });
  const sampled: number[] = Array.from(
    { length: 20 },
    (_: unknown, index: number): number => index * 6,
  );
  TestValidator.equals(
    "frames 57 to 63 merge once with the samples",
    frames(event.times),
    [...new Set([...sampled, 57, 58, 59, 60, 61, 62, 63])].sort(
      (a: number, b: number): number => a - b,
    ),
  );
  TestValidator.equals("the window is recorded", event.windows, [
    {
      kind: "event",
      seconds: 2,
      frame: 60,
      first: 57,
      last: 63,
      clipped: false,
    },
  ]);

  // 2. Events at the bounds.
  const bounds: ReturnType<typeof AutoMovieRenderCapture.planFrames> =
    AutoMovieRenderCapture.planFrames({
      durationSeconds: 4,
      fps: 30,
      sampling: { kind: "at", seconds: [1] },
      events: [0.05, 3.98],
      cuts: [],
      window: 3,
    });
  TestValidator.equals("windows are cut at the bounds", bounds.windows, [
    {
      kind: "event",
      seconds: 0.05,
      frame: 2,
      first: 0,
      last: 5,
      clipped: true,
    },
    {
      kind: "event",
      seconds: 3.98,
      frame: 119,
      first: 116,
      last: 119,
      clipped: true,
    },
  ]);
  TestValidator.equals(
    "no frame lies outside the subject",
    frames(bounds.times),
    [0, 1, 2, 3, 4, 5, 30, 116, 117, 118, 119],
  );

  // 3. Two cuts.
  const cut: ReturnType<typeof AutoMovieRenderCapture.planFrames> =
    AutoMovieRenderCapture.planFrames({
      durationSeconds: 4,
      fps: 30,
      sampling: { kind: "at", seconds: [0] },
      events: [],
      cuts: [1, 2.5],
      window: 1,
    });
  TestValidator.equals(
    "frames around both cuts",
    frames(cut.times),
    [0, 29, 30, 31, 74, 75, 76],
  );
  TestValidator.equals(
    "cut windows are recorded",
    cut.windows.map(
      (window: { kind: string; frame: number }): [string, number] => [
        window.kind,
        window.frame,
      ],
    ),
    [
      ["cut", 30],
      ["cut", 75],
    ],
  );

  // 4. No cut, and a zero window.
  const none: ReturnType<typeof AutoMovieRenderCapture.planFrames> =
    AutoMovieRenderCapture.planFrames({
      durationSeconds: 4,
      fps: 30,
      sampling: { kind: "at", seconds: [0] },
      events: [2],
      cuts: [],
      window: 0,
    });
  TestValidator.equals(
    "a zero window is the nearest frame",
    frames(none.times),
    [0, 60],
  );
  TestValidator.equals(
    "no cut gives no cut window",
    none.windows.filter(
      (window: { kind: string }): boolean => window.kind === "cut",
    ),
    [],
  );

  // 5. Explicit seconds.
  TestValidator.equals(
    "explicit seconds keep their frames or none",
    AutoMovieRenderCapture.planFrames({
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

  const oneSecond: IAutoMovieCaptureFramePlanProps = {
    durationSeconds: 1,
    fps: 4,
    sampling: { kind: "even", from: 0, to: null, rate: 4 },
    events: [],
    cuts: [],
    window: 0,
  };
  TestValidator.equals(
    "even sampling ends at the last pre-end frame",
    frames(AutoMovieRenderCapture.planFrames(oneSecond).times),
    [0, 1, 2, 3],
  );
  const endpoint: IAutoMovieCaptureTime | undefined =
    AutoMovieRenderCapture.planFrames({
      ...oneSecond,
      sampling: { kind: "at", seconds: [1] },
    }).times[0];
  TestValidator.predicate(
    "the explicit endpoint has no encoded frame",
    endpoint !== undefined &&
      endpoint.frame === null &&
      nclose(endpoint.seconds, 1),
  );

  const terminal = AutoMovieRenderCapture.planFrames({
    ...oneSecond,
    sampling: { kind: "at", seconds: [1] },
    events: [0.999, 1],
  });
  TestValidator.equals("terminal event keeps its source time and native neighbor", terminal, {
    times: [{ seconds: 0.75, frame: 3 }, { seconds: 1, frame: null }],
    windows: [0.999, 1].map((seconds) => ({
      kind: "event",
      seconds,
      frame: 3,
      first: 3,
      last: 3,
      clipped: true,
    })),
  });
  TestValidator.equals(
    "partial duration uses the shared rounded native grid",
    frames(AutoMovieRenderCapture.planFrames({ ...oneSecond, durationSeconds: 0.6 }).times),
    [0, 1],
  );
  for (const props of [
    { ...oneSecond, fps: Infinity },
    { ...oneSecond, durationSeconds: Infinity },
    { ...oneSecond, window: 0.5 },
    { ...oneSecond, window: Infinity },
    { ...oneSecond, sampling: { ...even, from: -0.25 } },
    { ...oneSecond, sampling: { ...even, from: 0.75, to: 0.5 } },
    { ...oneSecond, sampling: { ...even, rate: 0 } },
    { ...oneSecond, sampling: { ...even, rate: Infinity } },
  ])
    TestValidator.error("invalid native planning input", () => AutoMovieRenderCapture.planFrames(props));
}
