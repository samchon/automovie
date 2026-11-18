import { createBed } from "@automovie/archetypes";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanSignature,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanFrame,
  HumanPerformance,
  HumanSignature,
  bedsidePerch,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A person can sit on either long edge of a double bed with both feet
 * outside its footprint, pause on the mattress, and stand on the same side.
 *
 * Scenarios:
 * 1. A standing adult perches on each edge of a translated, rotated double
 *    bed. During the pause the seat region stays within 10 mm of the upper
 *    plane, inside the chosen half of the mattress. The feet touch the floor
 *    outside the edge and slip at most 5 mm during the hold.
 * 2. The seated hold lasts the authored 0.8 seconds, then the person stands
 *    outside that edge with both feet bearing on the floor and knees within
 *    15 degrees of straight.
 * 3. A crib has no adult seat along its edge and the request is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the bed geometry, both performances, physical bounds and the unavailable seat case.
 * @evidence contracts/development/testing.md#behavioral-verification Exercises the public composition in a performance and reads the displayed seat and feet. A reversed edge, off-mattress seat, foot slip or missing rise fails.
 * @evidence contracts/development/testing.md#independent-expectations Uses the double bed's fixed 1.35 by 1.90 m dimensions and fixture height to define the planes, the campaign's 10 mm contact and 5 mm slip bounds, and a provisional 15 degree standing knee margin. Reads the seat region and soles rather than the complete collision hull.
 * @evidence contracts/development/testing.md#distinguishing-cases Opposite edges of a placed bed and a model with no edge seat. Other seat tests own high mounts and differing statures.
 * @evidence contracts/development/testing.md#execution-ownership In-memory feature test builds two performances for one polygon man and checks an authoring refusal.
 */
export function test_human_motion_bedside_perch(): void {
  const height: number = 0.46;
  const bed: ReturnType<typeof createBed> = createBed({
    kind: "double",
    height,
  });
  const origin: IAutoMovieVector3 = { x: 1.5, y: 0, z: -2 };
  const yaw: number = 37;
  const halfWidth: number = 1.35 / 2;
  const hold: number = 0.8;
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");

  for (const [side, sign] of [
    ["left", 1],
    ["right", -1],
  ] as const) {
    const facing: number = yaw + sign * 90;
    const performance: HumanPerformance = new HumanPerformance({
      seed: "bedside-perch",
      performers: [
        {
          subject: "actor",
          body,
          at: HumanFrame.point(
            { origin, yaw },
            { x: sign * (halfWidth + 0.2), y: 0, z: 0 },
          ),
          yaw: facing,
          proficiency: { level: "trained" },
        },
      ],
      composition: bedsidePerch(
        HumanChain.subject("actor"),
        bed,
        { at: origin, yaw },
        side,
        hold,
      ).node,
    });
    const reader: IAutoMovieMotionHumanSignature.IReader = HumanSignature.of(
      performance,
      "actor",
      body,
      facing,
    );
    const [sitting, rising]: readonly IAutoMovieMotionHumanSegment[] =
      performance.segments("actor");
    const sat: IAutoMovieMotionHumanSegment = sitting!;
    const stood: IAutoMovieMotionHumanSegment = rising!;
    const settled: number =
      sat.start +
      sat.plan.duration *
        sat.plan.events.find((event): boolean => event.name === "seated")!
          .share;
    TestValidator.predicate(
      `${side} seated hold`,
      () => Math.abs(sat.end - settled - hold) < 1e-6,
    );

    // Project into the bed's frame independently of the seat affordance.
    const local = (point: IAutoMovieVector3): IAutoMovieVector3 =>
      HumanFrame.local({ origin, yaw }, point);
    const feet: readonly ["left", "right"] = ["left", "right"];
    const start: IAutoMovieVector3[] = feet.map(
      (foot): IAutoMovieVector3 =>
        local(HumanSignature.sole(reader, settled + 0.02, foot)),
    );
    for (const t of HumanSignature.times(settled + 0.02, sat.end - 0.02, 12)) {
      const seat: IAutoMovieVector3 = local(
        HumanSignature.region(reader, "seat", t),
      );
      TestValidator.predicate(
        `${side} seat on mattress at ${t}`,
        () =>
          Math.abs(seat.y - height) <= 0.01 &&
          sign * seat.x > 0 &&
          sign * seat.x < halfWidth &&
          Math.abs(seat.z) < 0.95,
      );
      for (const [index, foot] of feet.entries()) {
        const first: IAutoMovieVector3 = start[index]!;
        const sole: IAutoMovieVector3 = local(
          HumanSignature.sole(reader, t, foot),
        );
        TestValidator.predicate(
          `${side} ${foot} foot outside bed at ${t}`,
          () =>
            sign * sole.x > halfWidth &&
            Math.abs(sole.y) <= 0.01 &&
            Math.hypot(sole.x - first.x, sole.y - first.y, sole.z - first.z) <=
              0.005,
        );
      }
    }
    for (const foot of feet) {
      const sole: IAutoMovieVector3 = local(
        HumanSignature.sole(reader, stood.end, foot),
      );
      TestValidator.predicate(
        `${side} stands on ${foot} foot outside bed`,
        () =>
          sign * sole.x > halfWidth &&
          HumanSignature.bears(reader, stood.end, foot) &&
          HumanSignature.knee(reader, stood.end, foot) <= 15,
      );
    }
  }
  TestValidator.error("a crib has no seat at its edge", (): void => {
    bedsidePerch(
      HumanChain.subject("actor"),
      createBed({ kind: "crib" }),
      { at: origin, yaw },
      "left",
    );
  });
}
