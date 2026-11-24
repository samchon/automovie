import { createDoor } from "@automovie/archetypes";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanObject, HumanPerformance } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../../features/internal/motionHumanBody";

/**
 * A timed door articulation supplies its own hinge angle.
 *
 * Scenarios:
 * 1. Read before onset, halfway through the interval and after the track ends. Quadratic travel from 0 to 60 degrees gives 15 degrees at half time.
 * 2. Compare the visible handle on the held door with the independently posed endpoint.
 *
 * @evidence contracts/development/testing.md#behavioral-verification A timed door articulation supplies its own hinge angle.
 * @evidence contracts/development/testing.md#independent-expectations Read before onset, halfway through the interval and after the track ends. Quadratic travel from 0 to 60 degrees gives 15 degrees at half time.
 * @evidence contracts/development/testing.md#distinguishing-cases Compare the visible handle on the held door with the independently posed endpoint.
 * @evidence contracts/development/testing.md#execution-ownership Reads public runtime results in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the measured phases and coordinate frames.
 */
export function test_motion_contact_articulated_track(): void {
  const door: ReturnType<typeof createDoor> = createDoor({
    hinge: "right",
    hardware: "lever",
  });
  const placement: IAutoMovieTransform = {
    translation: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  };
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const performance: IAutoMovieMotionHumanPerformance = new HumanPerformance({
    seed: "track",
    props: [
      HumanObject.prop(
        "door",
        door,
        { at: { x: 0, y: 0, z: 0 }, yaw: 0, fixed: true },
        undefined,
        undefined,
        [
          {
            articulation: "hinge",
            start: 1,
            duration: 1,
            travel: (seconds: number): number => 60 * Math.min(1, seconds) ** 2,
          },
        ],
      ),
    ],
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 2 },
        yaw: 180,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("a").stand({ hold: 3 }).node,
  });
  TestValidator.predicate(
    "at rest before the track",
    performance.state("door", 0.5).hinge === undefined,
  );
  TestValidator.predicate(
    "halfway through the track",
    Math.abs((performance.state("door", 1.5).hinge ?? NaN) - 15) <= 1e-9,
  );
  for (const t of [2, 3])
    TestValidator.predicate(
      `the track's last travel holds at ${t} s`,
      Math.abs((performance.state("door", t).hinge ?? NaN) - 60) <= 1e-9,
    );
  const aimed: IAutoMovieVector3 = performance.aim(
    { kind: "prop", subject: "door", point: "pull" },
    2.5,
    {
      root: { x: 0, y: 0, z: 0 },
      yaw: 0,
      heights: { low: 0.5, middle: 1, high: 1.5 },
      range: 1,
      body,
      bones: () => performance.bones("a", 2.5),
    },
  ).point;
  const posed: IAutoMovieVector3 = door
    .articulate({ hinge: 60 })
    .placed("pull", placement).translation;
  TestValidator.predicate(
    "the lever is where the swung door has it",
    Math.hypot(aimed.x - posed.x, aimed.y - posed.y, aimed.z - posed.z) <= 1e-3,
  );
}
