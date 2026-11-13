import { createDrinkware, createSmoking } from "@automovie/archetypes";
import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanTouch,
  AutoMovieMotionHumanTouchDrink,
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
 * A held object keeps the attitude its use needs: a glass is carried
 * upright and tipped toward the lips only as much as the drinking arm asked,
 * and a held cigarette's end reaches the lips.
 *
 * Each object stands at waist height before the right shoulder, 0.6 of the
 * arm's length ahead, and is picked up and then used. A glass is taken for
 * its use (`pickUp`'s `use`: the lip at the mouth, the vessel upright), since
 * the grip a hand takes decides what the arm can do with the object later.
 * `test_human_motion_prop_held_use` holds the rim's place and the grip.
 *
 * Scenarios, on the small woman and the average man:
 * 1. A drink from a held glass. While the glass is carried to the mouth,
 *    until the last `AutoMovieMotionHumanTouch.TIP` of the carry's progress
 *    over which it tips, its axis stands within 10 degrees of upright. From
 *    `atMouth` to `relax` its top leans only toward the face (the performer
 *    faces +Z, so the axis's Z part is not positive) and no more than the
 *    lean the law asked plus one `AutoMovieMotionHumanTouchDrink.LEAN_STEP`.
 *    The asked lean is the glass's axis carried by the hand rotation the arm
 *    was asked for at `atMouth`. This replaces "within 10 degrees of upright
 *    through the hold": held upright at the lips, the glass asked the elbow
 *    up to the shoulder's height, and a drinker tips the glass at the lips
 *    with the elbow low (Murphy et al. 2011), the arm the hand-to-face law
 *    now admits by the least lean (`AutoMovieMotionHumanTouchDrink.held`).
 * 2. At `atLips` of `smoke` with a held cigarette, its mouth end lies
 *    within 15 mm of the mouth region.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Places real archetypes, builds performances through the public chain and reads the displayed prop frame and the mouth region; a glass tipped in the carry, tipped away from the face or past its asked lean at the mouth, or a cigarette short of the lips fails.
 * @evidence contracts/development/testing.md#independent-expectations The carry's bound is the acceptance line of #3361 and the mouth's is the lean the law asked, read off its asked hand rotation, plus one search step; the cigarette's bound is #3346's; the mouth end is the archetype's own affordance.
 * @evidence contracts/development/testing.md#distinguishing-cases A vessel whose attitude matters and a rod whose end matters, on two statures; the rim's place and the grip's drift are `test_human_motion_prop_held_use`'s.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and two archetypes and builds four short performances; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the scene, why the glass is taken for its use, the 2 scenarios with their bounds, and why the first changed.
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
      const lift: HumanSegment.ISegment = drunk.segments("a")[0]!;
      const drink: HumanSegment.ISegment = drunk.segments("a")[1]!;
      const atMouth: number = instant(drink, "atMouth");
      const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
      const axis = (seconds: number): IAutoMovieVector3 =>
        Quaternion.rotateVector(drunk.prop("glass", seconds).rotation, up);
      const from = (direction: IAutoMovieVector3): number =>
        (Math.acos(Math.min(1, Math.max(-1, direction.y))) * 180) / Math.PI;
      const step: number = AutoMovieMotionHumanTouchDrink.LEAN_STEP;

      // 1a. The carry, until the glass starts to tip.
      let carried: number = 0;
      let worst: string = "";
      const profile: string[] = [];
      for (let i: number = 0; i <= 16; i++) {
        if (minimumJerk(i / 16).s > 1 - AutoMovieMotionHumanTouch.TIP + 1e-9)
          break;
        const seconds: number =
          drink.start + ((atMouth - drink.start) * i) / 16;
        const now: number = from(axis(seconds));
        profile.push(`${seconds.toFixed(2)}: ${now.toFixed(1)}`);
        if (now > carried) {
          carried = now;
          worst = `at ${seconds.toFixed(2)} s of ${drink.start.toFixed(2)} to ${atMouth.toFixed(2)}, ${shown(drunk, seconds, axis(seconds))}`;
        }
      }
      // Through the pick-up, from the fingers' closing to the lift's end.
      // Each frame: the glass's tilt, and how far the hand bone and the
      // glass have each turned since the fingers closed.
      const picked: string[] = [];
      const reader: HumanSignature.IReader = HumanSignature.of(
        drunk,
        "a",
        body,
        0,
      );
      const turn = (a: IAutoMovieQuaternion, b: IAutoMovieQuaternion): number =>
        (2 *
          Math.acos(
            Math.min(
              1,
              Math.abs(a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w),
            ),
          ) *
          180) /
        Math.PI;
      const closing: number = instant(lift, "gripClosed") + 0.01;
      const gripped: IAutoMovieQuaternion = HumanSignature.bones(
        reader,
        closing,
      ).get("rightHand")!.worldRotation;
      const seated: IAutoMovieQuaternion = drunk.prop(
        "glass",
        closing,
      ).rotation;
      for (let i: number = 0; i <= 6; i++) {
        const seconds: number =
          closing + ((instant(lift, "lifted") - closing) * i) / 6;
        picked.push(
          `${seconds.toFixed(2)}: ${from(axis(seconds)).toFixed(1)} (hand ${turn(HumanSignature.bones(reader, seconds).get("rightHand")!.worldRotation, gripped).toFixed(1)}, glass ${turn(drunk.prop("glass", seconds).rotation, seated).toFixed(1)})`,
        );
      }
      if (!(carried <= 10))
        complaints.push(
          `${name}: the held glass tilts ${carried.toFixed(1)} degrees while it is carried to the mouth, within 10 expected (${worst}; ${from(axis(drink.start)).toFixed(1)} degrees as the drink starts, ${from(axis(instant(lift, "gripClosed") + 0.01)).toFixed(1)} as the fingers close, ${from(axis(instant(lift, "lifted") - 0.01)).toFixed(1)} as the glass is lifted (${shown(drunk, instant(lift, "lifted") - 0.01, axis(instant(lift, "lifted") - 0.01))}); through the pick-up ${picked.join(", ")}; through the carry ${profile.join(", ")})`,
        );

      // 1b. At the mouth: the lean the law asked, read as the glass's axis
      // carried by the asked hand rotation, and the shown one beside it.
      const hand: IAutoMovieQuaternion = HumanSignature.bones(
        HumanSignature.of(drunk, "a", body, 0),
        atMouth,
      ).get("rightHand")!.worldRotation;
      const asked: number = from(
        Quaternion.rotateVector(
          drunk.posture("a", atMouth).limbs.rightArm?.rotation ?? hand,
          Quaternion.rotateVector(Quaternion.inverse(hand), axis(atMouth)),
        ),
      );
      for (let i: number = 0; i <= 4; i++) {
        const seconds: number =
          atMouth + ((instant(drink, "relax") - atMouth) * i) / 4;
        const shownAxis: IAutoMovieVector3 = axis(seconds);
        const lean: number = from(shownAxis);
        if (!(shownAxis.z <= 0 && lean <= asked + step))
          complaints.push(
            `${name}: at ${seconds.toFixed(2)} s at the mouth the held glass leans ${lean.toFixed(1)} degrees with its top ${shownAxis.z <= 0 ? "toward" : "away from"} the face, toward it and at most the asked ${asked.toFixed(1)} plus ${step} expected (${shown(drunk, seconds, shownAxis)})`,
          );
      }
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
