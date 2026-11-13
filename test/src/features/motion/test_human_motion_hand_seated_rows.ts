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
  seated,
  touch,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The upper-body rows are performed seated as they are standing: a person
 * who has sat down puts a hand on the heart, hushes and drinks without
 * leaving the seat (#3361's composition matrix, the seated base).
 *
 * Scenarios, on the small woman and the average man, each after sitting
 * down on a seat at their own popliteal height:
 * 1. `handOnHeart` (a row of `touch`): at the middle of its hold the right
 *    palm lies within 15 mm of the left chest region (#3345).
 * 2. `hush` (a row of `handToFace`): the forefinger's middle joint lies
 *    within 20 mm of the mouth region (provisional, as standing).
 * 3. `handToFace` `drink` with the implied cup: the plan keeps the task's
 *    `atMouth` event.
 * 4. In each, the pelvis stays within 10 mm of where sitting left it, at the
 *    middle of the hold (the campaign's bound for a supported body, #3358).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds the performances through the public chain and reads displayed joints and regions; a row that stands the body up, misses its region seated or loses its event fails.
 * @evidence contracts/development/testing.md#independent-expectations The bounds are acceptance lines of #3345 and #3358 or marked provisional; the seat is the body's own popliteal height.
 * @evidence contracts/development/testing.md#distinguishing-cases Two laws and three rows on the seated base, two statures; the same rows standing are `test_human_motion_emblem_signatures`'s.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds six short performances; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 4 scenarios with their bounds.
 */
export function test_human_motion_hand_seated_rows(): void {
  const laws: IHumanActionLaw<never>[] = [
    HumanEmblem.handOnHeart,
    HumanEmblem.hush,
  ];
  const complaints: string[] = [];
  const gap = (p: IAutoMovieVector3, q: IAutoMovieVector3): number =>
    Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z);
  for (const name of ["f-small", "m-average"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const seat: seated.ISeat = {
      at: {
        x: 0,
        y: seated.popliteal(body),
        z: body.rest.get("leftFoot")!.z - 0.1,
      },
      yaw: 0,
      depth: 0.45,
    };
    for (const [label, row] of [
      ["handOnHeart", (c: HumanChain): HumanChain => c.registered("handOnHeart", {})],
      ["hush", (c: HumanChain): HumanChain => c.registered("hush", {})],
      ["drink", (c: HumanChain): HumanChain => c.handToFace({ task: "drink" })],
    ] as const)
      try {
        const performance: HumanPerformance = new HumanPerformance({
          seed: "seated",
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
          composition: row(HumanChain.subject("a").sit({ seat })).node,
        });
        const sat: HumanSegment.ISegment = performance.segments("a")[0]!;
        const placed: HumanSegment.ISegment = performance.segments("a")[1]!;
        const instant = (event: string): number =>
          placed.start +
          (placed.plan.events.find((e): boolean => e.name === event)?.share ??
            NaN) *
            placed.plan.duration;
        const held: number = (instant("strokeEnd") + instant("relax")) / 2;
        const reader: HumanSignature.IReader = HumanSignature.of(
          performance,
          "a",
          body,
          0,
        );

        // 4. Still seated.
        const moved: number = gap(
          HumanSignature.joint(reader, held, "hips"),
          HumanSignature.joint(reader, sat.end, "hips"),
        );
        if (!(moved <= 0.01))
          complaints.push(
            `${name}: ${label}: the pelvis is ${(moved * 1000).toFixed(0)} mm from where sitting left it, within 10 mm expected`,
          );
        if (label === "handOnHeart") {
          const off: number = gap(
            AutoMovieMotionHumanTouchEffector.point(
              body,
              performance.bones("a", held),
              "right",
              touch.EFFECTORS.palm,
            ),
            HumanSignature.region(reader, "chestLeft", held),
          );
          if (!(off <= 0.015))
            complaints.push(
              `${name}: handOnHeart seated: the palm is ${(off * 1000).toFixed(0)} mm from the left chest, within 15 mm expected`,
            );
        } else if (label === "hush") {
          const off: number = gap(
            HumanSignature.joint(reader, held, "rightIndexIntermediate"),
            HumanSignature.region(reader, "mouth", held),
          );
          if (!(off <= 0.02))
            complaints.push(
              `${name}: hush seated: the forefinger's middle joint is ${(off * 1000).toFixed(0)} mm from the mouth, within 20 mm expected`,
            );
        } else if (!Number.isFinite(instant("atMouth")))
          complaints.push(`${name}: drink seated: the plan has no atMouth`);
      } catch (error) {
        complaints.push(
          `${name}: ${label} seated: expected to plan, got ${(error as Error).message}`,
        );
      }
  }
  TestValidator.equals("upper-body rows on a seated base", complaints, []);
}
