import { createKettlebell } from "@automovie/archetypes";
import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanSignature,
  HumanSportCarry,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A farmer's walk (`HumanSportCarry.farmersWalk` with `farmersHold` over
 * it): a kettlebell picked up in each hand and carried over a walk, the
 * arms let down to hang and the trunk upright.
 *
 * Each body stands with a kettlebell on a rack beside each hand, its handle
 * 0.9 of the arm below the shoulder joint and under it, each lifted 2 cm
 * off its rack so the arm stays long, takes the
 * right bell, then the left, and walks 3 m. The bells start on racks, not
 * the floor: the lift from the floor is the deadlift's.
 *
 * Scenarios, on the small woman and the average man, read every quarter of
 * a second over the hold, from 0.75 s into the walk (once the arms have
 * settled) to its 3 s:
 * 1. The two pick-ups and the walk plan.
 * 2. Each bell keeps its place in its hand's frame within 1 mm (the
 *    campaign's grip bound).
 * 3. Each elbow stays within 30 degrees of straight (provisional): the arms
 *    hang. (A wrist cannot hang below the hips joint here: a grip is
 *    picked up no farther from the shoulder than the arm, so the hand
 *    hangs that much higher.)
 * 4. The line from the hips joint to the neck stays within 10 degrees of
 *    vertical (provisional): the trunk is upright under the load.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Places two real archetypes per body, builds the performance through the public chain and reads displayed props and joints; a bell left behind, arms bent or a trunk that leans fails.
 * @evidence contracts/development/testing.md#independent-expectations The 1 mm is the campaign's grip bound; hanging arms and an upright trunk are what the exercise is; the 10 degrees is stated provisional.
 * @evidence contracts/development/testing.md#distinguishing-cases Two statures, two hands.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and two archetypes each and builds two performances; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the stage, why the bells are racked and the 4 scenarios with their bounds.
 */
export function test_human_motion_sport_carry(): void {
  const bell: ReturnType<typeof createKettlebell> = createKettlebell({});
  const handle: IAutoMovieVector3 = bell.affordance("grip").frame.translation;
  const complaints: string[] = [];
  const mm = (metres: number): string => (metres * 1000).toFixed(1);
  for (const name of ["f-small", "m-average"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const shoulder: IAutoMovieVector3 = body.rest.get("rightUpperArm")!;
    const arm: number = body.measure.upperArm + body.measure.forearm;
    const rack = (sign: number): HumanObject.Placement => ({
      at: {
        x: sign * body.measure.shoulderHalfWidth,
        y: shoulder.y - 0.9 * arm - handle.y,
        z: 0.05,
      },
      yaw: 0,
    });
    let performance: HumanPerformance;
    try {
      performance = new HumanPerformance({
        seed: "farmer",
        laws: [HumanSportCarry.farmersWalk, HumanSportCarry.farmersHold],
        props: [
          HumanObject.prop("bellR", bell, rack(-1)),
          HumanObject.prop("bellL", bell, rack(1)),
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
          .pickUp({ prop: "bellR", handle: "grip", hand: "right", lift: 0.02 })
          .pickUp({ prop: "bellL", handle: "grip", hand: "left", lift: 0.02 })
          .registered("farmersWalk", { to: { x: 0, y: 0, z: 3 } })
          .over(
            (o: HumanChain): HumanChain =>
              o.registered("farmersHold", {
                left: "bellL",
                right: "bellR",
                seconds: 3,
              }),
          ).node,
      });
    } catch (error) {
      complaints.push(
        `${name}: expected to plan, got ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }
    const walking = performance.segments("a")[2]!;
    const reader: HumanSignature.IReader = HumanSignature.of(
      performance,
      "a",
      body,
      0,
    );
    const seat = (
      prop: string,
      side: "left" | "right",
      seconds: number,
    ): IAutoMovieVector3 => {
      const hand: IAutoMovieResolvedBone = performance
        .bones("a", seconds)
        .get(`${side}Hand`)!;
      return Quaternion.rotateVector(
        Quaternion.inverse(hand.worldRotation),
        Vector3.subtract(performance.prop(prop, seconds).position, hand.worldPosition),
      );
    };
    const first = {
      right: seat("bellR", "right", walking.entryTime),
      left: seat("bellL", "left", walking.entryTime),
    };
    const worst = { drift: 0, raised: -Infinity, lean: 0 };
    // The arms have settled half a second into the walk.
    for (let seconds: number = walking.entryTime + 0.75; seconds <= walking.entryTime + 3; seconds += 0.25) {
      for (const [prop, side] of [
        ["bellR", "right"],
        ["bellL", "left"],
      ] as const) {
        worst.drift = Math.max(
          worst.drift,
          Vector3.length(Vector3.subtract(seat(prop, side, seconds), first[side])),
        );
        worst.raised = Math.max(
          worst.raised,
          HumanSignature.elbow(reader, seconds, side),
        );
      }
      const hips: IAutoMovieVector3 = HumanSignature.joint(reader, seconds, "hips");
      const neck: IAutoMovieVector3 = HumanSignature.joint(reader, seconds, "neck");
      worst.lean = Math.max(
        worst.lean,
        (Math.acos(
          (neck.y - hips.y) /
            Math.hypot(neck.x - hips.x, neck.y - hips.y, neck.z - hips.z),
        ) *
          180) /
          Math.PI,
      );
    }
    if (!(worst.drift <= 0.001))
      complaints.push(
        `${name}: a bell moves ${mm(worst.drift)} mm in its hand's frame over the walk, within 1 mm expected`,
      );
    if (!(worst.raised <= 30))
      complaints.push(
        `${name}: an elbow bends ${worst.raised.toFixed(1)} degrees over the walk, within 30 expected`,
      );
    if (!(worst.lean <= 10))
      complaints.push(
        `${name}: the trunk leans ${worst.lean.toFixed(1)} degrees from vertical over the walk, within 10 expected`,
      );
  }
  TestValidator.equals("a farmer's walk", complaints, []);
}
