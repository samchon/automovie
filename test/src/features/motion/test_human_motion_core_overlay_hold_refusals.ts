import { createDrinkware } from "@automovie/archetypes";
import type {
  IAutoMovieMotionHumanPerformance,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

interface IRefusalCase {
  glass: IAutoMovieVector3;
  composition: IAutoMovieMotionHumanPerformance.IInput["composition"];
  expected: string;
  accepts(error: HumanRefusal): boolean;
}

/**
 * An overlay cannot claim a hand that is carrying something. A wave of the
 * holding hand must offer the free hand. A drink uses its own prop and can
 * still fail if the acquisition chose a grip only for its reach. Alt Murphy
 * et al. (2006) describes taking the glass for the drinking task before
 * transporting it to the mouth.
 *
 * The same actor carries a glass in the right hand through a two-metre walk.
 * The wave case keeps its original glass placement and expects an affordance
 * refusal naming the glass and offering the left hand. The drink case keeps
 * its original placement and expects a facing refusal with the instruction
 * to choose a grip for its use. `test_human_motion_core_overlay_hold` covers
 * a wave of the free hand and a drink from a glass taken for that use.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Exercises both overlays through the public chain and checks the refusal kind, axis and guidance.
 * @evidence contracts/development/testing.md#independent-expectations The two cases separate occupancy of a hand from the grip needed by the prop's use.
 * @evidence contracts/development/testing.md#distinguishing-cases One actor and two refusal branches, with fixture positions preserved.
 * @evidence contracts/development/testing.md#execution-ownership Reuses the body and archetype and builds two performances in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States both contracts, their prior setups and resulting refusals.
 */
export function test_human_motion_core_overlay_hold_refusals(): void {
  const body = motionHumanBody("m-average");
  const stature: number = body.measure.stature;
  const glass = createDrinkware({ kind: "glass" });
  const walk = (): ReturnType<typeof HumanChain.subject> =>
    HumanChain.subject("a")
      .pickUp({ prop: "glass", handle: "body", hand: "right" })
      .walk({ to: { x: 0, y: 0, z: 2 } });
  const cases: IRefusalCase[] = [
    {
      glass: { x: 0.15, y: 0.55 * stature, z: 0.2 * stature },
      composition: walk().over((u) =>
        u.gesture({ kind: "wave", side: "right" }),
      ).node,
      expected:
        "an affordance refusal on hand naming the glass and offering left",
      accepts: (error: HumanRefusal): boolean =>
        error.kind === "affordance" &&
        error.axis === "hand" &&
        error.message.includes("glass") &&
        error.feasible?.kind === "alternatives" &&
        error.feasible.values.includes("left"),
    },
    {
      glass: { x: 0.15, y: 0.58 * stature, z: 0.17 * stature },
      composition: walk().over((u) =>
        u.handToFace({ task: "drink", side: "right", prop: "glass" }),
      ).node,
      expected:
        "a reach refusal on facing whose fix names taking it for its use",
      accepts: (error: HumanRefusal): boolean =>
        error.kind === "reach" &&
        error.axis === "facing" &&
        error.message.includes("for its use"),
    },
  ];
  const complaints: string[] = [];
  for (const scenario of cases) {
    let thrown: unknown;
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
          HumanObject.prop("glass", glass, { at: scenario.glass, yaw: 0 }),
        ],
        composition: scenario.composition,
      });
    } catch (error) {
      thrown = error;
    }
    if (!(thrown instanceof HumanRefusal && scenario.accepts(thrown)))
      complaints.push(
        `expected ${scenario.expected}, got ${thrown instanceof Error ? thrown.message : String(thrown)}`,
      );
  }
  TestValidator.equals("held-hand overlay refusals", complaints, []);
}
