import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanRest,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditTangle,
  poseBones,
  resolveHumanPosture,
  rest,
} from "@automovie/motions/internal";
import { HumanVerdicts } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { humanFixture } from "../../../internal/fixtures/humanFixture";
import { motionActionContext } from "../../../internal/motionActionContext";

/**
 * `rest`'s plan carries both hands onto their named place and holds them
 * there, every arm and digit clear of the trunk and the other hand by the
 * skin's give (`HumanVerdicts.SKIN`) as the posture resolves.
 *
 * Scenarios:
 *
 * 1. For both stored bodies and the pocket, hip, crossed-arms, clasped-behind
 *    and behind-head places, the plan arrives at its `placed` event.
 * 2. At a third of the way, two thirds and the arrival, the pair the place
 *    brings nearest (a hand and the hips, the forearms, a finger and the hips
 *    or the other hand) overlaps by no more than the skin's give.
 */
export async function test_unit_motions_everyday_rest_plan(): Promise<void> {
  const pairs: readonly [
    IAutoMovieMotionHumanRest.Place,
    AutoMovieHumanoidBone,
    AutoMovieHumanoidBone,
  ][] = [
    ["pocket", "rightHand", "hips"],
    ["hip", "leftHand", "hips"],
    ["crossed", "rightLowerArm", "leftLowerArm"],
    ["claspedBehind", "leftIndexDistal", "hips"],
    ["behindHead", "leftIndexProximal", "rightHand"],
  ];
  for (const name of humanFixture.NAMES) {
    const body: IAutoMovieMotionHumanBody = await humanFixtureBody(name);
    for (const [place, a, b] of pairs) {
      const plan: IAutoMovieMotionHumanActionPlan = rest.plan(
        motionActionContext(body, { left: place, right: place }),
      );
      const placed: IAutoMovieMotionEvent | undefined = plan.events.find(
        (e: IAutoMovieMotionEvent): boolean => e.name === "placed",
      );
      TestValidator.predicate(`${name} ${place}: arrives`, placed !== undefined);
      const arrival: number = placed!.share * plan.duration;
      for (const t of [arrival / 3, (2 * arrival) / 3, arrival]) {
        const pair:
          | ReturnType<typeof AutoMovieMotionHumanAuditTangle.pose>[number]
          | undefined = AutoMovieMotionHumanAuditTangle.pose(
          body,
          poseBones(body, resolveHumanPosture(body, plan.posture(t))),
        ).find(
          (
            c: ReturnType<typeof AutoMovieMotionHumanAuditTangle.pose>[number],
          ): boolean =>
            (c.a === a && c.b === b) || (c.a === b && c.b === a),
        );
        TestValidator.predicate(
          `${name} ${place}: ${a} and ${b} clear at ${t} s (${pair?.depth ?? 0} m)`,
          pair === undefined || pair.depth <= HumanVerdicts.SKIN,
        );
      }
    }
  }
}
