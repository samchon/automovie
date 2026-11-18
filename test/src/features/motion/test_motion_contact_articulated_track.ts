import { createDoor } from "@automovie/archetypes";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanObject, HumanPerformance } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A prop's own track (#3476): an articulation the archetype runs by itself
 * from an instant, sharing one state with the acts' drives.
 *
 * Scenarios, a lever door that a track swings from 0 to 60 degrees over the
 * second after 1 s, its travel linear in time (the archetypes' own tracks
 * are #3476's `ArchetypeTrack`; this one is the scene's), while the average
 * man stands 3 s:
 * 1. Before 1 s the door's state names no hinge travel (at rest).
 * 2. At 1.5 s the accelerating hinge has travelled 15 degrees within 1e-9.
 * 3. After the track ends, at 2 and 3 s, its last travel, 60 degrees, holds.
 * 4. At 2.5 s the `pull` contact the performance aims at lies within 1 mm of
 *    the door posed at 60 degrees, placed where the scene put it.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs a track on a real door archetype and reads the performance's state and its aim at the moved contact; a track that never starts, one that snaps back or a contact read at rest fails.
 * @evidence contracts/development/testing.md#independent-expectations The travels are the track's own function, written here; the contact is the archetype's own pose.
 * @evidence contracts/development/testing.md#distinguishing-cases Before, during and after the track.
 * @evidence contracts/development/testing.md#execution-ownership Builds one performance in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the four numbered scenarios.
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
    composition: HumanChain.subject("a").stand({ seconds: 3 }).node,
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
