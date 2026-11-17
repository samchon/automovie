import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanTouchEffector,
  IAutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanTouchEffector,
  AutoMovieMotionHumanTouchForm,
  HumanChain,
  HumanPerformance,
  touch,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A touch whose author names no hand lays the hand whose arm reaches the
 * region with the least strain (`touchSide`), and an authored hand is kept.
 *
 * Two average men stand 0.6 m apart, face to face, and one squeezes a region
 * with no `side`. At the middle of the hold the hand that touched is the one
 * whose palm lies nearer the region, read from the displayed bones.
 *
 * Scenarios:
 * 1. The partner's right upper arm lies on the toucher's left: the left hand
 *    takes it, where the right would reach across the partner's chest.
 * 2. The partner's left upper arm lies on the toucher's right: the right
 *    hand takes it.
 * 3. A pat on the toucher's own abdomen, on the body's middle, strains both
 *    arms alike up to rounding: the right hand keeps it.
 * 4. The same abdomen with the left hand authored: the left hand takes it.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds each performance through the public chain and reads both palms on the displayed bones; a law that kept the right hand for a region on the left, flipped on a tie, or overrode an authored hand fails with the distances.
 * @evidence contracts/development/testing.md#independent-expectations Which hand lies on the region follows from the stage's geometry, the region's side of the toucher, and the authored side; nothing is read from the law's choice.
 * @evidence contracts/development/testing.md#distinguishing-cases A region on each side, a region on the middle where the strains tie, and an authored hand.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and builds four short performances, each read at one instant; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the stage, how the touching hand is read and the 4 scenarios.
 */
export function test_human_motion_touch_hand_choice(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const effector: IAutoMovieMotionHumanTouchEffector.IEffector =
    AutoMovieMotionHumanTouchForm.curled(touch.EFFECTORS.palm, "squeeze");
  const complaints: string[] = [];
  type IRegionTarget = Extract<
    IAutoMovieMotionTarget,
    { kind: "person" | "self" }
  >;
  const cases: readonly (readonly [
    string,
    IRegionTarget,
    "left" | "right" | undefined,
    "left" | "right",
  ])[] = [
    [
      "the partner's right upper arm",
      { kind: "person", subject: "b", region: "upperArmRight" },
      undefined,
      "left",
    ],
    [
      "the partner's left upper arm",
      { kind: "person", subject: "b", region: "upperArmLeft" },
      undefined,
      "right",
    ],
    [
      "the toucher's own abdomen",
      { kind: "self", region: "abdomen" },
      undefined,
      "right",
    ],
    [
      "the toucher's own abdomen, the left hand authored",
      { kind: "self", region: "abdomen" },
      "left",
      "left",
    ],
  ];
  for (const [label, target, side, expected] of cases) {
    const performance: IAutoMovieMotionHumanPerformance = new HumanPerformance({
      seed: "hand",
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
          body,
          at: { x: 0, y: 0, z: 0.6 },
          yaw: 180,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a")
        .stand({ seconds: 0.3 })
        .touch({
          target,
          kind: "squeeze",
          ...(side === undefined ? {} : { side }),
        })
        .with(HumanChain.subject("b").stand({ seconds: 6 })).node,
    });
    const placed: IAutoMovieMotionHumanSegment = performance.segments("a")[1]!;
    const instant = (event: string): number =>
      placed.start +
      (placed.plan.events.find(
        (e: { name: string; share: number }): boolean => e.name === event,
      )?.share ?? NaN) *
        placed.plan.duration;
    const held: number = (instant("strokeEnd") + instant("relax")) / 2;
    const owner: string = target.kind === "person" ? target.subject : "a";
    const frame = body.surfaces.regions[target.region];
    const region: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
      frame,
      performance.bones(owner, held).get(frame.bone)!,
    ).point;
    const reach = (hand: "left" | "right"): number =>
      Vector3.length(
        Vector3.subtract(
          AutoMovieMotionHumanTouchEffector.point(
            body,
            performance.bones("a", held),
            hand,
            effector,
          ),
          region,
        ),
      );
    const other: "left" | "right" = expected === "left" ? "right" : "left";
    if (!(reach(expected) < reach(other)))
      complaints.push(
        `${label}: the ${expected} palm lies ${(reach(expected) * 1000).toFixed(1)} mm from the region and the ${other} ${(reach(other) * 1000).toFixed(1)} mm at ${held.toFixed(3)} s; the ${expected} hand expected on it`,
      );
  }
  TestValidator.equals("the hand that touches", complaints, []);
}
