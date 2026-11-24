import { createDevice, createDrinkware } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanObject,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  HumanSignature,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "./motionHumanBody";
import { motionPropHeldDrift } from "./motionPropHeldDrift";

/**
 * The tasks with held objects on one body, which the
 * `test_human_motion_prop_held_use_*` specs read: a person picks a phone up and
 * holds its screen to the ear, and a held glass is refused what it cannot be
 * asked (#3358, #3346). The objects are archetypes, read through
 * `HumanObject.prop`, each standing at waist height before the right shoulder,
 * 0.6 of the arm's length ahead.
 *
 * The drink from a held glass, its rim at the mouth and its grip, is read on
 * every body by the `test_human_motion_prop_held_attitude_*` specs, off the one
 * film of that drink that also gives its attitude: the two readers performed
 * the same pick-up and drink apart, each a pick-up for a use that costs seconds
 * to plan.
 *
 * Scenarios, on the body (a flat device and a refusal show on one body, and a
 * second stature adds nothing to a refusal):
 *
 * 1. A held phone at the ear: the screen's centre lies within 15 mm of the right
 *    ear region at `atEar`.
 * 2. From the grip's closing to the end of a stand that follows the call, the
 *    phone stays where it was in the hand's own frame within 1 mm (the
 *    campaign's bound for a grip, `motionPropHeldDrift`).
 * 3. Refused, each naming its axis: the drink with a glass that still stands on
 *    the table (`prop`: the hand does not hold it), and a held glass asked for
 *    a point it does not have (`point`, listing the glass's points).
 *
 * @param name The body.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the placement, where the glass's drink is read and why, and the 3 scenarios with their bounds and sources.
 * @evidence contracts/development/implementation.md#principled-implementation Places real archetypes, builds performances through the public chain and reads the displayed prop frame, hand and ear region and the thrown refusals.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One performance and reading for the phone, then the refusals, gathered as complaints and asserted once.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A task that does not plan is a complaint with the refusal's words; the bounds are the spec's own, unchanged by the split.
 * @evidence contracts/development/implementation.md#efficient-algorithms One short performance for the phone, the grip read every half second, and one composition per refusal.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The grip's reading is `motionPropHeldDrift`, shared with `motionPropHeldAttitude`.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing past the call.
 */
export function motionPropHeldUse(name: motionHumanBody.Name): void {
  const complaints: string[] = [];
  const glass: ReturnType<typeof createDrinkware> = createDrinkware({
    kind: "glass",
  });
  const phone: ReturnType<typeof createDevice> = createDevice({
    kind: "phone",
  });
  const mm = (metres: number): string => (metres * 1000).toFixed(1);
  const body: IAutoMovieMotionHumanBody = motionHumanBody(name);

  // Before the right shoulder (the body's right is the world's -X at yaw 0).
  const stood: IAutoMovieMotionHumanObject.Placement = {
    at: {
      x: -body.measure.shoulderHalfWidth,
      y: body.measure.waistHeight,
      z: 0.6 * (body.measure.upperArm + body.measure.forearm),
    },
    yaw: 0,
  };
  const perform = (
    prop: IAutoMovieMotionHumanProp,
    composition: IAutoMovieMotionHumanChain,
  ): IAutoMovieMotionHumanPerformance =>
    new HumanPerformance({
      seed: "held",
      props: [prop],
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: composition.node,
    });

  // 1 and 2. The phone's screen at the ear, and the phone in the hand.
  try {
    const performance: IAutoMovieMotionHumanPerformance = perform(
      HumanObject.prop("phone", phone, stood),
      HumanChain.subject("a")
        .pickUp({ prop: "phone", handle: "grip" })
        .handToFace({ kind: "phone", prop: "phone", hold: 1 })
        .stand({ hold: 0.5 }),
    );
    const call: IAutoMovieMotionHumanSegment = performance.segments("a")[1]!;
    const seconds: number =
      call.start +
      (call.plan.events.find((e): boolean => e.name === "atEar")?.share ??
        NaN) *
        call.plan.duration;
    const frame: IAutoMovieRigidTransform = performance.prop("phone", seconds);
    const off: number = Vector3.length(
      Vector3.subtract(
        Vector3.add(
          frame.position,
          Quaternion.rotateVector(
            frame.rotation,
            phone.affordance("screen").frame.translation,
          ),
        ),
        HumanSignature.region(
          HumanSignature(performance, "a", body, 0),
          "earRight",
          seconds,
        ),
      ),
    );
    if (!(off <= 0.015))
      complaints.push(
        `${name}: the held phone's screen is ${mm(off)} mm from the right ear at atEar, within 15 mm expected`,
      );
    const moved: number = motionPropHeldDrift(performance, "phone");
    if (!(moved <= 0.001))
      complaints.push(
        `${name}: the held phone moves ${mm(moved)} mm in the hand's frame, within 1 mm expected`,
      );
  } catch (error) {
    complaints.push(
      `${name}: the held phone: expected to plan, got ${(error as Error).message}`,
    );
  }

  // 3. What a held prop cannot be asked.
  for (const [label, chain, axis, lists] of [
    [
      "a drink from a glass left on the table",
      HumanChain.subject("a")
        .stand({ hold: 0.3 })
        .handToFace({ kind: "drink", prop: "glass" }),
      "prop",
      null,
    ],
    [
      "a point the glass lacks",
      HumanChain.subject("a")
        .pickUp({
          prop: "glass",
          handle: "body",
          use: { tip: "lip", line: "square", at: "mouth" },
        })
        .handToFace({ kind: "drink", prop: "glass", point: "spout" }),
      "point",
      "lip",
    ],
  ] as const) {
    let thrown: unknown = null;
    try {
      perform(HumanObject.prop("glass", glass, stood), chain);
    } catch (error) {
      thrown = error;
    }
    if (
      !(
        thrown instanceof HumanRefusal &&
        thrown.kind === "affordance" &&
        thrown.axis === axis &&
        (lists === null ||
          (thrown.feasible?.kind === "alternatives" &&
            thrown.feasible.values.includes(lists)))
      )
    )
      complaints.push(
        `${name}: ${label}: expected an affordance refusal on ${axis}, got ${thrown instanceof Error ? thrown.message : String(thrown)}`,
      );
  }
  TestValidator.equals(`tasks with held objects (${name})`, complaints, []);
}
