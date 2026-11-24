import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
} from "@automovie/interface";
import { run } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";
import { motionPlanReading as R } from "../../../internal/motionPlanReading";

/** Half the central difference window for the hips' speed, seconds. */
const H: number = 0.01;

/** The share of its entry speed a run entered moving keeps through its first 0.3 s. */
const KEPT: number = 0.8;

/** The hips' forward speed a run from standing stays under 20 ms in, m/s. */
const STILL: number = 0.3;

/** The window a run entered moving is read over, seconds. */
const EARLY: number = 0.3;

/**
 * `run`'s plan runs at its pace's speed from the speed it is entered at: from
 * rest it starts from rest, and entered moving it keeps that speed instead of
 * restarting.
 *
 * The law reads most of the body record: its rig, pose resolution, chains,
 * projection, rest joints, measure, surfaces and profile, so the test builds
 * the stored body (`humanFixtureBody`).
 *
 * Scenarios, on the average man running 30 m along +Z, the hips' forward speed
 * read as a central difference over 20 ms:
 *
 * 1. From standing still the hips go under 0.3 m/s 20 ms after the start.
 * 2. Entered at the run's own speed (`run.speed`), the hips go no slower than
 *    80 % of it through the first 0.3 s; a running stride's speed varies by
 *    well under a fifth, so the floor tells a carried speed from a restart.
 */
export async function test_unit_motions_actions_run_plan(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const speed = (plan: IAutoMovieMotionHumanActionPlan, t: number): number =>
    (R.bones(body, plan, t + H).get("hips")!.worldPosition.z -
      R.bones(body, plan, t - H).get("hips")!.worldPosition.z) /
    (2 * H);
  const to = { x: 0, y: 0, z: 30 };

  // 1. From rest.
  const still: IAutoMovieMotionHumanActionPlan = run.plan(
    motionActionContext(body, { to, pace: "run" }, { seed: "run-entry-speed" }),
  );
  const off: number = speed(still, 2 * H);
  TestValidator.predicate(`starts from rest (${off} m/s)`, off < STILL);

  // 2. Entered moving.
  const v: number = run.speed(body, "run");
  const moving: IAutoMovieMotionHumanActionPlan = run.plan(
    motionActionContext(
      body,
      { to, pace: "run" },
      { seed: "run-entry-speed", velocity: { x: 0, y: 0, z: v } },
    ),
  );
  let least: number = Infinity;
  for (let t: number = H; t <= EARLY; t += 2 * H) least = Math.min(least, speed(moving, t));
  TestValidator.predicate(
    `keeps its speed (${least} of ${v} m/s)`,
    least >= KEPT * v,
  );
}
