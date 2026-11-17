import type { AutoMovieMotionHumanChannel, IAutoMovieMotionHumanActionContext, IAutoMovieMotionHumanActionLaw, IAutoMovieMotionHumanActionPlan, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanChain, IAutoMovieMotionHumanPerformance, IAutoMovieMotionHumanPosture } from "@automovie/interface";
import { HumanChain, HumanPerformance, HumanRefusal } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/** A one-second overlay that bends the named joints of a hand and claims what it is given. */
const bend = (
  name: string,
  claims: readonly AutoMovieMotionHumanChannel.Claim[],
  joints: IAutoMovieMotionHumanPosture["joints"],
): IAutoMovieMotionHumanActionLaw<object> => ({
  name,
  interrupts: {},
  overlay: true,
  plan: (context: IAutoMovieMotionHumanActionContext<object>): IAutoMovieMotionHumanActionPlan => ({
    duration: 1,
    events: [],
    contacts: [],
    channels: claims,
    posture: (): IAutoMovieMotionHumanPosture => ({
      ...context.entry.posture,
      joints: { ...context.entry.posture.joints, ...joints },
    }),
  }),
});

/**
 * Overlays that claim single digits of a hand (#3445).
 *
 * The average man stands for three seconds; overlays are performed over the
 * stand, which yields both hands.
 *
 * Scenarios:
 *
 * 1. An overlay claiming the right thumb alone bends the thumb and leaves the
 *    forefinger as the stand has it, mid-overlay.
 * 2. Two overlays of one span claiming the thumb and the forefinger of the
 *    same hand compose: both plan, and each bends only its digit.
 * 3. An overlay claiming the whole right hand clashes with one claiming its
 *    thumb in the same span: refused, the refusal naming the thumb.
 * 4. Two overlays claiming the same digit in one span are refused.
 * 5. A digit of the other hand never clashes: the left thumb with the right
 *    hand's claim plans.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Registers overlay laws that claim digits, performs them over a stand and reads the displayed joints or the refusal.
 * @evidence contracts/development/testing.md#independent-expectations The hand-digit partition: a hand covers its digits, a digit only itself, two digits of one hand are disjoint.
 * @evidence contracts/development/testing.md#distinguishing-cases A lone digit, two disjoint digits, a hand against its digit, the same digit twice, and the other hand.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit test preparing one polygon man; no host.
 * @evidence contracts/development/common.md#meaningful-documentation States the cast and the five scenarios.
 */
export function test_human_motion_core_digit_claims(): void {
  const complaints: string[] = [];
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const laws: IAutoMovieMotionHumanActionLaw<never>[] = [
    bend("thumbBend", ["rightThumb"], {
      rightThumbProximal: [40, 0, 0],
      rightThumbDistal: [40, 0, 0],
    }),
    bend("indexBend", ["rightIndex"], {
      rightIndexProximal: [60, 0, 0],
      rightIndexIntermediate: [60, 0, 0],
    }),
    bend("handBend", ["rightHand"], { rightMiddleProximal: [60, 0, 0] }),
    bend("leftThumbBend", ["leftThumb"], { leftThumbProximal: [40, 0, 0] }),
  ] as unknown as IAutoMovieMotionHumanActionLaw<never>[];
  const perform = (over: readonly string[]): IAutoMovieMotionHumanPerformance =>
    new HumanPerformance({
      seed: "claims",
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
      composition: over.reduce(
        (chain: IAutoMovieMotionHumanChain, name: string): IAutoMovieMotionHumanChain =>
          chain.over((o) => o.registered(name)),
        HumanChain.subject("a").stand({ seconds: 3 }),
      ).node,
    });
  const flexion = (
    p: IAutoMovieMotionHumanPerformance,
    bone: string,
    seconds: number,
  ): number =>
    p.pose("a", seconds).joints.find((j) => j.bone === bone)?.flexion ?? 0;

  // 1, 2. A lone digit, then two disjoint digits.
  for (const over of [["thumbBend"], ["thumbBend", "indexBend"]] as const)
    try {
      const p: IAutoMovieMotionHumanPerformance = perform(over);
      const mid: number = p.overlays("a")[0]!.start + 0.5;
      if (!(Math.abs(flexion(p, "rightThumbProximal", mid) - 40) <= 1e-6))
        complaints.push(
          `${over.join(" + ")}: the thumb is not bent to 40 degrees mid-overlay`,
        );
      const index: number = flexion(p, "rightIndexProximal", mid);
      if (
        over.length === 1 &&
        Math.abs(index - flexion(p, "rightIndexProximal", 0)) > 1e-6
      )
        complaints.push("a thumb claim moved the forefinger");
      if (over.length === 2 && !(Math.abs(index - 60) <= 1e-6))
        complaints.push(
          "the forefinger overlay did not bend the forefinger beside the thumb's",
        );
    } catch (error) {
      complaints.push(
        `${over.join(" + ")}: expected to plan, got ${(error as Error).message}`,
      );
    }

  // 3, 4. Clashes.
  for (const [over, digit] of [
    [["handBend", "thumbBend"], "rightThumb"],
    [["thumbBend", "thumbBend"], "rightThumb"],
  ] as const)
    try {
      perform(over);
      complaints.push(`${over.join(" + ")}: expected a refusal`);
    } catch (error) {
      if (
        !(error instanceof HumanRefusal) ||
        !(error as Error).message.includes(digit)
      )
        complaints.push(
          `${over.join(" + ")}: refused with "${(error as Error).message}", the clash on ${digit} expected`,
        );
    }

  // 5. The other hand's digit.
  try {
    perform(["handBend", "leftThumbBend"]);
  } catch (error) {
    complaints.push(
      `the right hand and the left thumb: expected to plan, got ${(error as Error).message}`,
    );
  }
  TestValidator.equals("overlays that claim single digits", complaints, []);
}
