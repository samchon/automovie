import { createRelayBaton } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanThrownWeapon,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A thrown knife's turns (#3490): it spins at the throwing arm's rate,
 * rounded by the act to a whole number of half turns over the flight to the
 * target, so the stand-off decides the turns.
 *
 * Scenarios, the average man throwing a held relay baton (a rigid stick in
 * the hand, standing in for a knife the archetypes do not yet build) with
 * `throwKnife` at floor points 4 m and 8 m ahead, at trained proficiency:
 * 1. Each throw launches the baton once with a spin.
 * 2. The spin's rate times the drag-free flight time to the target is a
 *    whole number of half turns, at least one, within 1e-9 half turns.
 * 3. The spin axis, carried into the world by the baton's displayed
 *    rotation at the release, is square to the launch velocity within 1
 *    degree (provisional: the displayed hand against its goal): it turns in
 *    the throw's plane.
 * 4. The farther stand-off turns at least as many half turns as the nearer.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Throws a real archetype through the public chain and reads the published spin and the displayed prop; a typed rate, an axis out of the throw's plane or turns that ignore the stand-off fail.
 * @evidence contracts/development/testing.md#independent-expectations Whole half turns is the act's rule; the flight time is the drag-free path's own; the 1 degree bound is marked provisional.
 * @evidence contracts/development/testing.md#distinguishing-cases Two stand-offs; the rate, the axis and the order of the turns.
 * @evidence contracts/development/testing.md#execution-ownership Builds two performances in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the four numbered scenarios with their bounds.
 */
export function test_human_motion_throw_knife_turns(): void {
  const baton: ReturnType<typeof createRelayBaton> = createRelayBaton({});
  const body: IHumanBody = motionHumanBody("m-average");
  const turns: number[] = [];
  for (const distance of [4, 8]) {
    const target: IAutoMovieVector3 = { x: 0, y: 0, z: distance };
    let performance: HumanPerformance;
    try {
      performance = new HumanPerformance({
        seed: "knife",
        laws: [HumanThrownWeapon.throwKnife],
        props: [
          HumanObject.prop("knife", baton, {
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
          .pickUp({ prop: "knife", handle: "grip" })
          .registered("throwKnife", {
            at: { kind: "point", frame: "world", at: target },
            prop: "knife",
          }).node,
      });
    } catch (error) {
      TestValidator.predicate(
        `${distance} m: the throw plans (${error instanceof Error ? error.message : String(error)})`,
        false,
      );
      continue;
    }
    const segment = performance.segments("a")[1]!;
    const launches = segment.plan.launches ?? [];
    const launch = launches[0];
    const attitude = launch?.attitude;
    TestValidator.predicate(
      `${distance} m: one launch with a spin`,
      launches.length === 1 && attitude?.kind === "spin",
    );
    if (launch === undefined || attitude?.kind !== "spin") continue;
    const time: number =
      Math.hypot(target.x - launch.point.x, target.z - launch.point.z) /
      Math.hypot(launch.velocity.x, launch.velocity.z);
    const halves: number = (attitude.rate * time) / 180;
    TestValidator.predicate(
      `${distance} m: whole half turns (${halves.toFixed(6)})`,
      Math.abs(halves - Math.round(halves)) <= 1e-9 && Math.round(halves) >= 1,
    );
    turns.push(Math.round(halves));
    const shown = performance.prop("knife", segment.start + launch.seconds);
    const axis: IAutoMovieVector3 = Quaternion.rotateVector(
      shown.rotation,
      Vector3.normalize(attitude.axis),
    );
    const square: number =
      (Math.asin(
        Math.min(
          1,
          Math.abs(Vector3.dot(axis, Vector3.normalize(launch.velocity))),
        ),
      ) *
        180) /
      Math.PI;
    TestValidator.predicate(
      `${distance} m: the spin turns in the throw's plane (${square.toFixed(3)} degrees off)`,
      square <= 1,
    );
  }
  if (turns.length === 2)
    TestValidator.predicate(
      `the farther stand-off turns at least as many half turns (${turns[0]} then ${turns[1]})`,
      turns[1]! >= turns[0]!,
    );
}
