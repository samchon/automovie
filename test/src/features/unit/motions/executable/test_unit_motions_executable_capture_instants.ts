import type {
  IAutoMovieCaptureInstant,
  IAutoMovieCaptureTime,
} from "@automovie/interface";
import { planMotionCaptureInstants } from "@automovie/motions/internal";
import { planAutoMovieCaptureFrames } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * A motion case's labelled instants become the instants its capture draws and
 * names: one per millisecond, in the case's order, with every distinct label of
 * instants that coincide.
 *
 * Scenarios:
 *
 * 1. Instants at 0, 1.2575 and 2.42 with labels `start`, `grip closes` and
 *    `release` stay three, in order, with their labels and seconds unchanged.
 * 2. Two instants 5e-16 s apart, 1.886634915062088 `grip closed` and
 *    1.8866349150620885 `release starts`, become one at the first second named
 *    `grip closed / release starts`.
 * 3. Two instants within one millisecond that share a label become one named once.
 * 4. Instants a millisecond apart, 1.000 and 1.001, stay two.
 * 5. No instant gives none.
 */
export function test_unit_motions_executable_capture_instants(): void {
  // 1. Distinct instants.
  const distinct: IAutoMovieCaptureInstant[] = [
    { seconds: 0, label: "start" },
    { seconds: 1.2575, label: "grip closes" },
    { seconds: 2.42, label: "release" },
  ];
  TestValidator.equals(
    "distinct instants stay",
    planMotionCaptureInstants(distinct),
    distinct,
  );

  // 2. A coinciding pair with two labels.
  TestValidator.equals(
    "one still named by both",
    planMotionCaptureInstants([
      { seconds: 1.886634915062088, label: "grip closed" },
      { seconds: 1.8866349150620885, label: "release starts" },
    ]),
    [{ seconds: 1.886634915062088, label: "grip closed / release starts" }],
  );

  // 3. A coinciding pair with one label.
  TestValidator.equals(
    "one label once",
    planMotionCaptureInstants([
      { seconds: 3.2, label: "end" },
      { seconds: 3.2000001, label: "end" },
    ]),
    [{ seconds: 3.2, label: "end" }],
  );

  // 4. A millisecond apart.
  TestValidator.equals(
    "a millisecond apart stays two",
    planMotionCaptureInstants([
      { seconds: 1, label: "a" },
      { seconds: 1.001, label: "b" },
    ]).length,
    2,
  );

  // 5. None.
  TestValidator.equals("none", planMotionCaptureInstants([]), []);
  // Four frames occupy 0, 1/4, 1/2 and 3/4 s; the last second is an explicit end sample.
  const frames = planAutoMovieCaptureFrames({
    durationSeconds: 1,
    fps: 4,
    sampling: { kind: "at", seconds: [1] },
    events: [0, 0.5],
    cuts: [0.5],
    window: 1,
  });
  TestValidator.equals(
    "clipped and duplicate event windows share frame indices",
    frames.times.map((time: IAutoMovieCaptureTime) => [
      time.frame,
      time.seconds,
    ]),
    [
      [0, 0],
      [1, 0.25],
      [2, 0.5],
      [3, 0.75],
      [null, 1],
    ],
  );
  TestValidator.equals(
    "first event window is clipped at the first frame",
    frames.windows[0]?.clipped,
    true,
  );
}
