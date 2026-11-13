import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanChain,
  HumanEmblem,
  HumanPerformance,
  type HumanSegment,
  HumanSignature,
  type IHumanActionLaw,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A thumbs up shows the thumb up and a thumbs down shows it down (#3345):
 * the two emblems are one fist with the thumb straight, told apart only by
 * which way the thumb points.
 *
 * Scenarios, on the small woman and the average man, at the middle of the
 * gesture's stroke:
 * 1. `thumbsUp`: the right thumb, from its first joint to its last, points
 *    within 30 degrees of straight up (provisional: no measured form was
 *    read; past it the thumb reads as sideways).
 * 2. `thumbsDown`: it points within 30 degrees of straight down.
 * 3. In both the forefinger is folded: its last joint lies nearer the wrist
 *    than a straight finger's would, under 0.7 of the hand's length.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Registers the two rows, performs each through the public chain and reads displayed joint centres; a thumb that points sideways, the two rows showing the same hand, or an open hand fails.
 * @evidence contracts/development/testing.md#independent-expectations Up and down are what the emblems mean; the 30 degrees and the 0.7 are provisional and stated as such.
 * @evidence contracts/development/testing.md#distinguishing-cases The two opposite rows on two statures; the other emblems' forms are `test_human_motion_emblem_signatures`'s.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds four short performances, each read at one instant; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 3 scenarios with their bounds.
 */
export function test_human_motion_emblem_thumbs(): void {
  const laws: IHumanActionLaw<never>[] = [
    HumanEmblem.thumbsUp,
    HumanEmblem.thumbsDown,
  ];
  const complaints: string[] = [];
  for (const name of ["f-small", "m-average"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    for (const [row, sense] of [
      ["thumbsUp", 1],
      ["thumbsDown", -1],
    ] as const)
      try {
        const performance: HumanPerformance = new HumanPerformance({
          seed: "thumbs",
          laws,
          performers: [
            {
              subject: "a",
              body,
              at: { x: 0, y: 0, z: 0 },
              yaw: 0,
              proficiency: { level: "trained" },
            },
          ],
          composition: HumanChain.subject("a")
            .stand({ seconds: 0.3 })
            .registered(row, {}).node,
        });
        const placed: HumanSegment.ISegment = performance.segments("a")[1]!;
        const instant = (event: string): number =>
          placed.start +
          (placed.plan.events.find((e): boolean => e.name === event)?.share ??
            NaN) *
            placed.plan.duration;
        const held: number = (instant("strokeStart") + instant("strokeEnd")) / 2;
        const reader: HumanSignature.IReader = HumanSignature.of(
          performance,
          "a",
          body,
          0,
        );
        const at = (bone: "rightThumbProximal" | "rightThumbDistal" | "rightIndexDistal" | "rightHand"): IAutoMovieVector3 =>
          HumanSignature.joint(reader, held, bone);
        const base: IAutoMovieVector3 = at("rightThumbProximal");
        const tip: IAutoMovieVector3 = at("rightThumbDistal");
        const off: number =
          (Math.acos(
            Math.max(
              -1,
              Math.min(
                1,
                (sense * (tip.y - base.y)) /
                  Math.hypot(tip.x - base.x, tip.y - base.y, tip.z - base.z),
              ),
            ),
          ) *
            180) /
          Math.PI;
        if (!(off <= 30))
          complaints.push(
            `${name}: ${row}: the thumb points ${off.toFixed(0)} degrees from straight ${sense > 0 ? "up" : "down"}, within 30 expected`,
          );
        const wrist: IAutoMovieVector3 = at("rightHand");
        const finger: IAutoMovieVector3 = at("rightIndexDistal");
        const reach: number =
          Math.hypot(
            finger.x - wrist.x,
            finger.y - wrist.y,
            finger.z - wrist.z,
          ) / body.measure.hand;
        if (!(reach < 0.7))
          complaints.push(
            `${name}: ${row}: the forefinger's last joint lies ${reach.toFixed(2)} of the hand's length from the wrist, under 0.7 expected for a folded finger`,
          );
      } catch (error) {
        complaints.push(
          `${name}: ${row}: expected to plan, got ${(error as Error).message}`,
        );
      }
  }
  TestValidator.equals("thumbs up and thumbs down", complaints, []);
}
