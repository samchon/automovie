import type { IAutoMovieMotionHumanPerformance } from "@automovie/interface";
import { HumanChain, HumanPerformance } from "@automovie/motions";
import assert from "node:assert/strict";

import { motionHumanBody } from "../internal/motionHumanBody";
import { profileHumanMotion } from "../internal/profileHumanMotion";

/**
 * A partial frame and a missing segment must both reach the profiling caller.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the partial display and refused plan.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the profiling entry and compares its output with actual reads and thrown failures.
 * @evidence contracts/development/testing.md#independent-expectations A 50 ms film has two 30 Hz grid times plus its endpoint. A failed second subject leaves the first subject's successful read in a partial frame.
 * @evidence contracts/development/testing.md#distinguishing-cases Checks a complete film, a partial frame and a missing action with the same performance.
 * @evidence contracts/development/testing.md#execution-ownership This portable test uses one in-memory standing performer and restores the label and console after synchronous reads.
 */
export function test_motion_profile_display_completion(): void {
  const film: IAutoMovieMotionHumanPerformance = new HumanPerformance({
    seed: "profile",
    performers: [
      {
        subject: "a",
        body: motionHumanBody("m-average"),
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("a").stand({ seconds: 0.05 }).node,
  });
  const label: string = "profile-completion";
  const previous: string | undefined = process.env.AUTOMOVIE_PROFILE_MOTION;
  const records: IRecord[] = [];
  const times: number[] = [];
  const pose: IAutoMovieMotionHumanPerformance["pose"] = film.pose.bind(film);
  film.pose = (subject, seconds) => {
    times.push(seconds);
    return pose(subject, seconds);
  };
  const readsAtOutput: number[] = [];
  const log: typeof console.log = console.log;
  console.log = (line: string): void => {
    readsAtOutput.push(times.length);
    records.push(JSON.parse(line));
  };
  try {
    process.env.AUTOMOVIE_PROFILE_MOTION = label;
    assert.equal(
      profileHumanMotion(label, () => film, ["a"]),
      film,
    );
    const [start, plan, display] = records;
    assert.deepEqual(times, [0, 1 / 30, 0.05]);
    assert.deepEqual(readsAtOutput, [0, 3, 3]);
    assert.ok(plan && display);
    assert.equal(start?.phase, "plan-start");
    assert.equal(plan?.phase, "plan");
    assert.equal(display?.phase, "display");
    assert.equal(display.frames, 3);
    assert.equal(display.poses, 3);
    assert.ok(
      Math.abs(
        display.totalWallSeconds - plan.wallSeconds - display.wallSeconds,
      ) < 1e-9,
    );

    records.length = 0;
    assert.throws(() =>
      profileHumanMotion(label, () => film, ["a", "missing"]),
    );
    assert.equal(records[2]?.frames, 0);
    assert.equal(records[2]?.poses, 1);
    assert.ok(records[2]?.error);

    records.length = 0;
    assert.throws(
      () => profileHumanMotion(label, () => film, ["a"], "missing"),
      /no placed motion/,
    );
    assert.equal(records.length, 2);
    assert.ok(records[1]?.error);
  } finally {
    console.log = log;
    if (previous === undefined) delete process.env.AUTOMOVIE_PROFILE_MOTION;
    else process.env.AUTOMOVIE_PROFILE_MOTION = previous;
  }
}

/** Fields asserted on the corresponding profile phase. */
interface IRecord {
  phase: string;
  poses: number;
  frames: number;
  wallSeconds: number;
  totalWallSeconds: number;
  error?: string;
}
