import { createDrinkware, createSmoking } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanChain,
  HumanHabit,
  HumanObject,
  HumanPerformance,
  type HumanSegment,
  HumanSignature,
  type IHumanBody,
  type IHumanProp,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A held object keeps the attitude its use needs: a glass at the mouth
 * stays upright, and a held cigarette's end reaches the lips.
 *
 * Each object stands at waist height before the right shoulder, 0.6 of the
 * arm's length ahead, and is picked up and then used. A glass is taken for
 * its use (`pickUp`'s `use`: the lip at the mouth, the vessel upright), since
 * the grip a hand takes decides what the arm can do with the object later.
 * `test_human_motion_prop_held_use` holds the rim's place and the grip.
 *
 * Scenarios, on the small woman and the average man:
 * 1. Through the hold of a drink from a held glass, the glass's axis stands
 *    within 10 degrees of upright.
 * 2. At `atLips` of `smoke` with a held cigarette, its mouth end lies
 *    within 15 mm of the mouth region.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Places real archetypes, builds performances through the public chain and reads the displayed prop frame and the mouth region; a tipped glass or a cigarette short of the lips fails.
 * @evidence contracts/development/testing.md#independent-expectations The bounds are acceptance lines of #3361 and #3346; the mouth end is the archetype's own affordance.
 * @evidence contracts/development/testing.md#distinguishing-cases A vessel whose attitude matters and a rod whose end matters, on two statures; the rim's place and the grip's drift are `test_human_motion_prop_held_use`'s.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and two archetypes and builds four short performances; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the scene, why the glass is taken for its use and the 2 scenarios with their bounds.
 */
export function test_human_motion_prop_held_attitude(): void {
  const complaints: string[] = [];
  const glass: ReturnType<typeof createDrinkware> = createDrinkware({
    kind: "glass",
  });
  const cigarette: ReturnType<typeof createSmoking> = createSmoking({
    kind: "cigarette",
  });
  for (const name of ["f-small", "m-average"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const stood: HumanObject.Placement = {
      at: {
        x: -body.measure.shoulderHalfWidth,
        y: body.measure.waistHeight,
        z: 0.6 * (body.measure.upperArm + body.measure.forearm),
      },
      yaw: 0,
    };
    const perform = (
      prop: IHumanProp,
      composition: HumanChain,
    ): HumanPerformance =>
      new HumanPerformance({
        seed: "held",
        laws: [HumanHabit.smoke],
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
    const instant = (segment: HumanSegment.ISegment, event: string): number =>
      segment.start +
      (segment.plan.events.find((e): boolean => e.name === event)?.share ??
        NaN) *
        segment.plan.duration;

    // What the right arm shows at a second, for a complaint: the forearm's
    // turn and the wrist's two angles in degrees, the wrist's distance from
    // the shoulder as a share of the arm, and how far a direction fixed in
    // the hand stays from upright after the best turn about the forearm's
    // own line (0 when a forearm turn alone would stand it up).
    const shown = (
      performance: HumanPerformance,
      seconds: number,
      fixed: IAutoMovieVector3,
    ): string => {
      const reader: HumanSignature.IReader = HumanSignature.of(
        performance,
        "a",
        body,
        0,
      );
      const shoulder: IAutoMovieVector3 = HumanSignature.joint(
        reader,
        seconds,
        "rightUpperArm",
      );
      const elbow: IAutoMovieVector3 = HumanSignature.joint(
        reader,
        seconds,
        "rightLowerArm",
      );
      const wrist: IAutoMovieVector3 = HumanSignature.joint(
        reader,
        seconds,
        "rightHand",
      );
      const forearm: IAutoMovieVector3 = Vector3.normalize(
        Vector3.subtract(wrist, elbow),
      );
      const degrees = (cosine: number): number =>
        (Math.acos(Math.max(-1, Math.min(1, cosine))) * 180) / Math.PI;
      const residual: number = Math.abs(
        degrees(Vector3.dot(fixed, forearm)) - degrees(forearm.y),
      );
      const angles = (bone: string): string => {
        const joint = performance
          .pose("a", seconds)
          .joints.find((j): boolean => j.bone === bone);
        return `[${(joint?.flexion ?? 0).toFixed(0)}, ${(joint?.abduction ?? 0).toFixed(0)}, ${(joint?.twist ?? 0).toFixed(0)}]`;
      };
      return `upper arm ${angles("rightUpperArm")}, forearm ${angles("rightLowerArm")}, wrist ${angles("rightHand")}, reach ${(Vector3.length(Vector3.subtract(wrist, shoulder)) / (body.measure.upperArm + body.measure.forearm)).toFixed(2)} of the arm, ${residual.toFixed(1)} degrees left after the best forearm turn`;
    };

    // 1. The glass upright at the mouth.
    try {
    const drunk: HumanPerformance = perform(
      HumanObject.prop("glass", glass, stood),
      HumanChain.subject("a")
        .pickUp({
          prop: "glass",
          handle: "body",
          use: { tip: "lip", line: "square", at: "mouth" },
        })
        .handToFace({ task: "drink", prop: "glass" }),
    );
    const drink: HumanSegment.ISegment = drunk.segments("a")[1]!;
    let tilt: number = 0;
    let worst: string = "";
    for (let i: number = 0; i <= 4; i++) {
      const seconds: number =
        instant(drink, "atMouth") +
        ((instant(drink, "relax") - instant(drink, "atMouth")) * i) / 4;
      const axis: IAutoMovieVector3 = Quaternion.rotateVector(
        drunk.prop("glass", seconds).rotation,
        { x: 0, y: 1, z: 0 },
      );
      const now: number = (Math.acos(Math.min(1, axis.y)) * 180) / Math.PI;
      if (now > tilt) {
        tilt = now;
        worst = shown(drunk, seconds, axis);
      }
    }
    if (!(tilt <= 10))
      complaints.push(
        `${name}: the held glass tilts ${tilt.toFixed(1)} degrees at the mouth, within 10 expected (${worst})`,
      );
    } catch (error) {
      complaints.push(
        `${name}: the drink from a held glass: expected to plan, got ${(error as Error).message}`,
      );
    }

    // 2. The cigarette's end at the lips.
    try {
    const smoked: HumanPerformance = perform(
      HumanObject.prop("cigarette", cigarette, stood),
      HumanChain.subject("a")
        .pickUp({
          prop: "cigarette",
          handle: "grip",
          use: { tip: "mouth", line: "forearm", at: "mouth" },
        })
        .registered("smoke", { prop: "cigarette" }),
    );
    const seconds: number = instant(smoked.segments("a")[1]!, "atLips");
    const frame: IHumanProp.IFrame = smoked.prop("cigarette", seconds);
    const off: number = Vector3.length(
      Vector3.subtract(
        Vector3.add(
          frame.position,
          Quaternion.rotateVector(
            frame.rotation,
            cigarette.affordance("mouth").frame.translation,
          ),
        ),
        HumanSignature.region(
          HumanSignature.of(smoked, "a", body, 0),
          "mouth",
          seconds,
        ),
      ),
    );
    if (!(off <= 0.015))
      complaints.push(
        `${name}: the held cigarette's end is ${(off * 1000).toFixed(1)} mm from the mouth at atLips, within 15 mm expected (${shown(smoked, seconds, { x: 0, y: 1, z: 0 })})`,
      );
    } catch (error) {
      complaints.push(
        `${name}: the draw on a held cigarette: expected to plan, got ${(error as Error).message}`,
      );
    }
  }
  TestValidator.equals("held objects keep their attitude", complaints, []);
}
