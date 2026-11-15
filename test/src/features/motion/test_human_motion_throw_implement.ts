import { createStick } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanThrownWeapon,
  type IHumanBody,
  throwObject,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A throw from an implement that lengthens the arm (#3490): the launch
 * leaves the implement's working point, which the lever carries faster than
 * the hand.
 *
 * Scenarios, the average man and the small woman holding a field hockey
 * stick by its grip as the implement, its blade as the working point,
 * casting at a point 15 m ahead on the floor, at trained proficiency:
 * 1. The cast plans.
 * 2. The launch's drag-free path passes through the target, within 1e-6 m
 *    at the time its horizontal distance takes at its horizontal speed.
 * 3. At the release second the stick's blade is at the launch point, within
 *    1 cm (provisional, the arm goal's placement to be read in the run).
 * 4. The blade's velocity across the release (central difference over
 *    +-1 ms inside the 10 ms carry) is the launch velocity within 5% of its
 *    speed (provisional, the same placement).
 * 5. The grip's point moves slower than the blade at the release: the lever
 *    carries its end faster than the hand.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Casts from a real stick archetype through the public chain and reads the launch, the displayed implement and the target; an implement left out of the lever, turned off its line or a hand carrying the full launch fails.
 * @evidence contracts/development/testing.md#independent-expectations The target and the stick are the scene's; the path's bound is round-off, the 1 cm and 5% bounds are marked provisional.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies; the aim, the release point, the release velocity and the lever's gain.
 * @evidence contracts/development/testing.md#execution-ownership Builds two performances in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the five numbered scenarios with their bounds.
 */
export function test_human_motion_throw_implement(): void {
  const stick: ReturnType<typeof createStick> = createStick({
    kind: "fieldHockey",
  });
  const local = (id: string): IAutoMovieVector3 =>
    stick.affordances.find((a: IAutoMovieAffordance): boolean => a.id === id)!
      .frame.translation;
  const target: IAutoMovieVector3 = { x: 0, y: 0, z: 15 };
  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    let performance: HumanPerformance;
    try {
      performance = new HumanPerformance({
        seed: "atlatl",
        laws: [HumanThrownWeapon.castAtlatl],
        props: [
          HumanObject.prop("stick", stick, {
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
          .pickUp({ prop: "stick", handle: "grip" })
          .registered("castAtlatl", {
            at: { kind: "point", frame: "world", at: target },
            implement: { prop: "stick", point: "blade" },
          }).node,
      });
    } catch (error) {
      TestValidator.predicate(
        `${name}: the cast plans (${error instanceof Error ? error.message : String(error)})`,
        false,
      );
      continue;
    }
    const segment = performance.segments("a")[1]!;
    const launch: throwObject.ILaunch | undefined = throwObject.of(
      segment.plan,
    );
    if (launch === undefined) {
      TestValidator.predicate(`${name}: the cast carries its launch`, false);
      continue;
    }
    const time: number =
      Math.hypot(target.x - launch.point.x, target.z - launch.point.z) /
      Math.hypot(launch.velocity.x, launch.velocity.z);
    const miss: number = Vector3.length(
      Vector3.subtract(throwObject.path(launch, time), target),
    );
    TestValidator.predicate(
      `${name}: the path passes through the target (${miss.toExponential(2)} m)`,
      miss <= 1e-6,
    );

    const at = (id: string, seconds: number): IAutoMovieVector3 => {
      const frame = performance.prop("stick", seconds);
      return Vector3.add(
        frame.position,
        Quaternion.rotateVector(frame.rotation, local(id)),
      );
    };
    const release: number = segment.start + launch.seconds;
    const off: number = Vector3.length(
      Vector3.subtract(at("blade", release), launch.point),
    );
    TestValidator.predicate(
      `${name}: the blade is at the launch point (${off.toFixed(4)} m)`,
      off <= 0.01,
    );
    const dt: number = 1e-3;
    const velocity = (id: string): IAutoMovieVector3 =>
      Vector3.scale(
        Vector3.subtract(at(id, release + dt), at(id, release - dt)),
        1 / (2 * dt),
      );
    const blade: IAutoMovieVector3 = velocity("blade");
    const error: number =
      Vector3.length(Vector3.subtract(blade, launch.velocity)) /
      Vector3.length(launch.velocity);
    TestValidator.predicate(
      `${name}: the blade leaves with the launch velocity (${(error * 100).toFixed(2)}%)`,
      error <= 0.05,
    );
    const hand: number = Vector3.length(velocity("grip"));
    TestValidator.predicate(
      `${name}: the hand moves slower than the blade (${hand.toFixed(2)} < ${Vector3.length(blade).toFixed(2)} m/s)`,
      hand < Vector3.length(blade),
    );
  }
}
