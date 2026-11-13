import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HUMAN_LEXICON,
  HumanChain,
  HumanPerformance,
  HumanSignature,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A follower follows a person who walks: when the leader has walked on and
 * stopped, the follower stands behind them at a social distance, and has
 * not overtaken them on the way.
 *
 * Scenarios, the average man following the small woman (the faster walker
 * behind the slower, the order in which a follower could overtake); the
 * leader stands 3 m ahead with the back to the follower, then walks 4 m
 * straight on while the follower follows:
 * 1. When both have stopped, the follower's chest is 1.2 to 2.1 m from the
 *    leader's upper back, the close phase of Hall's social distance (Hall
 *    1966), measured horizontally.
 * 2. At every quarter of a second the follower's hips are behind the
 *    leader's along the way: a follower never passes the leader (the
 *    pursuit family's acceptance).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs a follow of a walking leader through the public chain and reads both displayed bodies; a follower who stops where the leader started, or walks past them, fails.
 * @evidence contracts/development/testing.md#independent-expectations The band is Hall's and the order along the way is what following means; neither is read from the approach law.
 * @evidence contracts/development/testing.md#distinguishing-cases A tall follower behind a short leader, the order that could overtake; a leader who moves, where a standing one is another test's. Limitation: the reverse order is not run, as one performance takes about 18 s to build and two exceeded the 60 s bound.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds one short performance in memory; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 2 scenarios with their bounds and source.
 */
export function test_human_motion_travel_follow_moving(): void {
  const complaints: string[] = [];
  for (const names of [["m-average", "f-small"]] as const) {
    const follower: IHumanBody = motionHumanBody(names[0]);
    const leader: IHumanBody = motionHumanBody(names[1]);
    const label: string = `${names[0]} following ${names[1]}`;
    let performance: HumanPerformance;
    try {
      performance = new HumanPerformance({
        seed: "follow",
        laws: [...HUMAN_LEXICON.pursuit!],
        performers: [
          {
            subject: "a",
            body: follower,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
          {
            subject: "b",
            body: leader,
            at: { x: 0, y: 0, z: 3 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        composition: HumanChain.subject("b")
          .stand({ seconds: 0.3 })
          .walk({ to: { x: 0, y: 0, z: 7 } })
          .with(
            HumanChain.subject("a")
              .stand({ seconds: 0.3 })
              .registered("follow", {
                target: { kind: "person", subject: "b", region: "sternum" },
              }),
          ).node,
      });
    } catch (error) {
      complaints.push(
        `${label}: ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }
    const a: HumanSignature.IReader = HumanSignature.of(
      performance,
      "a",
      follower,
      0,
    );
    const b: HumanSignature.IReader = HumanSignature.of(
      performance,
      "b",
      leader,
      0,
    );
    const end: number = performance.duration;
    const chest: IAutoMovieVector3 = HumanSignature.region(a, "sternum", end);
    const back: IAutoMovieVector3 = HumanSignature.region(b, "upperBack", end);
    const gap: number = Math.hypot(chest.x - back.x, chest.z - back.z);
    if (gap < 1.2 || gap > 2.1)
      complaints.push(
        `${label}: when both have stopped the follower's chest is ${gap.toFixed(3)} m from the leader's back, 1.2 to 2.1 m expected`,
      );
    const along = (reader: HumanSignature.IReader, t: number): number =>
      (HumanSignature.joint(reader, t, "leftUpperLeg").z +
        HumanSignature.joint(reader, t, "rightUpperLeg").z) /
      2;
    let ahead: number = -Infinity;
    for (const t of HumanSignature.times(0, end, 4))
      ahead = Math.max(ahead, along(a, t) - along(b, t));
    if (ahead >= 0)
      complaints.push(
        `${label}: the follower's hips come ${ahead.toFixed(3)} m ahead of the leader's, always behind expected`,
      );
  }
  TestValidator.equals("a follower follows a walking leader", complaints, []);
}
