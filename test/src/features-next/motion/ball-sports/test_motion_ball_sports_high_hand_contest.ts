import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanPerformance } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { vclose } from "../../../features/internal/vclose";

/**
 * A planted high-hand basketball contest lowers into the stance, then
 * brings both wrists clear of the shoulders over the same foot plants.
 *
 * Scenarios:
 * 1. A small and an average performer show the raised-hand finish with
 *    both feet fixed from preparation through the contest.
 *
 * The high hands follow WABC Level 2, section 1.1.1. An eighth of an arm
 * length distinguishes a high hand from shoulder-level pressure. The
 * standard fixed-contact test limit is 5 mm. These are display geometry
 * bounds, with no claim of an actual block or official ruling.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the isolated scenario, source, display expectations and bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Dispatches the public basketball law and checks displayed hands, hips and feet at the named beats.
 * @evidence contracts/development/testing.md#independent-expectations The required high hands, lowering of weight and unchanged foot positions are geometric expectations independent of the arm target tables.
 * @evidence contracts/development/testing.md#distinguishing-cases Two body sizes must keep both plants while the hands rise from the preparation to the contest position.
 * @evidence contracts/development/testing.md#execution-ownership Builds two independent one-actor films and reads three displayed skeleton samples each, with no renderer.
 */
export function test_motion_ball_sports_high_hand_contest(): void {
  for (const name of ["f-small", "m-average"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const performance: HumanPerformance = new HumanPerformance({
      seed: "exercise-high-hand",
      performers: [
        {
          subject: "defender",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("defender").ballSport({
        kind: "highHandContest",
        at: { x: 0, y: 1.4, z: 3 },
      }).node,
    });
    const segment: IAutoMovieMotionHumanSegment =
      performance.segments("defender")[0]!;
    const eventTime = (event: string): number => {
      const share: number | undefined = segment.plan.events.find(
        (entry): boolean => entry.name === event,
      )?.share;
      if (share === undefined) throw new Error(`No contest beat ${event}`);
      return segment.start + share * segment.plan.duration;
    };
    const at = (
      seconds: number,
      bone: AutoMovieHumanoidBone,
    ): IAutoMovieVector3 =>
      performance.bones("defender", seconds).get(bone)!.worldPosition;
    const start: number = segment.start;
    const ready: number = eventTime("ready");
    const contest: number = eventTime("stroke");
    const arms: number = body.measure.upperArm + body.measure.forearm;
    TestValidator.predicate(
      `${name} lowers the hips before the contest`,
      at(ready, "hips").y < at(start, "hips").y - 0.01 * body.measure.stature,
    );
    for (const side of ["left", "right"] as const) {
      const foot: AutoMovieHumanoidBone = `${side}Foot`;
      const hand: AutoMovieHumanoidBone = `${side}Hand`;
      const shoulder: AutoMovieHumanoidBone = `${side}UpperArm`;
      TestValidator.predicate(
        `${name} raises the ${side} hand and keeps the ${side} foot fixed`,
        at(contest, hand).y > at(contest, shoulder).y + arms / 8 &&
          vclose(at(start, foot), at(ready, foot), 0.005) &&
          vclose(at(start, foot), at(contest, foot), 0.005),
      );
    }
  }
}
