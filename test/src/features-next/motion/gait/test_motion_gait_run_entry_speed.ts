import type {
  IAutoMovieComposition,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";
import { HumanChain, HumanPerformance } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** Half the central difference window for the hips' speed, seconds. */
const H: number = 0.01;

/** The share of its entry speed a run entered moving keeps through its first 0.3 s. */
const KEPT: number = 0.8;

/**
 * A run entered moving keeps the speed it is entered at instead of
 * restarting from rest, and a run from standing still starts from rest.
 *
 * Scenarios:
 * 1. A run cut at a left footfall into a second run keeps at least 80 % of
 *    the hips' forward speed before the cut through the second run's first
 *    0.3 s.
 * 2. A run from quiet standing still starts from rest: the hips move under
 *    0.3 m/s forward 20 ms after it starts.
 *
 * The hips' forward speed is a central difference of the displayed hips over
 * 20 ms. Before the fix, a run entered at 3.3 m/s after a hurdle clearance
 * fell below zero within 0.1 s. A running stride's own forward speed varies
 * by well under a fifth, so the 80 % floor separates a carried speed from a
 * restart without reading the law's own ramp. A sprint start's block exit
 * into a run, whose pelvis starts far ahead of its planned root, is the open
 * root-fade case recorded on #3826.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two entries, the speed reading and the bounds with their basis.
 * @evidence contracts/development/testing.md#behavioral-verification Composes runs and a cut through the public chain and reads the displayed hips; a run that restarts from rest after a moving entry fails the 80 % floor.
 * @evidence contracts/development/testing.md#independent-expectations The floor is the entry speed measured on the same displayed hips before the cut; the rest bound is far under any running speed.
 * @evidence contracts/development/testing.md#distinguishing-cases A moving cut beside a standing start, which must keep its start from rest. The hurdle clearance spec owns the clearance's own hand-back.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances of one polygon man, without a render or external process.
 */
export function test_motion_gait_run_entry_speed(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const film = (composition: IAutoMovieComposition): HumanPerformance =>
    new HumanPerformance({
      seed: "run-entry-speed",
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition,
    });
  const speed = (performance: HumanPerformance, seconds: number): number =>
    (performance.bones("a", seconds + H).get("hips")!.worldPosition.z -
      performance.bones("a", seconds - H).get("hips")!.worldPosition.z) /
    (2 * H);
  const slowest = (performance: HumanPerformance, from: number): number => {
    let least: number = Infinity;
    for (let t: number = from + H; t <= from + 0.3; t += 0.02)
      least = Math.min(least, speed(performance, t));
    return least;
  };

  // 1. A run cut at a left footfall into a second run.
  const plain: HumanPerformance = film(
    HumanChain.subject("a")
      .stand({ hold: 0.3, sway: 0 })
      .run({ to: { x: 0, y: 0, z: 30 }, pace: "run" }).node,
  );
  const first: IAutoMovieMotionHumanSegment = plain.segments("a")[1]!;
  const cut: string | undefined = first.plan.events.find(
    (event): boolean =>
      event.name.startsWith("leftHeelStrike") &&
      first.start + event.share * first.plan.duration > first.start + 2,
  )?.name;
  if (cut === undefined)
    throw new Error("The run has no left footfall after 2 s");
  const recut: HumanPerformance = film(
    HumanChain.subject("a")
      .stand({ hold: 0.3, sway: 0 })
      .run({ to: { x: 0, y: 0, z: 30 }, pace: "run" })
      .until({ event: cut })
      .run({ to: { x: 0, y: 0, z: 40 }, pace: "run" }).node,
  );
  const second: IAutoMovieMotionHumanSegment = recut.segments("a")[2]!;
  const before: number = speed(recut, second.start - 2 * H);
  const kept: number = slowest(recut, second.start);
  TestValidator.predicate(
    `a run cut into a run keeps its speed (${before.toFixed(2)} m/s in, ${kept.toFixed(2)} m/s slowest after)`,
    before > 1 && kept >= KEPT * before,
  );

  // 2. A run from standing still starts from rest.
  const off: number = speed(plain, first.start + 2 * H);
  TestValidator.predicate(
    `a run from standing starts from rest (${off.toFixed(2)} m/s)`,
    off < 0.3,
  );
}
