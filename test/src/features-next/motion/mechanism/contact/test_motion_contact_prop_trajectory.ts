import { createDrinkware } from "@automovie/archetypes";
import { AutoMovieGravity } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropFlight,
} from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../../features/internal/motionHumanBody";
import { nclose } from "../../../../features/internal/nclose";
import { vclose } from "../../../../features/internal/vclose";

/**
 * Letting go (#3479's `release`): a held prop leaves the opening hand with
 * the hand's velocity, falls and rests on the floor.
 *
 * The average man picks up a mug from a table, then releases it standing.
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
 * 2. Construct the release scene and seek the walking target in both directions before requesting a flight. The collider provider is first observed on flight demand.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Releases a real mug through the public chain and reads its flight and displayed frame; a prop left in the air, one that falls too fast or too slow, or an empty hand released silently fails.
 * @evidence contracts/development/testing.md#independent-expectations The fall time is free fall's, written here with the engine's standard gravity; the 2 ms and 1 mm are #3479's bounds.
 * @evidence contracts/development/testing.md#distinguishing-cases A held prop with and without a distant opaque collider, reverse pose seeks before flight demand, and an empty hand.
 * @evidence contracts/development/testing.md#execution-ownership Builds three performances in memory. The opaque collider counts its own frame calls.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the four numbered scenarios with their bounds.
 */
export function test_motion_contact_prop_trajectory(): void {
  const mug: ReturnType<typeof createDrinkware> = createDrinkware({
    kind: "mug",
  });
  let native: IAutoMovieMotionHumanPropFlight.IFlight | undefined;
  for (const opaque of [false, true]) {
    const name: string = opaque ? "opaque target path" : "native target path";
    let observed: number = 0;
    const distant: IAutoMovieMotionHumanProp = {
      subject: "distant",
      frame: {
        position: { x: 6, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
      },
      points: {},
      shapes: [
        {
          id: "sphere",
          material: "solid",
          kind: "sphere",
          transform: {
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
          },
          radius: 0.2,
        },
      ],
      motion: (t) => {
        observed++;
        return { ...distant.frame, position: { x: 6 + t, y: 0, z: 0 } };
      },
    };
    const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
    let performance: IAutoMovieMotionHumanPerformance;
    try {
      performance = new HumanPerformance({
        seed: "drop",
        props: [
          HumanObject.prop("mug", mug, {
            at: { x: -0.25, y: 0.9, z: 0.35 },
            yaw: 0,
          }),
          ...(opaque ? [distant] : []),
        ],
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
          {
            subject: "walker",
            body,
            at: { x: 1.4, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        composition: HumanChain.subject("a")
          .pickUp({ prop: "mug", handle: "handle" })
          .stand({ hold: 3 })
          .over((u) => u.release({ hand: "right" }))
          .with(
            HumanChain.subject("walker").walk({ to: { x: 1.4, y: 0, z: 2 } }),
          ).node,
      });
    } catch (error) {
      TestValidator.predicate(
        `${name}: the drop plans (${error instanceof Error ? error.message : String(error)})`,
        false,
      );
      continue;
    }
    if (opaque)
      TestValidator.equals(
        "an opaque collider is unread during placement",
        observed,
        0,
      );
    const walker = (t: number) =>
      performance.bones("walker", t).get("hips")!.worldPosition;
    const early = walker(0.1);
    const late = walker(1.6);
    TestValidator.predicate(
      "the walking target moves and can be read back at its earlier pose",
      late.z > early.z + 0.2 && vclose(walker(0.1), early, 1e-6),
    );
    if (opaque)
      TestValidator.equals(
        "reading the target never requests the flight",
        observed,
        0,
      );
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
    if (opaque)
      TestValidator.predicate(
        "the contact sweep observes the opaque collider",
        observed > 0,
      );
    if (flight === undefined) {
      TestValidator.predicate(`${name}: the mug flies`, false);
      continue;
    }
    if (opaque)
      TestValidator.predicate(
        "a distant provider preserves the released mug's ground contact",
        native !== undefined &&
          native.contact?.struck.kind === "ground" &&
          flight.contact?.struck.kind === "ground" &&
          nclose(flight.launch, native.launch, 1e-12) &&
          nclose(flight.end, native.end, 1e-6),
      );
    else native = flight;
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
        .stand({ hold: 1 })
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
