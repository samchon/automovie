import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  AutoMovieMotionHumanTouchEffector,
  HumanChain,
  HumanEmblem,
  HumanPerformance,
  type HumanSegment,
  HumanSignature,
  type IHumanActionLaw,
  type IHumanBody,
  touch,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A blown kiss is sent: after the fingertips leave the lips the open hand
 * sweeps forward, away from the face (#3345), `blownKiss` followed by
 * `blownKissSend`.
 *
 * Scenarios, on the small woman and the average man, at the middle of the
 * send's hold:
 * 1. The two rows plan one after the other.
 * 2. The right palm lies at least 0.25 m ahead of the mouth (provisional: an
 *    arm's half reach, far enough to read as sent and not as a hand at the
 *    chin).
 * 3. The palm lies no higher than the mouth and no lower than the chest's
 *    height: the hand is offered forward, not dropped (provisional).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Registers the two rows, performs them through the public chain and reads the displayed palm and mouth; a send that stays at the lips, drops to the waist or is refused fails.
 * @evidence contracts/development/testing.md#independent-expectations The bounds are the test's own, stated provisional, and name what the gesture must read as; none is read from the row.
 * @evidence contracts/development/testing.md#distinguishing-cases The send on two statures; the fingertips at the lips are `test_human_motion_hand_verdicts_kiss`'s.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds two short performances, each read at one instant; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 3 scenarios with their bounds.
 */
export function test_human_motion_emblem_kiss_sweep(): void {
  const laws: IHumanActionLaw<never>[] = [
    HumanEmblem.blownKiss,
    HumanEmblem.blownKissSend,
  ];
  const complaints: string[] = [];
  for (const name of ["f-small", "m-average"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    try {
      // 1. The kiss, then its send.
      const performance: HumanPerformance = new HumanPerformance({
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
          .registered("blownKiss", {})
          .registered("blownKissSend", {}).node,
      });
      const placed: HumanSegment.ISegment = performance.segments("a")[1]!;
      const instant = (event: string): number =>
        placed.start +
        (placed.plan.events.find((e): boolean => e.name === event)?.share ??
          NaN) *
          placed.plan.duration;
      const held: number = (instant("strokeEnd") + instant("relax")) / 2;
      const palm: IAutoMovieVector3 = AutoMovieMotionHumanTouchEffector.point(
        body,
        performance.bones("a", held),
        "right",
        touch.EFFECTORS.palm,
      );
      const mouth: IAutoMovieVector3 = HumanSignature.region(
        HumanSignature.of(performance, "a", body, 0),
        "mouth",
        held,
      );

      // 2. Sent forward.
      if (!(palm.z - mouth.z >= 0.25))
        complaints.push(
          `${name}: the palm lies ${((palm.z - mouth.z) * 1000).toFixed(0)} mm ahead of the mouth, at least 250 mm expected`,
        );

      // 3. Offered, not dropped.
      if (!(palm.y <= mouth.y && palm.y >= body.measure.chestHeight))
        complaints.push(
          `${name}: the palm lies ${palm.y.toFixed(3)} m above the floor, between the chest at ${body.measure.chestHeight.toFixed(3)} and the mouth at ${mouth.y.toFixed(3)} m expected`,
        );
    } catch (error) {
      complaints.push(
        `${name}: expected to plan, got ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  TestValidator.equals("a blown kiss is sent forward", complaints, []);
}
