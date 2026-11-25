import { measureAutoMovieSchedule } from "@automovie/engine";
import type {
  IAutoMovieMeasureSchedule,
  IAutoMovieSchedule,
  IAutoMovieScheduleEntry,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `measureAutoMovieSchedule` reads pacing from a schedule: actions per minute,
 * the share of actions that follow the same subject's previous action within
 * the combination gap, each subject's lateral displacement share and idle time
 * over its presence, the share of the runtime with the camera moving (overlaps
 * counted once) and cuts per minute.
 *
 * Schedule, 30 s:
 *
 * - `a` acts at 0–1, 1.25–2 and 5–6;
 * - `b` dodges 0–2 (lateral 0.25, linear 0.25) and walks 2–4 (linear 0.5),
 *   present only over 0–10;
 * - `c` watches 0–30, classified idle;
 * - The camera moves 10–20 and 15–25 and cuts twice, at 20 and at 25.
 *
 * Scenarios:
 *
 * 1. Three actions over half a minute are 6 per minute. Only the second follows
 *    its predecessor within the default 0.5 s gap (0.25 s), a share of 1/3.
 * 2. `a` is busy 1 + 0.75 + 1 = 2.75 s of 30, idle 27.25 s, with no displacement;
 *    `b` moves 0.25 of 1 m laterally, a share of 0.25, and is busy 4 of its 10
 *    present seconds; `c` is idle all 30 s; the camera is busy over the union
 *    10–25, idle 15 s, its zero-length cuts adding nothing.
 * 3. The moving union 10–25 is half the runtime; two cuts are 4 per minute.
 * 4. An empty schedule of no duration measures zero throughout.
 */
export function test_engine_composition_measure_schedule(): void {
  let index: number = 0;
  const entry = (
    subject: string,
    capability: string,
    start: number,
    end: number,
  ): IAutoMovieScheduleEntry => ({
    index: index++,
    subject,
    intent: { subject, capability },
    start,
    end,
  });
  const schedule: IAutoMovieSchedule = {
    entries: [
      entry("a", "kick", 0, 1),
      entry("a", "kick", 1.25, 2),
      entry("a", "kick", 5, 6),
      entry("b", "dodge", 0, 2),
      entry("b", "walk", 2, 4),
      entry("c", "watch", 0, 30),
      entry("camera", "move", 10, 20),
      entry("camera", "move", 15, 25),
      entry("camera", "cut", 20, 20),
      entry("camera", "cut", 25, 25),
    ],
    duration: 30,
  };
  const classify: IAutoMovieMeasureSchedule.IClassify = {
    action: (e: IAutoMovieScheduleEntry): boolean =>
      e.intent.capability === "kick",
    displacement: (
      e: IAutoMovieScheduleEntry,
    ): { lateral: number; linear: number } =>
      e.intent.capability === "dodge"
        ? { lateral: 0.25, linear: 0.25 }
        : e.intent.capability === "walk"
          ? { lateral: 0, linear: 0.5 }
          : { lateral: 0, linear: 0 },
    idle: (e: IAutoMovieScheduleEntry): boolean =>
      e.intent.capability === "watch",
    presence: (subject: string): { start: number; end: number } =>
      subject === "b" ? { start: 0, end: 10 } : { start: 0, end: 30 },
    cameraMoves: (e: IAutoMovieScheduleEntry): boolean =>
      e.intent.capability === "move",
    cut: (e: IAutoMovieScheduleEntry): boolean => e.intent.capability === "cut",
  };
  const expected: IAutoMovieMeasureSchedule.IMeasure = {
    actionsPerMinute: 6,
    combinationShare: 1 / 3,
    subjects: {
      a: { lateralShare: 0, idleSeconds: 27.25 },
      b: { lateralShare: 0.25, idleSeconds: 6 },
      c: { lateralShare: 0, idleSeconds: 30 },
      camera: { lateralShare: 0, idleSeconds: 15 },
    },
    cameraMotionShare: 0.5,
    cutsPerMinute: 4,
  };
  TestValidator.equals(
    "the pacing of the schedule",
    measureAutoMovieSchedule(schedule, classify),
    expected,
  );
  TestValidator.equals(
    "an empty schedule measures zero",
    measureAutoMovieSchedule({ entries: [], duration: 0 }, classify),
    {
      actionsPerMinute: 0,
      combinationShare: 0,
      subjects: {},
      cameraMotionShare: 0,
      cutsPerMinute: 0,
    },
  );
}
