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
 * A glass taken by a grip chosen for its reach alone is not drunk from where
 * no arm can drink with that grip: the drink is refused with the way to take
 * it.
 *
 * Scenarios, on the average man; a glass is picked up with the right hand by
 * its body grip with no `use`, then the person walks 2 m:
 * 1. A drink from the glass over the walk is a `reach` refusal on `facing`:
 *    at every lean up to 60 degrees and every turn the forearm's twist ends
 *    at its range (measured 2026-11-14: the nearest arm raised 58.3 degrees,
 *    the elbow 149 mm below the shoulder, the twist 0 degrees inside its
 *    range), and its fix names taking the glass for its use. Taken for its
 *    use, the same drink plans (`test_human_motion_core_overlay_hold`).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds the composition through the public input and reads the thrown refusal; a drink planned with no arm at the lips, or refused without the way to take the glass, fails.
 * @evidence contracts/development/testing.md#independent-expectations A glass is drunk from by its lip at the mouth, which a grip chosen for reach alone need not allow; the fix is the grip taken for that use.
 * @evidence contracts/development/testing.md#distinguishing-cases The holding hand used for its own prop by a grip it cannot drink with; the same drink with the glass taken for its use is `test_human_motion_core_overlay_hold`'s, and the holding hand used for something else is `test_human_motion_core_overlay_hold_refusal_wave`'s.
 * @evidence contracts/development/testing.md#execution-ownership Prepares a polygon man and one archetype and builds one performance in memory; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the measured row behind it and the scenario.
 */
export function test_human_motion_core_overlay_hold_refusal_drink(): void {
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
  TestValidator.equals(
    "a drink from a glass taken for reach alone is refused with the way to take it",
    thrown instanceof HumanRefusal &&
      thrown.kind === "reach" &&
      thrown.axis === "facing" &&
      thrown.message.includes("for its use")
      ? "refused"
      : `m-average: expected a reach refusal on facing whose fix names taking it for its use, got ${thrown instanceof Error ? thrown.message : String(thrown)}`,
    "refused",
  );
}
