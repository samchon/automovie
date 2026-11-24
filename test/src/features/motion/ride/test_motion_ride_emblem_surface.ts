import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanGesture,
  AutoMovieMotionHumanTouch,
  HumanChain,
  HumanPerformance,
  HumanSignature,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../internal/motionHumanBody";

const { AutoMovieMotionHumanTouchEffector } = AutoMovieMotionHumanTouch;

const { HumanEmblem } = AutoMovieMotionHumanGesture;

/**
 * A blown kiss is sent: after the fingertips leave the lips the open hand
 * sweeps forward, away from the face (#3345), `blownKiss` followed by
 * `blownKissSend`.
 *
 * For either hand on the same body, at the middle of the send's hold:
 *
 * 1. The two rows plan one after the other.
 * 2. The requested palm lies at least 0.25 m ahead of the mouth (provisional: an
 *    arm's half reach, far enough to read as sent and not as a hand at the
 *    chin).
 * 3. The palm lies no higher than the mouth and no lower than the chest's height:
 *    the hand is offered forward, not dropped (provisional).
 *
 * Scenarios:
 *
 * 1. Observe a hand leaving the lips and reaching the forward, open-palm send
 *    pose.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Registers the two rows, performs them through the public chain and reads the displayed palm and mouth; a send that stays at the lips, drops to the waist or is refused fails.
 * @evidence contracts/development/testing.md#independent-expectations The bounds are the test's own, stated provisional, and name what the gesture must read as; none is read from the row.
 * @evidence contracts/development/testing.md#distinguishing-cases The send must use the requested hand on either side.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds two short performances, each read at one instant; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 3 scenarios with their bounds.
 */
export function test_motion_ride_emblem_surface(): void {
  const laws: IAutoMovieMotionHumanActionLaw<never>[] = [
    HumanEmblem.blownKiss,
    HumanEmblem.blownKissSend,
  ];
  const complaints: string[] = [];
  for (const side of ["left", "right"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
    try {
      // 1. The kiss, then its send.
      const performance: IAutoMovieMotionHumanPerformance =
        new HumanPerformance({
          seed: "sweep",
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
            .registered("blownKiss", { hand: side })
            .registered("blownKissSend", { hand: side }).node,
        });
      const placed: IAutoMovieMotionHumanSegment =
        performance.segments("a")[1]!;
      const instant = (event: string): number =>
        placed.start +
        (placed.plan.events.find((e): boolean => e.name === event)?.share ??
          NaN) *
          placed.plan.duration;
      const held: number = (instant("strokeEnd") + instant("relax")) / 2;
      const palm: IAutoMovieVector3 = AutoMovieMotionHumanTouchEffector.point(
        body,
        performance.bones("a", held),
        side,
        AutoMovieMotionHumanTouch.touch.EFFECTORS.palm,
      );
      const mouth: IAutoMovieVector3 = HumanSignature.region(
        HumanSignature(performance, "a", body, 0),
        "mouth",
        held,
      );

      // 2. Sent forward.
      if (!(palm.z - mouth.z >= 0.25))
        complaints.push(
          `${side}: the palm lies ${((palm.z - mouth.z) * 1000).toFixed(0)} mm ahead of the mouth, at least 250 mm expected`,
        );

      // 3. Offered, not dropped.
      if (!(palm.y <= mouth.y && palm.y >= body.measure.chestHeight))
        complaints.push(
          `${side}: the palm lies ${palm.y.toFixed(3)} m above the floor, between the chest at ${body.measure.chestHeight.toFixed(3)} and the mouth at ${mouth.y.toFixed(3)} m expected`,
        );
    } catch (error) {
      complaints.push(
        `${side}: expected to plan, got ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  TestValidator.equals("a blown kiss is sent forward", complaints, []);
}
