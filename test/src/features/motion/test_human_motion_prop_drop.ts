import { createDrinkware } from "@automovie/archetypes";
import { AutoMovieGravity } from "@automovie/engine";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  type IHumanBody,
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
 * @evidence contracts/development/testing.md#behavioral-verification Releases a real mug through the public chain and reads its flight and displayed frame; a prop left in the air, one that falls too fast or too slow, or an empty hand released silently fails.
 * @evidence contracts/development/testing.md#independent-expectations The fall time is free fall's, written here with the engine's standard gravity; the 2 ms and 1 mm are #3479's bounds.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies; a held prop and an empty hand.
 * @evidence contracts/development/testing.md#execution-ownership Builds three performances in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the four numbered scenarios with their bounds.
 */
export function test_human_motion_prop_drop(): void {
  const mug: ReturnType<typeof createDrinkware> = createDrinkware({ kind: "mug" });
  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    let performance: HumanPerformance;
    try {
      performance = new HumanPerformance({
        seed: "drop",
        props: [HumanObject.prop("mug", mug, { at: { x: -0.25, y: 0.9, z: 0.35 }, yaw: 0 })],
        performers: [
          { subject: "a", body, at: { x: 0, y: 0, z: 0 }, yaw: 0, proficiency: { level: "trained" } },
        ],
        composition: HumanChain.subject("a")
          .pickUp({ prop: "mug", handle: "handle" })
          .stand({ seconds: 3 })
          .over((u) => u.release({ hand: "right" }))
          .node,
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
      Math.abs(performance.prop("mug", performance.duration).position.y) <= 1e-3,
    );
  }

  // 4. An empty hand.
  let refusal: unknown;
  try {
    new HumanPerformance({
      seed: "drop",
      performers: [
        { subject: "a", body: motionHumanBody("m-average"), at: { x: 0, y: 0, z: 0 }, yaw: 0, proficiency: { level: "trained" } },
      ],
      composition: HumanChain.subject("a")
        .stand({ seconds: 1 })
        .over((u) => u.release({ hand: "left" }))
        .node,
    });
  } catch (error) {
    refusal = error;
  }
  TestValidator.predicate(
    "an empty hand's release is refused on hand",
    refusal instanceof HumanRefusal && refusal.kind === "affordance" && refusal.axis === "hand",
  );
}
