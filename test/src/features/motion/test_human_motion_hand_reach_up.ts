import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  AutoMovieMotionHumanTouchEffector,
  HumanChain,
  HumanPerformance,
  type HumanSegment,
  HumanSignature,
  HumanStageFight,
  type IHumanActionLaw,
  type IHumanBody,
  touch,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A hand reaches a region above its own shoulder: a short person slaps a
 * tall person's cheek, forehand and backhand, standing 0.35 m from him.
 *
 * The small woman is 1.49 m tall and the average man's cheek stands 1.66 m
 * above the floor, 0.50 m above her shoulder joint, with an arm (upper arm
 * and forearm) of 0.46 m. An adult reaches well above her own head: the
 * shoulder girdle rises with the arm and the heels leave the floor, so the
 * cheek is within her reach, and the touch must perform it, not refuse it.
 * Leaning forward does not help, since it lowers the shoulder.
 *
 * Scenarios:
 * 1. The small woman's forehand slap on the average man's left cheek and her
 *    backhand on his right cheek both plan.
 * 2. At the slap's `ready`, the palm, and for the backhand the back of the
 *    hand, lies within 15 mm of the cheek (the campaign's bound for a
 *    contact at its event).
 * 3. Her toes' joints stay where they stood within 5 mm from the start to
 *    `ready` (the campaign's bound for a planted support), and the pelvis is
 *    back within 5 mm of its starting height at the slap's end.
 * 4. The average man slapping the average man, whose cheek is 0.22 m above
 *    his own shoulder and inside his arm, keeps his pelvis within 5 mm of
 *    its starting height through the slap: the body rises only when the arm
 *    needs it.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Registers the rows, builds the performances through the public chain and reads displayed joints and regions; a refused slap, a hand short of the cheek, a foot that leaves its place or a needless rise fails.
 * @evidence contracts/development/testing.md#independent-expectations That an adult of her height reaches a face 0.25 m above her own is ordinary human reach; the 15 mm and 5 mm bounds are the campaign's (#3354), not readings of the law.
 * @evidence contracts/development/testing.md#distinguishing-cases The palm and the back of the hand on the two cheeks; a pair that needs the rise and a pair that must not take it.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds three short two-person performances; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule with its measures and the 4 scenarios with their bounds.
 */
export function test_human_motion_hand_reach_up(): void {
  const laws: IHumanActionLaw<never>[] = [
    HumanStageFight.slap,
    HumanStageFight.backhand,
  ];
  const complaints: string[] = [];
  const gap = (p: IAutoMovieVector3, q: IAutoMovieVector3): number =>
    Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z);
  const mm = (metres: number): string => (metres * 1000).toFixed(0);
  for (const [who, row, region, part] of [
    ["f-small", "slap", "jawLeft", "palm"],
    ["f-small", "backhand", "jawRight", "handBack"],
    ["m-average", "slap", "jawLeft", "palm"],
  ] as const) {
    const body: IHumanBody = motionHumanBody(who);
    const partner: IHumanBody = motionHumanBody("m-average");
    const label: string = `${who} ${row}`;
    let performance: HumanPerformance;
    try {
      performance = new HumanPerformance({
        seed: "reach",
        laws,
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
          .registered(row, {
            target: { kind: "person", subject: "b", region },
          })
          .with(HumanChain.subject("b").stand({ seconds: 2.5 })).node,
      });
    } catch (error) {
      // 1. The slap plans.
      complaints.push(
        `${label}: ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }
    const placed: HumanSegment.ISegment = performance.segments("a")[1]!;
    const ready: number =
      placed.start +
      (placed.plan.events.find((e): boolean => e.name === "ready")?.share ??
        NaN) *
        placed.plan.duration;
    const mine: HumanSignature.IReader = HumanSignature.of(
      performance,
      "a",
      body,
      0,
    );
    const theirs: HumanSignature.IReader = HumanSignature.of(
      performance,
      "b",
      partner,
      0,
    );
    const rise = (seconds: number): number =>
      HumanSignature.joint(mine, seconds, "hips").y -
      HumanSignature.joint(mine, placed.start, "hips").y;

    // 2. The hand is on the cheek at `ready`.
    const off: number = gap(
      AutoMovieMotionHumanTouchEffector.point(
        body,
        performance.bones("a", ready),
        "right",
        touch.EFFECTORS[part],
      ),
      HumanSignature.region(theirs, region, ready),
    );
    if (!(off <= 0.015))
      complaints.push(
        `${label}: the ${part} lies ${mm(off)} mm from the ${region} at ready, within 15 mm expected`,
      );

    // 3. The forefeet stay planted, and the body comes back down.
    for (const toes of ["leftToes", "rightToes"] as const) {
      const moved: number = gap(
        HumanSignature.joint(mine, ready, toes),
        HumanSignature.joint(mine, placed.start, toes),
      );
      if (!(moved <= 0.005))
        complaints.push(
          `${label}: the ${toes} joint moved ${mm(moved)} mm by ready, within 5 mm expected`,
        );
    }
    if (!(Math.abs(rise(placed.end)) <= 0.005))
      complaints.push(
        `${label}: the pelvis ends ${mm(rise(placed.end))} mm from its starting height, within 5 mm expected`,
      );

    // 4. A cheek inside the arm is reached without rising.
    if (who === "m-average" && !(Math.abs(rise(ready)) <= 0.005))
      complaints.push(
        `${label}: the pelvis rises ${mm(rise(ready))} mm for a cheek inside the arm, within 5 mm expected`,
      );
  }
  TestValidator.equals("a hand reaches above its shoulder", complaints, []);
}
