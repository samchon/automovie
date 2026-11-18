import { createDoor, createDrinkware } from "@automovie/archetypes";
import { AutoMovieGravity } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Letting go (#3479's `release`): a held prop leaves the opening hand with
 * the hand's velocity, falls and rests on the floor.
 *
 * Scenarios, the average man and the small woman, each picking up a mug
 * from a table, then releasing it standing:
 * 1. The release publishes one launch of the mug at its `open` instant, the
 *    decisive instant.
 * 2. The mug falls from where it was at the opening: its fall time to the
 *    floor is `sqrt(2 h / g)` for the height `h` of its origin at the
 *    opening, within 2 ms (#3479), the hand being nearly still.
 * 3. It rests on the floor: at the film's end its origin's height is within
 *    1 mm of zero.
 * 4. A release by a hand that holds nothing is refused with an `affordance`
 *    refusal on `hand`.
 *
 * Scenarios:
 * 1. Release the mug and compare its free-flight trajectory and landing with independently measured initial conditions.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Releases a real mug through the public chain and reads its flight and displayed frame; a prop left in the air, one that falls too fast or too slow, or an empty hand released silently fails.
 * @evidence contracts/development/testing.md#independent-expectations The fall time is free fall's, written here with the engine's standard gravity; the 2 ms and 1 mm are #3479's bounds.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies; a held prop and an empty hand.
 * @evidence contracts/development/testing.md#execution-ownership Builds three performances in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the four numbered scenarios with their bounds.
 */
export function test_motion_contact_prop_trajectory(): void {
  const mug: ReturnType<typeof createDrinkware> = createDrinkware({
    kind: "mug",
  });
  for (const name of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    let performance: IAutoMovieMotionHumanPerformance;
    try {
      performance = new HumanPerformance({
        seed: "drop",
        props: [
          HumanObject.prop("mug", mug, {
            at: { x: -0.25, y: 0.9, z: 0.35 },
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
          .pickUp({ prop: "mug", handle: "handle" })
          .stand({ seconds: 3 })
          .over((u) => u.release({ hand: "right" })).node,
      });
    } catch (error) {
      TestValidator.predicate(
        `${name}: the drop plans (${error instanceof Error ? error.message : String(error)})`,
        false,
      );
      continue;
    }
    const opening = performance.overlays("a")[0];
    const launches = opening?.plan.launches ?? [];
    TestValidator.predicate(
      `${name}: the release launches the mug at its opening`,
      opening !== undefined &&
        launches.length === 1 &&
        launches[0]!.prop === "mug" &&
        Math.abs(launches[0]!.seconds - (opening.plan.contact ?? NaN)) <= 1e-12,
    );
    const flight = performance.flights("mug")[0];
    if (flight === undefined) {
      TestValidator.predicate(`${name}: the mug flies`, false);
      continue;
    }
    const h: number = flight.projectile.origin.y;
    const fall: number = flight.end - flight.launch;
    TestValidator.predicate(
      `${name}: it falls in sqrt(2h/g) (${fall.toFixed(4)} s against ${Math.sqrt((2 * h) / AutoMovieGravity.STANDARD).toFixed(4)} s)`,
      Math.abs(fall - Math.sqrt((2 * h) / AutoMovieGravity.STANDARD)) <= 2e-3,
    );
    TestValidator.predicate(
      `${name}: it rests on the floor`,
      Math.abs(performance.prop("mug", performance.duration).position.y) <=
        1e-3,
    );
  }

  // 4. An empty hand.
  let refusal: unknown;
  try {
    new HumanPerformance({
      seed: "drop",
      performers: [
        {
          subject: "a",
          body: motionHumanBody("m-average"),
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a")
        .stand({ seconds: 1 })
        .over((u) => u.release({ hand: "left" })).node,
    });
  } catch (error) {
    refusal = error;
  }
  TestValidator.predicate(
    "an empty hand's release is refused on hand",
    refusal instanceof HumanRefusal &&
      refusal.kind === "affordance" &&
      refusal.axis === "hand",
  );
}

/**
 * A prop's own track (#3476): an articulation the archetype runs by itself
 * from an instant, sharing one state with the acts' drives.
 *
 * Scenarios, a lever door that a track swings from 0 to 60 degrees over the
 * second after 1 s, its travel linear in time (the archetypes' own tracks
 * are #3476's `ArchetypeTrack`; this one is the scene's), while the average
 * man stands 3 s:
 * 1. Before 1 s the door's state names no hinge travel (at rest).
 * 2. At 1.5 s the hinge's travel is 30 degrees within 1e-9.
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
export function test_motion_contact_prop_trajectory_articulated_track(): void {
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
            travel: (seconds: number): number => 60 * Math.min(1, seconds),
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
    Math.abs((performance.state("door", 1.5).hinge ?? NaN) - 30) <= 1e-9,
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
