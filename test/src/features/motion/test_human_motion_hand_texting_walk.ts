import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanChain,
  HumanPerformance,
  type HumanSegment,
  HumanSignature,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Reading a hand-held screen while walking changes the walk as it does in
 * people (#3338's kinematic signature): the head is flexed, the reading arm
 * is held with the trunk and the walk is slower (Schabrun et al. 2014;
 * Lamberg and Muratori 2012).
 *
 * One body, the average man, walks 3 m, once freely and once with
 * `handToFace({ task: "read" })` over the walk; the claim is the overlay's
 * effect on one walk, not a stature.
 *
 * Scenarios:
 * 1. The read rides the walk.
 * 2. At the read's `atSheet` the head points at least 15 degrees further
 *    below the horizon than in the free walk at the same second (provisional
 *    size; the direction is the sources').
 * 3. From `atSheet` to `taskEnd`, read every 0.1 s, the reading wrist stays
 *    within 30 mm of one place in the chest's frame (provisional), where the
 *    free walk's wrist swings.
 * 4. The walk with the read takes at least 5 per cent longer than the free
 *    walk (provisional size; both sources report a slower gait).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds both performances through the public chain and reads displayed head, wrist and chest and the walk's own length; a read that leaves the head up, an arm that keeps swinging or a walk at its free speed fails.
 * @evidence contracts/development/testing.md#independent-expectations The directions are the two cited studies'; the sizes are provisional and stated as such, and none is read from the law.
 * @evidence contracts/development/testing.md#distinguishing-cases The same walk with and without the overlay; a wave over a walk is `test_human_motion_hand_overlay_wave`'s and a held glass `test_human_motion_prop_held_walk`'s.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and builds two short performances; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule with its sources, why one body is enough and the 4 scenarios with their bounds.
 */
export function test_human_motion_hand_texting_walk(): void {
  const body: IHumanBody = motionHumanBody("m-average");
  const complaints: string[] = [];
  const perform = (read: boolean): HumanPerformance => {
    const walk: HumanChain = HumanChain.subject("a").walk({
      to: { x: 0, y: 0, z: 3 },
    });
    return new HumanPerformance({
      seed: "texting",
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: (read
        ? walk.over(
            (u: HumanChain): HumanChain => u.handToFace({ task: "read" }),
          )
        : walk
      ).node,
    });
  };

  // 1. The read rides the walk.
  let free: HumanPerformance;
  let reading: HumanPerformance;
  try {
    free = perform(false);
    reading = perform(true);
  } catch (error) {
    TestValidator.equals(
      "a read over a walk plans",
      error instanceof Error ? error.message : String(error),
      "",
    );
    return;
  }
  const overlay: HumanSegment.IOverlay = reading.overlays("a")[0]!;
  const instant = (event: string): number =>
    overlay.start +
    (overlay.plan.events.find((e): boolean => e.name === event)?.share ??
      NaN) *
      overlay.plan.duration;
  const from: number = instant("atSheet");
  const to: number = instant("taskEnd");
  const readers: Record<"free" | "reading", HumanSignature.IReader> = {
    free: HumanSignature.of(free, "a", body, 0),
    reading: HumanSignature.of(reading, "a", body, 0),
  };

  // 2. The head flexed.
  const flexed: number =
    HumanSignature.head(readers.reading, from) -
    HumanSignature.head(readers.free, Math.min(from, free.duration));
  if (!(flexed >= 15))
    complaints.push(
      `the head points ${flexed.toFixed(1)} degrees further below the horizon than in the free walk at atSheet, at least 15 expected`,
    );

  // 3. The reading arm held with the trunk.
  const wander = (reader: HumanSignature.IReader, end: number): number => {
    const seat = (seconds: number): IAutoMovieVector3 => {
      const wrist: IAutoMovieVector3 = HumanSignature.joint(
        reader,
        seconds,
        "rightHand",
      );
      const chest: IAutoMovieVector3 = HumanSignature.joint(
        reader,
        seconds,
        "chest",
      );
      return { x: wrist.x - chest.x, y: wrist.y - chest.y, z: wrist.z - chest.z };
    };
    const first: IAutoMovieVector3 = seat(from);
    let worst: number = 0;
    for (let seconds: number = from; seconds <= end; seconds += 0.1) {
      const here: IAutoMovieVector3 = seat(seconds);
      worst = Math.max(
        worst,
        Math.hypot(here.x - first.x, here.y - first.y, here.z - first.z),
      );
    }
    return worst;
  };
  const held: number = wander(readers.reading, to);
  if (!(held <= 0.03))
    complaints.push(
      `the reading wrist moves ${(held * 1000).toFixed(0)} mm from its place before the chest between atSheet and taskEnd, within 30 mm expected`,
    );
  const swung: number = wander(readers.free, Math.min(to, free.duration));
  if (!(swung > 0.03))
    complaints.push(
      `the free walk's wrist moves ${(swung * 1000).toFixed(0)} mm in the same window, more than 30 mm expected of a swinging arm`,
    );

  // 4. A slower walk.
  const slower: number =
    reading.segments("a")[0]!.plan.duration /
    free.segments("a")[0]!.plan.duration;
  if (!(slower >= 1.05))
    complaints.push(
      `the walk with the read lasts ${slower.toFixed(3)} of the free walk, at least 1.05 expected`,
    );
  TestValidator.equals("reading a screen while walking", complaints, []);
}
