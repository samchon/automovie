import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanChain,
  HumanFloorRoll,
  HumanPerformance,
  type HumanSegment,
  HumanSignature,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A forward and a backward roll on the floor (`HumanFloorRoll`): the body
 * tucks over its feet, rolls once round over its back without leaving the
 * floor, and rises where the roll carried it.
 *
 * Scenarios, on the small woman and the average man, each row after a
 * 0.3 s stand, read every 1/24 s:
 * 1. Both rows plan.
 * 2. Through the roll, from `tucked` to `rolled`, the lowest joint centre
 *    stays within 0.15 m of the floor (provisional: the ankle's own height
 *    and a joint's depth under the skin): no flight.
 * 3. At `over` the head joint lies below the hips joint: the body has
 *    turned over.
 * 4. The hips joint ends at least 0.4 m along the roll's way from where it
 *    started, forward for the forward roll and back for the backward one
 *    (provisional: a tucked body's half turn).
 * 5. Through the crouch, until `tucked`, each ankle stays within 5 mm of
 *    where it stood (the campaign's bound for a planted support).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds each roll through the public chain and reads displayed joints; a body that leaves the floor, never turns over, rolls the wrong way or slides its feet while crouching fails.
 * @evidence contracts/development/testing.md#independent-expectations Staying on the floor and turning over are what a roll is; the 5 mm is the campaign's bound; the other bounds are stated provisional.
 * @evidence contracts/development/testing.md#distinguishing-cases Two directions on two statures.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds four short performances; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 5 scenarios with their bounds.
 */
export function test_human_motion_floor_roll(): void {
  const complaints: string[] = [];
  const mm = (metres: number): string => (metres * 1000).toFixed(0);
  for (const name of ["f-small", "m-average"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    for (const [row, sign] of [
      ["forwardRoll", 1],
      ["backwardRoll", -1],
    ] as const) {
      const label: string = `${name} ${row}`;
      let performance: HumanPerformance;
      try {
        performance = new HumanPerformance({
          seed: "roll",
          laws: [HumanFloorRoll.forwardRoll, HumanFloorRoll.backwardRoll],
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
      } catch (error) {
        complaints.push(
          `${label}: expected to plan, got ${error instanceof Error ? error.message : String(error)}`,
        );
        continue;
      }
      const placed: HumanSegment.ISegment = performance.segments("a")[1]!;
      const at = (event: string): number =>
        placed.start +
        (placed.plan.events.find((e): boolean => e.name === event)?.share ??
          NaN) *
          placed.plan.duration;
      const reader: HumanSignature.IReader = HumanSignature.of(
        performance,
        "a",
        body,
        0,
      );

      // 2. On the floor throughout.
      let highest: number = -Infinity;
      let when: number = NaN;
      for (
        let seconds: number = at("tucked");
        seconds <= at("rolled");
        seconds += 1 / 24
      ) {
        const lowest: number = Math.min(
          ...[...performance.bones("a", seconds).values()].map(
            (b): number => b.worldPosition.y,
          ),
        );
        if (lowest > highest) {
          highest = lowest;
          when = seconds;
        }
      }
      if (!(highest <= 0.15))
        complaints.push(
          `${label}: at ${when.toFixed(2)} s the lowest joint centre is ${mm(highest)} mm above the floor, within 150 mm expected`,
        );

      // 3. Over.
      const over: number = at("over");
      if (
        !(
          HumanSignature.joint(reader, over, "head").y <
          HumanSignature.joint(reader, over, "hips").y
        )
      )
        complaints.push(`${label}: at over the head is not below the hips`);

      // 4. Carried along its way.
      const travel: number =
        sign *
        (HumanSignature.joint(reader, placed.end, "hips").z -
          HumanSignature.joint(reader, placed.start, "hips").z);
      if (!(travel >= 0.4))
        complaints.push(
          `${label}: the hips travel ${mm(travel)} mm along the roll, at least 400 mm expected`,
        );

      // 5. Planted while crouching.
      for (const bone of ["leftFoot", "rightFoot"] as const) {
        const from: IAutoMovieVector3 = HumanSignature.joint(
          reader,
          placed.start,
          bone,
        );
        let worst: number = 0;
        for (
          let seconds: number = placed.start;
          seconds <= at("tucked");
          seconds += 1 / 24
        ) {
          const here: IAutoMovieVector3 = HumanSignature.joint(
            reader,
            seconds,
            bone,
          );
          worst = Math.max(
            worst,
            Math.hypot(here.x - from.x, here.y - from.y, here.z - from.z),
          );
        }
        if (!(worst <= 0.005))
          complaints.push(
            `${label}: the ${bone} joint moves ${mm(worst)} mm while crouching, within 5 mm expected`,
          );
      }
    }
  }
  TestValidator.equals("forward and backward rolls", complaints, []);
}
