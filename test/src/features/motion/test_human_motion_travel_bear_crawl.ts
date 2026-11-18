import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanSignature,
} from "@automovie/interface";
import {
  HumanChain,
  HumanPerformance,
  HumanSignature,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A bear crawl goes on the hands and the feet with the knees off the
 * floor, each hand with the opposite foot, while the crawl on hands and
 * knees rests its knees on the floor.
 *
 * Scenarios, the average man and the small woman, each crawling two cycles
 * from standing:
 * 1. A bear crawl's knees clear the floor at every instant from `down` to
 *    its end: each knee joint stands at least 20 mm higher than the shank's
 *    radius (the knee's surface off the floor by 2 cm; the exercise is cued
 *    "an inch or two off the floor").
 * 2. A crawl on hands and knees brings each knee joint within 15 mm of the
 *    shank's radius over the floor at some instant (the knee on the floor).
 * 3. From the instant the hands land, the bear crawl plants each foot in as
 *    many windows as each hand, and the left hand's windows are the right
 *    foot's and the right hand's the left foot's (the diagonal pattern;
 *    before the hands land the feet bear alone, from standing).
 * 4. At the middle of each of its plant windows after `down`, a foot's
 *    lowest sole socket lies within 15 mm of the floor (the campaign's bound
 *    for a contact).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs both crawls through the public chain and reads the displayed knees and soles and the plan's contact windows; knees left on the floor, feet afloat while planted, or a hand paired with its own side's foot fails.
 * @evidence contracts/development/testing.md#independent-expectations The knee's clearance is read against the body's own shank radius, the pairing against the opposite limb's window and the soles against the floor; the 20 mm and 15 mm are the exercise's cue and the campaign's bound.
 * @evidence contracts/development/testing.md#distinguishing-cases The bear crawl against the crawl on hands and knees, on two bodies of opposite build.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds four performances in memory, reading a sampled clock of each.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 4 scenarios with their bounds.
 */
export function test_human_motion_travel_bear_crawl(): void {
  const complaints: string[] = [];
  for (const name of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const perform = (
      kind: "bear" | "knees",
    ): IAutoMovieMotionHumanPerformance =>
      new HumanPerformance({
        seed: "bear-crawl",
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        composition: HumanChain.subject("a").crawl({ kind, cycles: 2 }).node,
      });
    for (const kind of ["bear", "knees"] as const) {
      let performance: IAutoMovieMotionHumanPerformance;
      try {
        performance = perform(kind);
      } catch (error) {
        complaints.push(
          `${name} ${kind}: ${error instanceof Error ? error.message : String(error)}`,
        );
        continue;
      }
      const reader: IAutoMovieMotionHumanSignature.IReader = HumanSignature.of(
        performance,
        "a",
        body,
        0,
      );
      const [crawl]: readonly IAutoMovieMotionHumanSegment[] =
        performance.segments("a");
      const at = (share: number): number =>
        crawl!.start + share * crawl!.plan.duration;
      const down: number = at(
        crawl!.plan.events.find(
          (e: { name: string }): boolean => e.name === "down",
        )?.share ?? 0,
      );

      // 1 and 2. The knees over the floor.
      let lowest: number = Infinity;
      for (let t: number = down; t <= crawl!.end; t += 0.05)
        for (const side of ["left", "right"] as const)
          lowest = Math.min(
            lowest,
            HumanSignature.joint(reader, t, `${side}LowerLeg`).y -
              body.measure.shankRadius,
          );
      if (kind === "bear" && lowest < 0.02)
        complaints.push(
          `${name} bear: a knee comes ${(lowest * 1000).toFixed(1)} mm over its resting height, at least 20 mm expected`,
        );
      if (kind === "knees" && lowest > 0.015)
        complaints.push(
          `${name} knees: the knees come no lower than ${(lowest * 1000).toFixed(1)} mm over their resting height, within 15 mm expected`,
        );
      if (kind === "knees") continue;

      // 3. The diagonal pairing.
      const windows = (
        part: IAutoMovieMotionHumanContactWindow["part"],
      ): IAutoMovieMotionHumanContactWindow[] =>
        crawl!.plan.contacts.filter(
          (c: IAutoMovieMotionHumanContactWindow): boolean => c.part === part,
        );
      // The gait starts as the hands land: before that the feet bear alone,
      // from standing, so each foot's first window is read from there.
      const landed: number = Math.min(
        ...windows("leftHand").map(
          (w: IAutoMovieMotionHumanContactWindow): number => w.from,
        ),
        ...windows("rightHand").map(
          (w: IAutoMovieMotionHumanContactWindow): number => w.from,
        ),
      );
      for (const [hand, foot] of [
        ["leftHand", "rightFoot"],
        ["rightHand", "leftFoot"],
      ] as const) {
        const a: IAutoMovieMotionHumanContactWindow[] = windows(hand);
        const b: IAutoMovieMotionHumanContactWindow[] = windows(foot).map(
          (
            w: IAutoMovieMotionHumanContactWindow,
          ): IAutoMovieMotionHumanContactWindow => ({
            ...w,
            from: Math.max(w.from, landed),
          }),
        );
        if (
          a.length !== b.length ||
          a.some(
            (w: IAutoMovieMotionHumanContactWindow, i: number): boolean =>
              Math.abs(w.from - b[i]!.from) > 1e-9 ||
              Math.abs(w.to - b[i]!.to) > 1e-9,
          )
        )
          complaints.push(
            `${name} bear: the ${hand}'s windows ${spans(a)} are not the ${foot}'s ${spans(b)}`,
          );
      }

      // 4. The planted feet on the floor.
      for (const side of ["left", "right"] as const)
        for (const window of windows(`${side}Foot`)) {
          const t: number = at((window.from + window.to) / 2);
          const sole: number = HumanSignature.sole(reader, t, side).y;
          if (Math.abs(sole) > 0.015)
            complaints.push(
              `${name} bear: the ${side} foot planted at ${t.toFixed(2)} s has its sole at ${(sole * 1000).toFixed(1)} mm, within 15 mm of the floor expected`,
            );
        }
    }
  }
  TestValidator.equals(
    "a bear crawl keeps its knees off the floor",
    complaints,
    [],
  );
}

/** Contact windows written as their shares. */
function spans(windows: readonly IAutoMovieMotionHumanContactWindow[]): string {
  return windows
    .map(
      (w: IAutoMovieMotionHumanContactWindow): string =>
        `${w.from.toFixed(3)}-${w.to.toFixed(3)}`,
    )
    .join(", ");
}
