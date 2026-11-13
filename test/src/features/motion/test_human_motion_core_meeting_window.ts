import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  AutoMovieMotionHumanTouchEffector,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
  type HumanSegment,
  HumanSocial,
  type IHumanBody,
  touch,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A meeting holds over the window the composition states and leaves the
 * partners free outside it (#3341): two people bump fists from 2 s to 3 s,
 * however soon their hands could meet.
 *
 * The average man and the small woman stand 0.7 m apart, facing, and bump
 * fists (`HumanSocial.bump`) right after a 0.3 s stand, with the window
 * 2.0 s to 3.0 s.
 *
 * Scenarios:
 * 1. Both roles' `meet` falls at 2.0 s and both `rebound`s at 3.0 s, each
 *    within one 24 Hz frame.
 * 2. At 2.0, 2.5 and 3.0 s the two fists lie within 30 mm of each other
 *    (provisional: two fists pressed together).
 * 3. At 1.0 s, a second before the window, each right wrist is within 1 mm
 *    of where it stood at the action's start: a hand leaves its rest only
 *    its own reach's time before the meeting.
 * 4. The same bump with a window ending at 0.4 s, before the hands can meet,
 *    is refused on `window`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Joins two performers through the public mutual join with a stated window and reads the plans' instants and displayed hands; a meeting at its natural instant, fists apart in the window, a hand that drifts early or a window too short that plans fails.
 * @evidence contracts/development/testing.md#independent-expectations The window's seconds are the composition's; the frame and the 1 mm are the campaign's bounds; the 30 mm is stated provisional.
 * @evidence contracts/development/testing.md#distinguishing-cases A window later and longer than the natural meeting, and one that ends before it.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds two short two-person performances; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the stage and the 4 scenarios with their bounds.
 */
export function test_human_motion_core_meeting_window(): void {
  const bodies: Record<"a" | "b", IHumanBody> = {
    a: motionHumanBody("m-average"),
    b: motionHumanBody("f-small"),
  };
  const complaints: string[] = [];
  const mm = (metres: number): string => (metres * 1000).toFixed(1);
  const gap = (p: IAutoMovieVector3, q: IAutoMovieVector3): number =>
    Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z);
  const perform = (window: { from?: number; to: number }): HumanPerformance =>
    new HumanPerformance({
      seed: "window",
      laws: [HumanSocial.fistBump],
      performers: (["a", "b"] as const).map((subject: "a" | "b") => ({
        subject,
        body: bodies[subject],
        at: { x: 0, y: 0, z: subject === "a" ? 0 : 0.7 },
        yaw: subject === "a" ? 0 : 180,
        proficiency: { level: "trained" as const },
      })),
      composition: HumanChain.mutual(
        HumanSocial.bump,
        {
          one: HumanChain.subject("a").stand({ seconds: 0.3 }),
          other: HumanChain.subject("b").stand({ seconds: 0.3 }),
        },
        { window },
      ).node,
    });

  let performance: HumanPerformance;
  try {
    performance = perform({ from: 2, to: 3 });
  } catch (error) {
    TestValidator.equals(
      "a windowed bump plans",
      error instanceof Error ? error.message : String(error),
      "",
    );
    return;
  }
  const instant = (who: "a" | "b", event: string): number => {
    const placed: HumanSegment.ISegment = performance.segments(who)[1]!;
    return (
      placed.start +
      (placed.plan.events.find((e): boolean => e.name === event)?.share ??
        NaN) *
        placed.plan.duration
    );
  };

  // 1. The instants are the window's.
  for (const who of ["a", "b"] as const)
    for (const [event, expected] of [
      ["meet", 2],
      ["rebound", 3],
    ] as const)
      if (!(Math.abs(instant(who, event) - expected) <= 1 / 24))
        complaints.push(
          `${who}: ${event} falls at ${instant(who, event).toFixed(3)} s, ${expected} s within one 24 Hz frame expected`,
        );

  // 2. Together through the window.
  const fist = (who: "a" | "b", seconds: number): IAutoMovieVector3 =>
    AutoMovieMotionHumanTouchEffector.point(
      bodies[who],
      performance.bones(who, seconds),
      "right",
      touch.EFFECTORS.fist,
    );
  for (const seconds of [2, 2.5, 3]) {
    const apart: number = gap(fist("a", seconds), fist("b", seconds));
    if (!(apart <= 0.03))
      complaints.push(
        `at ${seconds} s the two fists lie ${mm(apart)} mm apart, within 30 mm expected`,
      );
  }

  // 3. At rest before the window.
  for (const who of ["a", "b"] as const) {
    const start: number = performance.segments(who)[1]!.entryTime;
    const wrist = (seconds: number): IAutoMovieVector3 =>
      performance.bones(who, seconds).get("rightHand")!.worldPosition;
    const moved: number = gap(wrist(1), wrist(start));
    if (!(moved <= 0.001))
      complaints.push(
        `${who}: the right wrist has moved ${mm(moved)} mm by 1.0 s, a second before the window, within 1 mm expected`,
      );
  }

  // 4. A window too short is refused.
  let refused: string = "planned";
  try {
    perform({ to: 0.4 });
  } catch (error) {
    refused =
      error instanceof HumanRefusal
        ? error.axis
        : error instanceof Error
          ? error.message
          : String(error);
  }
  if (refused !== "window")
    complaints.push(
      `a window ending at 0.4 s: ${refused}, a refusal on window expected`,
    );
  TestValidator.equals("a meeting held over its window", complaints, []);
}
