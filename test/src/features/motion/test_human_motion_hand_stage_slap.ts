import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  AutoMovieMotionHumanTouchEffector,
  HumanChain,
  HumanPerformance,
  type HumanSegment,
  HumanSignature,
  type IHumanBody,
  type IHumanContactWindow,
  touch,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A stage slap misses on purpose (#3347): `touch` with `clear` sends the
 * palm past the partner's cheek at a clearance off its surface, at the
 * stroke's speed, and declares no contact.
 *
 * The small woman and the average man each tap the average man's left jaw
 * once with the palm from 0.35 m, `clear` half a hand.
 *
 * Scenarios, read every 1/48 s through the touch:
 * 1. The touch plans and declares no contact window on the right hand.
 * 2. The palm never comes within 40 mm of the jaw (provisional: a stage
 *    slap's safe margin, less than the half hand asked).
 * 3. The palm passes within 0.3 m of the jaw (provisional: the camera reads
 *    a hand that close as a hit).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds two two-person performances through the public chain and reads the displayed palm against the partner's displayed jaw; a slap that lands, one that never comes near, or a declared contact fails.
 * @evidence contracts/development/testing.md#independent-expectations The 40 mm and the 0.3 m are what a stage slap must be, stated provisional; neither is read from the law.
 * @evidence contracts/development/testing.md#distinguishing-cases Two statures against one partner; the slap that lands is `test_human_motion_hand_reach_up`'s.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds two short performances; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the stage and the 3 scenarios with their bounds.
 */
export function test_human_motion_hand_stage_slap(): void {
  const partner: IHumanBody = motionHumanBody("m-average");
  const complaints: string[] = [];
  const mm = (metres: number): string => (metres * 1000).toFixed(0);
  for (const name of ["f-small", "m-average"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    try {
      // 1. It plans, with no contact on the hand.
      const performance: HumanPerformance = new HumanPerformance({
        seed: "stage",
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
          {
            subject: "b",
            body: partner,
            at: { x: 0, y: 0, z: 0.35 },
            yaw: 180,
            proficiency: { level: "trained" },
          },
        ],
        composition: HumanChain.subject("a")
          .stand({ seconds: 0.3 })
          .touch({
            target: { kind: "person", subject: "b", region: "jawLeft" },
            with: "palm",
            kind: "tap",
            count: 1,
            clear: 0.5,
          })
          .with(HumanChain.subject("b").stand({ seconds: 3 })).node,
      });
      const placed: HumanSegment.ISegment = performance.segments("a")[1]!;
      if (
        placed.plan.contacts.some(
          (c: IHumanContactWindow): boolean => c.part === "rightHand",
        )
      )
        complaints.push(`${name}: the stage slap declares a contact on the right hand`);

      // 2, 3. Near but never on.
      const theirs: HumanSignature.IReader = HumanSignature.of(
        performance,
        "b",
        partner,
        0,
      );
      let nearest: number = Infinity;
      let when: number = NaN;
      for (
        let seconds: number = placed.start;
        seconds <= placed.end;
        seconds += 1 / 48
      ) {
        const palm: IAutoMovieVector3 = AutoMovieMotionHumanTouchEffector.point(
          body,
          performance.bones("a", seconds),
          "right",
          touch.EFFECTORS.palm,
        );
        const jaw: IAutoMovieVector3 = HumanSignature.region(
          theirs,
          "jawLeft",
          seconds,
        );
        const gap: number = Math.hypot(
          palm.x - jaw.x,
          palm.y - jaw.y,
          palm.z - jaw.z,
        );
        if (gap < nearest) {
          nearest = gap;
          when = seconds;
        }
      }
      if (!(nearest >= 0.04))
        complaints.push(
          `${name}: the palm comes ${mm(nearest)} mm from the jaw at ${when.toFixed(2)} s, at least 40 mm expected`,
        );
      if (!(nearest <= 0.3))
        complaints.push(
          `${name}: the palm comes no nearer than ${mm(nearest)} mm to the jaw, within 300 mm expected`,
        );
    } catch (error) {
      complaints.push(
        `${name}: expected to plan, got ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  TestValidator.equals("a stage slap misses near", complaints, []);
}
