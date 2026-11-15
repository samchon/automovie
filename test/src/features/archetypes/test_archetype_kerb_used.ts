import { createKerb, createTap } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  type HumanSegment,
  HumanSignature,
  HumanSportGym,
  type IHumanBody,
  type IHumanProp,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A step and a kerb serve the step-up that bears on them, and a tap's lever serves the hand that turns it: each act reads the archetype's own `top` or `lever`.
 *
 * A step stands 1.2 m behind the performer and a kerb 1.2 m to the left, each front face toward the performer; a mixer tap stands on a counter's height, 0.9 m, before the right hand.
 *
 * Scenarios, on the average man and the small woman:
 * 1. A step-up `on` the step's `top`, then one `on` the kerb's `top`, plan; at each `up1` the right ankle is 0 to 0.15 m above that top (an ankle's own height with room, as the gym step-up's test bounds it) and within 0.4 m of its middle on the floor plan.
 * 2. Turning the tap's `lever` a quarter turn plans, and at its `ready` the right wrist lies within a hand's length and a fifth of the lever (provisional: a hand that has reached the lever's hub).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds the step-ups and the turn through the public chain with the real step, kerb and tap and reads the displayed joints against their affordances; a foot that lands off the top or a hand that does not come to the lever fails with the distance.
 * @evidence contracts/development/testing.md#independent-expectations The tops and the lever are the archetypes' affordances carried by the props' placements; the bounds are stated estimates; nothing is read from the laws but their events.
 * @evidence contracts/development/testing.md#distinguishing-cases A step's riser and a kerb's upstand, and a turned part, on two bodies of opposite build.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and two films each; it runs locally and wherever CI runs the archetype tests.
 * @evidence contracts/development/common.md#meaningful-documentation States what is pinned, the bounds and the 2 scenarios.
 */
export function test_archetype_kerb_used(): void {
  const step: ReturnType<typeof createKerb> = createKerb({ kind: "step" });
  const kerb: ReturnType<typeof createKerb> = createKerb({ kind: "kerb" });
  const tap: ReturnType<typeof createTap> = createTap();
  const places: Readonly<Record<"step" | "kerb", IHumanProp.IFrame>> = {
    step: {
      position: { x: 0, y: 0, z: -1.2 - step.dimensions.depth! },
      rotation: Quaternion.identity(),
    },
    kerb: {
      position: { x: 1.2 + kerb.dimensions.depth!, y: 0, z: 0 },
      rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, -90),
    },
  };
  const complaints: string[] = [];
  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const performer: HumanPerformance.IInput["performers"][number] = {
      subject: "a",
      body,
      at: { x: 0, y: 0, z: 0 },
      yaw: 0,
      proficiency: { level: "trained" },
    };
    const when = (
      film: HumanPerformance,
      index: number,
      event: string,
    ): number => {
      const found: HumanSegment.ISegment = film.segments("a")[index]!;
      return (
        found.start +
        (found.plan.events.find((e): boolean => e.name === event)?.share ??
          Number.NaN) *
          found.plan.duration
      );
    };

    // 1. Up onto the step and the kerb.
    try {
      const film: HumanPerformance = new HumanPerformance({
        seed: "kerb",
        laws: [HumanSportGym.stepUp],
        performers: [performer],
        props: [
          HumanObject.prop("step", step, places.step),
          HumanObject.prop("kerb", kerb, places.kerb),
        ],
        composition: HumanChain.subject("a")
          .stand({ seconds: 0.3 })
          .registered("stepUp", {
            reps: 1,
            on: { prop: "step", affordance: "top" },
          })
          .stand({ seconds: 0.3 })
          .registered("stepUp", {
            reps: 1,
            on: { prop: "kerb", affordance: "top" },
          }).node,
      });
      const reader: HumanSignature.IReader = HumanSignature.of(
        film,
        "a",
        body,
        0,
      );
      for (const [prop, index, archetype] of [
        ["step", 1, step],
        ["kerb", 3, kerb],
      ] as const) {
        const frame: IHumanProp.IFrame = places[prop];
        const top: IAutoMovieVector3 = Vector3.add(
          frame.position,
          Quaternion.rotateVector(
            frame.rotation,
            archetype.affordance("top").frame.translation,
          ),
        );
        const ankle: IAutoMovieVector3 = HumanSignature.joint(
          reader,
          when(film, index, "up1"),
          "rightFoot",
        );
        const above: number = ankle.y - top.y;
        const off: number = Math.hypot(ankle.x - top.x, ankle.z - top.z);
        if (!(above >= 0 && above <= 0.15 && off <= 0.4))
          complaints.push(
            `${name} ${prop}: at up1 the right ankle is ${above.toFixed(3)} m above the top (0 to 0.15 m) and ${off.toFixed(3)} m from its middle on the floor plan (0.4 m)`,
          );
      }
    } catch (error) {
      complaints.push(
        `${name} step-ups: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    // 2. A quarter turn of the tap's lever.
    try {
      const at: IAutoMovieVector3 = {
        x: -body.measure.shoulderHalfWidth,
        y: 0.9,
        z: 0.45 * (body.measure.upperArm + body.measure.forearm),
      };
      const film: HumanPerformance = new HumanPerformance({
        seed: "tap",
        laws: [],
        performers: [performer],
        props: [HumanObject.prop("tap", tap, { at, yaw: 180 })],
        composition: HumanChain.subject("a")
          .stand({ seconds: 0.3 })
          .registered("operate", {
            mechanism: {
              kind: "knob",
              at: { kind: "prop", subject: "tap", point: "lever" },
              turn: 90,
            },
          }).node,
      });
      const ready: number = when(film, 1, "ready");
      const frame: IHumanProp.IFrame = film.prop("tap", ready);
      const lever: IAutoMovieVector3 = Vector3.add(
        frame.position,
        Quaternion.rotateVector(
          frame.rotation,
          tap.affordance("lever").frame.translation,
        ),
      );
      const wrist: IAutoMovieVector3 = film
        .bones("a", ready)
        .get("rightHand")!.worldPosition;
      const off: number = Vector3.length(Vector3.subtract(wrist, lever));
      if (!(off <= 1.2 * body.measure.hand))
        complaints.push(
          `${name} tap: at ready the right wrist lies ${off.toFixed(3)} m from the lever, within ${(1.2 * body.measure.hand).toFixed(3)} m expected`,
        );
    } catch (error) {
      complaints.push(
        `${name} tap: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  TestValidator.equals(
    "a step, a kerb and a tap serve their acts",
    complaints,
    [],
  );
}
