import { createDrinkware } from "@automovie/archetypes";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanSeat,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/**
 * Sitting down keeps what a hand holds, and a plain sit reads clean.
 *
 * Scenarios, on the average man, on a chair as high as the popliteal height
 * 0.1 m behind the heels:
 * 1. A plain sit passes the shipped verdicts.
 * 2. A glass picked up by its body before sitting is still in the right
 *    hand after the sit: the action that follows enters holding it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the stage and what each scenario pins.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the displayed take through the shipped verdict report and the next action's entry holds.
 * @evidence contracts/development/testing.md#independent-expectations The verdicts' own limits; the hold is the prop the pick up named.
 * @evidence contracts/development/testing.md#distinguishing-cases An empty-handed sit against a sit holding a glass.
 * @evidence contracts/development/testing.md#execution-ownership In-memory archetype and Human performances; no host.
 */
export function test_motion_seat_sit_keeps_hold(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const chair: IAutoMovieMotionHumanSeated.ISeat = {
    at: { x: 0, y: AutoMovieMotionHumanSeat.seated.popliteal(body), z: -0.1 },
    yaw: 0,
    depth: 0.45,
  };
  const failures: string[] = [];

  // 1. A plain sit.
  const plain: HumanPerformance = new HumanPerformance({
    seed: "sit",
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("a").sit({ seat: chair, hold: 0.5 }).node,
  });
  try {
    assertTakeClean("a plain sit", plain);
  } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error));
  }

  // 2. A glass picked up standing, then a sit, then a rise.
  const glass: ReturnType<typeof createDrinkware> = createDrinkware({
    kind: "glass",
  });
  const film: HumanPerformance = new HumanPerformance({
    seed: "sit",
    props: [
      HumanObject.prop("glass", glass, {
        at: { x: 0.25, y: 0.9, z: 0.35 },
        yaw: 0,
      }),
    ],
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("a")
      .pickUp({ prop: "glass", handle: "body", hand: "right" })
      .sit({ seat: chair, hold: 0.5 })
      .rise().node,
  });
  const rose: IAutoMovieMotionHumanSegment | undefined = film
    .segments("a")
    .find(
      (segment: IAutoMovieMotionHumanSegment): boolean =>
        segment.name === "rise",
    );
  if (rose === undefined) failures.push("the rise after the sit did not play");
  else if (rose.context.entry.holds.right !== "glass")
    failures.push(
      `the sit drops the glass: the rise enters holding ${String(rose.context.entry.holds.right)}`,
    );
  TestValidator.equals("sitting keeps a hold", failures, []);
}
