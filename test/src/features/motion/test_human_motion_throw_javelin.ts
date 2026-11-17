import type { IAutoMovieMotionHumanBody, IAutoMovieMotionHumanPerformance } from "@automovie/interface";
import { createJavelin } from "@automovie/archetypes";
import { AutoMovieGravity, Quaternion, Vector3 } from "@automovie/engine";
import { HumanChain, HumanObject, HumanPerformance, HumanThrownWeapon } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A soldier's javelin (#3490): a row of the throw, released at the middle of
 * the elite release angles, its shaft along its flight.
 *
 * Scenarios, the average man and the small woman throwing a men's javelin
 * from the hand at a point 25 m ahead on the floor, at trained proficiency,
 * then standing for the flight's longest time to that point:
 * 1. The throw launches the javelin once, with the velocity attitude.
 * 2. The release angle above the horizontal is the row's, (27.7 + 40.1) / 2
 *    degrees (Campos, Brizuela and Ramón 2004), within 1e-6 degrees.
 * 3. Through the flight the javelin's rotation keeps its +Z along its
 *    velocity within 1 degree at ten instants (#3490's bound).
 * 4. The flight ends on the floor.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Throws a real javelin archetype through the public chain and reads the launch and the flight; a release at another angle, a javelin flying sideways or one that never lands fails.
 * @evidence contracts/development/testing.md#independent-expectations The angle band is the cited study's, the 1 degree #3490's bound.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies; the release, the flight and the landing.
 * @evidence contracts/development/testing.md#execution-ownership Builds two performances in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the four numbered scenarios with their bounds.
 */
export function test_human_motion_throw_javelin(): void {
  const javelin: ReturnType<typeof createJavelin> = createJavelin({
    kind: "men",
  });
  for (const name of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    // The flight's time to the floor point, at most sqrt(2 (d tan a + h) / g)
    // for a release no higher than the stature `h`: the range equation's own
    // time to the target. The thrower stands that long after the throw.
    const aloft: number = Math.sqrt(
      (2 *
        (25 * Math.tan((HumanThrownWeapon.JAVELIN * Math.PI) / 180) +
          body.measure.stature)) /
        AutoMovieGravity.STANDARD,
    );
    let performance: IAutoMovieMotionHumanPerformance;
    try {
      performance = new HumanPerformance({
        seed: "javelin",
        laws: [HumanThrownWeapon.throwJavelin],
        props: [
          HumanObject.prop("javelin", javelin, {
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
          .pickUp({ prop: "javelin", handle: "grip" })
          .registered("throwJavelin", {
            at: { kind: "point", frame: "world", at: { x: 0, y: 0, z: 25 } },
            prop: "javelin",
          })
          .stand({ seconds: aloft }).node,
      });
    } catch (error) {
      TestValidator.predicate(
        `${name}: the throw plans (${error instanceof Error ? error.message : String(error)})`,
        false,
      );
      continue;
    }
    const launches = performance.segments("a")[1]!.plan.launches ?? [];
    TestValidator.predicate(
      `${name}: one launch with the velocity attitude`,
      launches.length === 1 && launches[0]!.attitude?.kind === "velocity",
    );
    const v = launches[0]?.velocity;
    if (v === undefined) continue;
    const angle: number =
      (Math.atan2(v.y, Math.hypot(v.x, v.z)) * 180) / Math.PI;
    TestValidator.predicate(
      `${name}: released at the band's middle (${angle.toFixed(4)} degrees)`,
      Math.abs(angle - HumanThrownWeapon.JAVELIN) <= 1e-6,
    );
    const flight = performance.flights("javelin")[0];
    if (flight === undefined) {
      TestValidator.predicate(`${name}: the javelin flies`, false);
      continue;
    }
    let worst: number = 0;
    const end: number = Math.min(flight.end, performance.duration);
    for (let k: number = 1; k <= 10; k++) {
      const t: number = flight.launch + ((end - flight.launch) * k) / 11;
      const frame = performance.prop("javelin", t);
      const ahead = Vector3.normalize(
        Vector3.subtract(
          performance.prop("javelin", t + 1e-3).position,
          frame.position,
        ),
      );
      const turned = Quaternion.rotateVector(frame.rotation, {
        x: 0,
        y: 0,
        z: 1,
      });
      worst = Math.max(
        worst,
        (Math.acos(Math.max(-1, Math.min(1, Vector3.dot(turned, ahead)))) *
          180) /
          Math.PI,
      );
    }
    TestValidator.predicate(
      `${name}: the shaft follows the flight (${worst.toFixed(2)} degrees)`,
      worst <= 1,
    );
    TestValidator.predicate(
      `${name}: the flight ends on the floor`,
      flight.contact?.struck.kind === "ground",
    );
  }
}
