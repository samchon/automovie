import { createDrinkware } from "@automovie/archetypes";
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
 * A hand that holds a prop does nothing else: a wave of the holding hand,
 * put over a walk, is refused with the hand that is free. And a glass taken
 * by a grip chosen for its reach alone is not drunk from where no arm can
 * drink with that grip: the drink is refused with the way to take it.
 *
 * The performance refuses an overlay that drives a holding hand without a
 * grip window on its prop, as it refuses the next action that does. It
 * knows a hand is driven from the plan's contact windows and its `hands`
 * member. Measured 2026-11-13 on both bodies: the composition below planned
 * and no refusal was thrown, because the `gesture` law's plan named no hand
 * it waves (`everyday/gesture.ts`), so the wave was not seen to use the
 * hand. The test fails until `gesture` declares `hands`.
 *
 * Scenarios, on the average man and the small woman; a glass is picked up
 * with the right hand, then the person walks 2 m:
 * 1. A wave of the right hand over the walk is an `affordance` refusal on
 *    `hand` whose message names the glass and whose alternatives offer
 *    `left`.
 * 2. On the average man, a drink from the glass taken by its body grip
 *    with no `use`, over the walk, is a `reach` refusal on `facing`: at
 *    every lean up to 60 degrees and every turn the forearm's twist ends at
 *    its range (measured 2026-11-14: the nearest arm raised 58.3 degrees,
 *    the elbow 149 mm below the shoulder, the twist 0 degrees inside its
 *    range), and its fix names taking the glass for its use. Taken for its
 *    use, the same drink plans (`test_human_motion_core_overlay_hold`).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds the composition through the public input and reads the thrown refusal; a holding hand waved without a refusal fails.
 * @evidence contracts/development/testing.md#independent-expectations One hand does one thing, the motion skill's held-object rule; the free hand is the one that holds nothing.
 * @evidence contracts/development/testing.md#distinguishing-cases The holding hand used for something else, and the holding hand used for its own prop by a grip it cannot drink with; the free hand and the glass taken for its use are `test_human_motion_core_overlay_hold`'s.
 * @evidence contracts/development/testing.md#execution-ownership Prepares polygon men and one archetype and builds two performances in memory; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the two rules, the measured row of its known failure and the two scenarios.
 */
export function test_human_motion_core_overlay_hold_refusal(): void {
  const complaints: string[] = [];
  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    let thrown: unknown = null;
    try {
      new HumanPerformance({
        seed: "overlay-hold",
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        props: [
          HumanObject.prop("glass", createDrinkware({ kind: "glass" }), {
            at: {
              x: 0.15,
              y: 0.55 * body.measure.stature,
              z: 0.2 * body.measure.stature,
            },
            yaw: 0,
          }),
        ],
        composition: HumanChain.subject("a")
          .pickUp({ prop: "glass", handle: "body", hand: "right" })
          .walk({ to: { x: 0, y: 0, z: 2 } })
          .over((u) => u.gesture({ kind: "wave", side: "right" })).node,
      });
    } catch (error) {
      thrown = error;
    }
    if (
      !(
        thrown instanceof HumanRefusal &&
        thrown.kind === "affordance" &&
        thrown.axis === "hand" &&
        thrown.message.includes("glass") &&
        thrown.feasible?.kind === "alternatives" &&
        thrown.feasible.values.includes("left")
      )
    )
      complaints.push(
        `${name}: a wave of the hand that holds the glass, over the walk: expected an affordance refusal on hand naming the glass and offering left, got ${thrown instanceof Error ? thrown.message : String(thrown)}`,
      );
  }
  // 2. A drink from a glass taken for reach alone.
  {
    const body: IHumanBody = motionHumanBody("m-average");
    let thrown: unknown = null;
    try {
      new HumanPerformance({
        seed: "overlay-hold",
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        props: [
          HumanObject.prop("glass", createDrinkware({ kind: "glass" }), {
            at: {
              x: 0.15,
              y: 0.58 * body.measure.stature,
              z: 0.17 * body.measure.stature,
            },
            yaw: 0,
          }),
        ],
        composition: HumanChain.subject("a")
          .pickUp({ prop: "glass", handle: "body", hand: "right" })
          .walk({ to: { x: 0, y: 0, z: 2 } })
          .over((u) =>
            u.handToFace({ task: "drink", side: "right", prop: "glass" }),
          ).node,
      });
    } catch (error) {
      thrown = error;
    }
    if (
      !(
        thrown instanceof HumanRefusal &&
        thrown.kind === "reach" &&
        thrown.axis === "facing" &&
        thrown.message.includes("for its use")
      )
    )
      complaints.push(
        `m-average: a drink over the walk from the glass taken by its body grip with no use: expected a reach refusal on facing whose fix names taking it for its use, got ${thrown instanceof Error ? thrown.message : String(thrown)}`,
      );
  }
  TestValidator.equals("a holding hand does nothing else", complaints, []);
}
