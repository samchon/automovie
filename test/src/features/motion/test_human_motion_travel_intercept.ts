import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HUMAN_LEXICON,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
  HumanSignature,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * An interceptor heads a walking person off: it arrives within arm's reach
 * of where the person is at that moment, not where they were when it set
 * off, and it does not run into them.
 *
 * Scenarios, the average man heading off the small woman and the reverse;
 * the person walks 6 m across the runner's front, from 3 m to the left to
 * 3 m to the right at 5 m ahead, and the runner starts as they do:
 * 1. When the run ends, the runner's sternum is no further from the
 *    person's sternum, as displayed at that instant, than the two people's
 *    arms together reach (upper arm, forearm and hand of each), measured
 *    horizontally: a grab can follow.
 * 2. At that instant the two bodies overlap by no more than 10 mm (the
 *    campaign's penetration bound).
 * 3. The run ends more than 1 m, across the front, from where the person
 *    stood when it began: it went to where they are, not where they were.
 * 4. Heading off a person composed after the runner is refused as a
 *    `participant` refusal: their path is not known yet.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs an interception of a walking person through the public chain and reads both displayed bodies at the run's end; a run to the person's starting place, a run that ends out of reach or inside them, or a silent plan against an unknown path fails.
 * @evidence contracts/development/testing.md#independent-expectations Within reach at the moment of arrival is what heading someone off means; the reach is the bodies' own arm lengths and the 10 mm the campaign's bound, neither read from the law. Limitation: the bearing through the run is not read, since one straight run holds it trivially while both go straight.
 * @evidence contracts/development/testing.md#distinguishing-cases The two orders of a tall and a short person, a target that moves across the front so its start and its meeting place differ by metres, and the refused order of composition.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds four short performances in memory; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 4 scenarios with their bounds.
 */
export function test_human_motion_travel_intercept(): void {
  const complaints: string[] = [];
  for (const names of [
    ["m-average", "f-small"],
    ["f-small", "m-average"],
  ] as const) {
    const bodies: readonly [IHumanBody, IHumanBody] = [
      motionHumanBody(names[0]),
      motionHumanBody(names[1]),
    ];
    const label: string = `${names[0]} heading off ${names[1]}`;
    const walking: HumanChain = HumanChain.subject("b")
      .stand({ seconds: 0.3 })
      .walk({ to: { x: 3, y: 0, z: 5 } });
    const running: HumanChain = HumanChain.subject("a")
      .stand({ seconds: 0.3 })
      .registered("intercept", { target: "b" });
    const perform = (first: HumanChain, second: HumanChain): HumanPerformance =>
      new HumanPerformance({
        seed: "intercept",
        laws: [...HUMAN_LEXICON.pursuit!],
        performers: [
          {
            subject: "a",
            body: bodies[0],
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
          {
            subject: "b",
            body: bodies[1],
            at: { x: -3, y: 0, z: 5 },
            yaw: 90,
            proficiency: { level: "trained" },
          },
        ],
        composition: first.with(second).node,
      });

    // 4. The person's path must be known.
    let thrown: unknown = null;
    try {
      perform(running, walking);
    } catch (error) {
      thrown = error;
    }
    if (!(thrown instanceof HumanRefusal && thrown.kind === "participant"))
      complaints.push(
        `${label}, composed before them: expected a participant refusal, got ${thrown instanceof Error ? thrown.message : String(thrown)}`,
      );

    // 1 to 3. Within reach of where they are.
    let performance: HumanPerformance;
    try {
      performance = perform(walking, running);
    } catch (error) {
      complaints.push(
        `${label}: ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }
    const end: number = performance.segments("a")[1]!.end;
    const a: HumanSignature.IReader = HumanSignature.of(
      performance,
      "a",
      bodies[0],
      0,
    );
    const b: HumanSignature.IReader = HumanSignature.of(
      performance,
      "b",
      bodies[1],
      90,
    );
    const mine: IAutoMovieVector3 = HumanSignature.region(a, "sternum", end);
    const theirs: IAutoMovieVector3 = HumanSignature.region(b, "sternum", end);
    const gap: number = Math.hypot(mine.x - theirs.x, mine.z - theirs.z);
    const arms: number = bodies
      .map(
        (body: IHumanBody): number =>
          body.measure.upperArm + body.measure.forearm + body.measure.hand,
      )
      .reduce((sum: number, arm: number): number => sum + arm, 0);
    if (gap > arms)
      complaints.push(
        `${label}: the chests are ${gap.toFixed(3)} m apart when the run ends, within the two arms' ${arms.toFixed(3)} m expected`,
      );
    const apart: number = HumanSignature.apart(a, b, end);
    if (apart < -0.01)
      complaints.push(
        `${label}: the bodies overlap by ${(-apart * 1000).toFixed(1)} mm when the run ends, at most 10 mm expected`,
      );
    if (!(mine.x > -2))
      complaints.push(
        `${label}: the run ends ${(mine.x + 3).toFixed(3)} m across from where the person stood, more than 1 m expected`,
      );
  }
  TestValidator.equals("an interceptor heads a walker off", complaints, []);
}
