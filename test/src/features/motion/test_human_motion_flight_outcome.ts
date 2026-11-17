import { createProjectile } from "@automovie/archetypes";
import { Vector3, projectileAt } from "@automovie/engine";
import type {
  IAutoMovieInteractionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanThrownWeapon,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A flight goes on after its first contact by its body's flight data (#3479,
 * #3482): a grenade, which declares a restitution and a steel friction pair
 * and no embedding, bounces on the floor and settles; an arrow, which
 * declares its depth in wood, sticks that deep along its flight.
 *
 * Scenarios, the average man throwing each overarm at a floor point 8 m
 * ahead, then standing 4 s:
 * 1. The grenade's first contact is the floor, its outcome `bounce`, and a
 *    leg follows it.
 * 2. The leg leaves with the impact's normal speed reversed and scaled by the
 *    body's restitution (Newton), to the float resolution of the product.
 * 3. The grenade comes to rest: its place is the same at the film's last
 *    second and a second before it.
 * 4. The hit record of that contact states `bounce` and the leg's velocity as
 *    its exit.
 * 5. The arrow's first contact is the floor, its outcome `stick`, and it
 *    rests its body's embedding depth on along its velocity from the
 *    contact, to the float resolution of the step.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Throws real projectile archetypes through the public chain and reads the flights, their legs, the hit record and the displayed props; a contact that always rests, a rebound off Newton's law, a grenade that never settles or an arrow lying on the surface fails.
 * @evidence contracts/development/testing.md#independent-expectations The restitution and the depth are the archetypes' own body data; the bounds are float resolution of the products checked.
 * @evidence contracts/development/testing.md#distinguishing-cases A body that bounces against one that sticks; the impact, the rebound, the rest and the record.
 * @evidence contracts/development/testing.md#execution-ownership Builds two performances in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the five numbered scenarios with their bounds.
 */
export function test_human_motion_flight_outcome(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const target: IAutoMovieVector3 = { x: 0, y: 0, z: 8 };
  const perform = (
    subject: string,
    projectile: ReturnType<typeof createProjectile>,
    row: "throwGrenade" | "throwSpear",
  ): IAutoMovieMotionHumanPerformance =>
    new HumanPerformance({
      seed: "flight-outcome",
      laws: [HumanThrownWeapon[row]],
      props: [
        HumanObject.prop(subject, projectile, {
          at: { x: -0.3, y: 0, z: 0.5 },
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
        .pickUp({
          prop: subject,
          handle: row === "throwGrenade" ? "body" : "shaft",
        })
        .registered(row, {
          at: { kind: "point", frame: "world", at: target },
          prop: subject,
        })
        .stand({ seconds: 4 }).node,
    });

  // 1-4. The grenade bounces and settles.
  const grenade: ReturnType<typeof createProjectile> = createProjectile({
    kind: "grenade",
  });
  let thrown: IAutoMovieMotionHumanPerformance | undefined;
  try {
    thrown = perform("grenade", grenade, "throwGrenade");
  } catch (error) {
    TestValidator.predicate(
      `the grenade's throw plans (${error instanceof Error ? error.message : String(error)})`,
      false,
    );
  }
  if (thrown !== undefined) {
    const flight = thrown.flights("grenade")[0];
    const contact = flight?.contact;
    const leg = flight?.legs?.[0];
    TestValidator.predicate(
      `the grenade bounces on the floor (${contact?.struck.kind}, ${contact?.outcome}, ${flight?.legs?.length ?? 0} legs)`,
      contact?.struck.kind === "ground" &&
        contact.outcome === "bounce" &&
        leg !== undefined,
    );
    if (
      contact !== undefined &&
      leg !== undefined &&
      leg.segment.kind === "flight"
    ) {
      const e: number | undefined = grenade.body.restitution;
      if (e === undefined)
        throw new Error("grenade lacks its cited soil restitution");
      const rebound: number = leg.segment.projectile.velocity.y;
      const expected: number = -e * contact.velocity.y;
      TestValidator.predicate(
        `the rebound is Newton's (${rebound.toFixed(6)} of ${expected.toFixed(6)} m/s)`,
        Math.abs(rebound - expected) <=
          Number.EPSILON * Math.abs(expected) * 2 ** Math.ceil(Math.log2(4)),
      );
      const record: IAutoMovieInteractionEvent | undefined = thrown
        .hits()
        .find(
          (h: IAutoMovieInteractionEvent): boolean => h.object === "grenade",
        );
      TestValidator.predicate(
        "the hit record states the bounce and the leg's exit",
        record?.outcome === "bounce" &&
          record.exit !== undefined &&
          Vector3.length(
            Vector3.subtract(record.exit, leg.segment.projectile.velocity),
          ) === 0,
      );
    }
    const last: IAutoMovieVector3 = thrown.prop(
      "grenade",
      thrown.duration,
    ).position;
    const before: IAutoMovieVector3 = thrown.prop(
      "grenade",
      thrown.duration - 1,
    ).position;
    TestValidator.predicate(
      `the grenade comes to rest (${(1000 * Vector3.length(Vector3.subtract(last, before))).toFixed(3)} mm in the last second)`,
      Vector3.length(Vector3.subtract(last, before)) === 0,
    );
  }

  // 5. The arrow sticks its depth in.
  const arrow: ReturnType<typeof createProjectile> = createProjectile({
    kind: "arrow",
  });
  let shot: IAutoMovieMotionHumanPerformance | undefined;
  try {
    shot = perform("arrow", arrow, "throwSpear");
  } catch (error) {
    TestValidator.predicate(
      `the arrow's throw plans (${error instanceof Error ? error.message : String(error)})`,
      false,
    );
  }
  if (shot !== undefined) {
    const flight = shot.flights("arrow")[0];
    const contact = flight?.contact;
    TestValidator.predicate(
      `the arrow sticks in the floor (${contact?.struck.kind}, ${contact?.outcome})`,
      contact?.struck.kind === "ground" && contact.outcome === "stick",
    );
    const depth: number | undefined = arrow.body.contact?.embed ?? undefined;
    if (flight !== undefined && contact !== undefined && depth !== undefined) {
      const rest: IAutoMovieVector3 = shot.prop(
        "arrow",
        shot.duration,
      ).position;
      const along: IAutoMovieVector3 = Vector3.normalize(contact.velocity);
      // Where the flight met the floor, read from its own projectile.
      const struck: IAutoMovieVector3 = projectileAt(
        flight.projectile,
        flight.end - flight.launch,
      ).position;
      const deep: number = Vector3.dot(Vector3.subtract(rest, struck), along);
      TestValidator.predicate(
        `the arrow rests its depth on along its flight (${deep.toFixed(6)} of ${depth.toFixed(6)} m)`,
        Math.abs(deep - depth) <=
          Number.EPSILON *
            (Vector3.length(struck) + depth) *
            2 ** Math.ceil(Math.log2(8)),
      );
    }
  }
}
