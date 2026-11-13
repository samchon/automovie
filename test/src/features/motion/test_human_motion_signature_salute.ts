import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanActionRow,
  HumanChain,
  HumanPerformance,
  HumanSignature,
  type IHumanBody,
  touch,
  type HumanSegment,
  type IHumanActionLaw,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The hand salute holds the arm the drill manual prescribes: the tip of the
 * right forefinger at the forehead near the right eyebrow, the hand and
 * wrist straight, the upper arm horizontal and the elbow inclined slightly
 * forward (US Army TC 3-21.5, Drill and Ceremonies, the hand salute;
 * wording read from the 2012 edition and its training handouts, to be
 * confirmed against the 2021 edition).
 *
 * The salute is a row of `touch`: the forefinger's end, the hand continuing
 * its forearm with the palm down, to the right temple, the elbow level.
 *
 * Scenarios, on the small woman, the average man, the large man and the
 * short-legged man, at the middle of the hold:
 * 1. The right upper arm lies within 10 degrees of the horizontal (the
 *    tolerance is provisional).
 * 2. The elbow lies ahead of the shoulder, not behind it.
 * 3. The hand continues the forearm: the line from the wrist to the
 *    forefinger's last joint lies within 15 degrees of the line from the
 *    elbow to the wrist (provisional).
 * 4. The forefinger's last joint lies within 30 mm of the right temple.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Registers the salute through the public input, performs it on real bodies and reads displayed joint centres; an arm held off the manual's line, a bent wrist or a hand away from the brow fails.
 * @evidence contracts/development/testing.md#independent-expectations The line of the arm and the place of the fingertip are the drill manual's, not a reading of the law.
 * @evidence contracts/development/testing.md#distinguishing-cases Four bodies of different stature and proportion; the arm's elevation, its fore-aft place, the wrist's line and the fingertip's place.
 * @evidence contracts/development/testing.md#execution-ownership Prepares polygon men and builds four short performances; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the source, how the salute is composed and the 4 scenarios with their bounds.
 */
export function test_human_motion_signature_salute(): void {
  const salute: IHumanActionLaw<Omit<touch.IParams, "target" | "with" | "kind" | "side" | "elbow">> = HumanActionRow.of("salute", touch, {
    target: { kind: "self", region: "templeRight" },
    with: "forefinger",
    kind: "hold",
    side: "right",
    elbow: "level",
  });
  const complaints: string[] = [];
  for (const name of [
    "f-small",
    "m-average",
    "m-large",
    "m-short-legged",
  ] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const performance: HumanPerformance = new HumanPerformance({
      seed: "salute",
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      laws: [salute],
      composition: HumanChain.extend({ salute }).subject("a").salute().node,
    });
    const placed: HumanSegment.ISegment = performance.segments("a")[0]!;
    const instant = (event: string): number =>
      placed.start +
      (placed.plan.events.find((e): boolean => e.name === event)?.share ?? 0) *
        placed.plan.duration;
    const reader: HumanSignature.IReader = HumanSignature.of(
      performance,
      "a",
      body,
      0,
    );
    const held: number = (instant("ready") + instant("relax")) / 2;
    const shoulder: IAutoMovieVector3 = HumanSignature.joint(
      reader,
      held,
      "rightUpperArm",
    );
    const elbow: IAutoMovieVector3 = HumanSignature.joint(
      reader,
      held,
      "rightLowerArm",
    );
    const elevation: number =
      (Math.asin(
        (elbow.y - shoulder.y) /
          Math.hypot(
            elbow.x - shoulder.x,
            elbow.y - shoulder.y,
            elbow.z - shoulder.z,
          ),
      ) *
        180) /
      Math.PI;
    if (Math.abs(elevation) > 10)
      complaints.push(
        `${name}: the upper arm lies ${elevation.toFixed(1)} degrees from the horizontal at the hold, within 10 expected (TC 3-21.5)`,
      );
    const wrist: IAutoMovieVector3 = HumanSignature.joint(
      reader,
      held,
      "rightHand",
    );
    const tip: IAutoMovieVector3 = HumanSignature.joint(
      reader,
      held,
      "rightIndexDistal",
    );
    const fore: number[] = [
      wrist.x - elbow.x,
      wrist.y - elbow.y,
      wrist.z - elbow.z,
    ];
    const hand: number[] = [tip.x - wrist.x, tip.y - wrist.y, tip.z - wrist.z];
    const bent: number =
      (Math.acos(
        Math.min(
          1,
          (fore[0]! * hand[0]! + fore[1]! * hand[1]! + fore[2]! * hand[2]!) /
            (Math.hypot(...fore) * Math.hypot(...hand)),
        ),
      ) *
        180) /
      Math.PI;
    if (bent > 15)
      complaints.push(
        `${name}: the hand lies ${bent.toFixed(1)} degrees off the forearm's line, within 15 expected (TC 3-21.5: hand and wrist straight)`,
      );
    const brow: IAutoMovieVector3 = HumanSignature.region(
      reader,
      "templeRight",
      held,
    );
    const gap: number = Math.hypot(
      tip.x - brow.x,
      tip.y - brow.y,
      tip.z - brow.z,
    );
    if (gap > 0.03)
      complaints.push(
        `${name}: the forefinger's last joint is ${(gap * 1000).toFixed(0)} mm from the right temple, within 30 mm expected (TC 3-21.5)`,
      );
    if (!(elbow.z > shoulder.z))
      complaints.push(
        `${name}: the elbow lies ${((elbow.z - shoulder.z) * 1000).toFixed(0)} mm ahead of the shoulder, ahead expected (TC 3-21.5)`,
      );
  }
  TestValidator.equals("the salute's arm", complaints, []);
}
