import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  AutoMovieMotionHumanTouchEffector,
  HumanChain,
  HumanPartner,
  HumanPerformance,
  type HumanSegment,
  HumanSignature,
  type IHumanBody,
  touch,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A walking partner dance, lead and follow (`HumanPartner`'s dance rows):
 * the leader walks, the follower walks at the leader's speed by the
 * speed-matching law of a follower and comes to his right when he stops,
 * and her left palm then holds his near shoulder. A
 * follower that matches speed lags by the change of speed over the law's
 * gain (`walkFollowed`), so the two are side by side only once they stand;
 * a hold kept while walking is coupled travel, #3341's.
 *
 * The average man leads 4 m toward +Z at a slow walk; the small woman
 * starts in the hold, 0.4 m to his right, and follows him
 * (`danceFollow`, the speed-matching follower of `approach`); he stands
 * 4 s after the lead, and once she has come beside him her left palm is
 * laid on his right shoulder (`danceHold`).
 *
 * Scenarios:
 * 1. The lead, its hold and the follow plan.
 * 2. 1.5 s after the lead ends the follower's hips joint lies within
 *    0.25 m of the place 0.4 m to the leader's right of his hips joint
 *    (provisional band about the hold's distance).
 * 3. Over the second half of the lead the follower's hips travel at least
 *    0.7 of the leader's (provisional): she keeps his pace.
 * 4. At the middle of the hold her left palm lies within 30 mm of his right
 *    shoulder region (provisional, the touch's 15 mm
 *    doubled for a partner who may still be settling).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds the two performers through the public chain and reads displayed joints and regions; a follower left behind, off his side, or a hold off her shoulder fails.
 * @evidence contracts/development/testing.md#independent-expectations The side and distance are the row's own declared hold; the bands around them are provisional and stated.
 * @evidence contracts/development/testing.md#distinguishing-cases A leader moving and a follower closing, then keeping pace.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds one two-person performance; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the stage and the 4 scenarios with their bounds.
 */
export function test_human_motion_partner_dance(): void {
  const lead: IHumanBody = motionHumanBody("m-average");
  const follow: IHumanBody = motionHumanBody("f-small");
  const complaints: string[] = [];
  const mm = (metres: number): string => (metres * 1000).toFixed(0);

  // 1. It plans.
  let performance: HumanPerformance;
  try {
    performance = new HumanPerformance({
      seed: "dance",
      laws: [
        HumanPartner.danceLead,
        HumanPartner.danceFollow,
        HumanPartner.danceHold,
      ],
      performers: [
        {
          subject: "a",
          body: lead,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
        {
          subject: "b",
          body: follow,
          at: { x: -0.4, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a")
        .registered("danceLead", { to: { x: 0, y: 0, z: 4 } })
        .stand({ seconds: 4 })
        .with(
          HumanChain.subject("b")
            .registered("danceFollow", {
              target: { kind: "person", subject: "a", region: "sternum" },
            })
            .registered("danceHold", {
              target: { kind: "person", subject: "a", region: "shoulderRight" },
            }),
        ).node,
    });
  } catch (error) {
    TestValidator.equals(
      "a partner dance plans",
      error instanceof Error ? error.message : String(error),
      "",
    );
    return;
  }
  const leading: HumanSegment.ISegment = performance.segments("a")[0]!;
  const readers = {
    a: HumanSignature.of(performance, "a", lead, 0),
    b: HumanSignature.of(performance, "b", follow, 0),
  };
  const hips = (who: "a" | "b", seconds: number): IAutoMovieVector3 =>
    HumanSignature.joint(readers[who], seconds, "hips");

  // 2. At his right once he stands.
  const settled: number = leading.end + 1.5;
  const his: IAutoMovieVector3 = hips("a", settled);
  const hers: IAutoMovieVector3 = hips("b", settled);
  const beside: number = Math.hypot(hers.x - (his.x - 0.4), hers.z - his.z);
  if (!(beside <= 0.25))
    complaints.push(
      `1.5 s after the lead ends the follower's hips lie ${mm(beside)} mm from 0.4 m to the leader's right, within 250 mm expected`,
    );
  // 3. At his pace.
  const half: number = (leading.start + leading.end) / 2;
  const travel = (who: "a" | "b"): number =>
    hips(who, leading.end).z - hips(who, half).z;
  if (!(travel("b") >= 0.7 * travel("a")))
    complaints.push(
      `over the second half of the lead the follower travels ${mm(travel("b"))} mm against the leader's ${mm(travel("a"))} mm, at least 0.7 of it expected`,
    );

  // 4. The hold.
  const held: HumanSegment.ISegment | undefined = performance.segments("b")[1];
  if (held === undefined)
    complaints.push("the hold is not placed after the follow");
  else {
    const at = (event: string): number =>
      held.start +
      (held.plan.events.find((e): boolean => e.name === event)?.share ?? NaN) *
        held.plan.duration;
    const middle: number = (at("strokeEnd") + at("relax")) / 2;
    const palm: IAutoMovieVector3 = AutoMovieMotionHumanTouchEffector.point(
      follow,
      performance.bones("b", middle),
      "left",
      touch.EFFECTORS.palm,
    );
    const shoulder: IAutoMovieVector3 = HumanSignature.region(
      readers.a,
      "shoulderRight",
      middle,
    );
    const off: number = Math.hypot(
      palm.x - shoulder.x,
      palm.y - shoulder.y,
      palm.z - shoulder.z,
    );
    if (!(off <= 0.03))
      complaints.push(
        `at the middle of the hold (${middle.toFixed(2)} s) her left palm lies ${mm(off)} mm from his right shoulder, within 30 mm expected`,
      );
  }
  TestValidator.equals("a walking partner dance", complaints, []);
}
