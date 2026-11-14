import {
  HumanChain,
  HumanPerformance,
  type IHumanBody,
  createHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Planning a sparring exchange costs in proportion to its exchanges: a
 * performance of straight punches each parried plans twice the exchanges in
 * not much more than twice the time.
 *
 * Each exchange is a straight punch at the face, anchored, answered by a
 * parry in time, then both back in their guard for 0.6 s. The two fighters
 * stand 1.3 arm lengths apart, the punching range of the striking captures.
 * Each film plans on bodies wrapped afresh from the same people, so no memo
 * of the first film is read by the second and each pays for its own poses.
 * The bound of 2.2 is a linear cost with 10 % of room. The first film also
 * pays the process's warm-up, which only lowers the ratio. Both films
 * together are bounded at 50 s, a coarse ceiling over the 22 to 37 s
 * measured, so that a cost per exchange grown many times over fails too.
 *
 * At this size the ratio does not tell the quadratic contact search this
 * spec was written for from a linear one: that search planned 2, 4 and 8
 * exchanges in 14, 30 and 88 s (2.2 then 2.9 times), and the fixed one in
 * 8, 14 and 33 s (1.7 then 2.3 times), measured outside the test runner;
 * sizes that show the square plainly take minutes to plan, since one
 * displayed pose costs 30 to 40 ms (#3517). The search's growth itself is
 * pinned exactly, by counting what it measures, in
 * `test_motion_contact_events_live_span`; this spec bounds the whole plan.
 *
 * Scenarios, the average man punching and the small woman parrying:
 * 1. Two exchanges and four exchanges each plan without a refusal.
 * 2. The four plan in at most 2.2 times the time of the two.
 * 3. Both plan in 50 s at most together.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Plans real performances through the public chain and times the planning; a plan whose cost per exchange grows plainly with the exchanges, or grows many times over, fails. The contact search's own square is pinned by its unit spec, as stated.
 * @evidence contracts/development/testing.md#independent-expectations A linear cost doubles with the exchanges; the room, the ceiling and the measured costs before the fix are stated, and nothing is read from the planner.
 * @evidence contracts/development/testing.md#distinguishing-cases Two sizes of one scene, so the ratio isolates growth from the cost of a pose.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and plans two films without sampling them; it runs locally and wherever CI runs the human motion tests, in about 22 s.
 * @evidence contracts/development/common.md#meaningful-documentation States the scene, why the bodies are wrapped afresh, the bounds with their measured basis, what the ratio cannot tell at this size and the 3 scenarios.
 */
export function test_human_motion_fight_sparring_scale(): void {
  const striker: IHumanBody = motionHumanBody("m-average");
  const defender: IHumanBody = motionHumanBody("f-small");
  const gap: number =
    1.3 *
    (striker.measure.upperArm + striker.measure.forearm + striker.measure.hand);
  const face = (subject: string) =>
    ({ kind: "person", subject, region: "face" }) as const;
  const plan = (exchanges: number): number => {
    let a: HumanChain = HumanChain.subject("a").guard({
      seconds: 0.8,
      facing: face("b"),
    });
    let b: HumanChain = HumanChain.subject("b").guard({
      seconds: 0.8,
      facing: face("a"),
    });
    for (let k: number = 1; k <= exchanges; k++) {
      a = a
        .punch({ technique: "straight", at: face("b") }, `punch${k}`)
        .guard({ seconds: 0.6, facing: face("b") });
      b = b
        .defend({ kind: "parry", against: `punch${k}`, outcome: "inTime" })
        .guard({ seconds: 0.6, facing: face("a") });
    }
    const start: number = performance.now();
    new HumanPerformance({
      seed: "sparring",
      performers: [
        {
          subject: "a",
          body: createHumanBody(striker.skeleton, striker.profile),
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
        {
          subject: "b",
          body: createHumanBody(defender.skeleton, defender.profile),
          at: { x: 0, y: 0, z: gap },
          yaw: 180,
          proficiency: { level: "trained" },
        },
      ],
      composition: a.with(b).node,
    });
    return (performance.now() - start) / 1000;
  };

  // 1. Both plan.
  const two: number = plan(2);
  const four: number = plan(4);

  // 2 and 3. Linear, and under the ceiling.
  TestValidator.predicate(
    `four exchanges plan in ${four.toFixed(1)} s, ${(four / two).toFixed(2)} times the ${two.toFixed(1)} s of two: 2.2 at most`,
    four / two <= 2.2,
  );
  TestValidator.predicate(
    `both plan in ${(two + four).toFixed(1)} s together: 50 s at most`,
    two + four <= 50,
  );
}
