import { createDrinkware, createSmoking } from "@automovie/archetypes";
import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanObject,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanSignature,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanStance,
  AutoMovieMotionHumanTouch,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanSignature,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "./motionHumanBody";
import { motionPropHeldDrift } from "./motionPropHeldDrift";

const { AutoMovieMotionHumanTouchDrink } = AutoMovieMotionHumanTouch;

/**
 * How far a glass may lean away from the face and still count as upright: the
 * sine of 1 degree.
 */
const AWAY: number = Math.sin(Math.PI / 180);

/**
 * The held objects' attitude and place on one body, which the
 * `test_human_motion_prop_held_attitude_*` specs read one body each: a glass is
 * carried upright, tipped toward the lips only as much as the drinking arm
 * asked, its rim at the mouth and its grip kept (#3358, #3361), and a held
 * cigarette's end reaches the lips (#3346).
 *
 * Each object stands at waist height before the right shoulder, 0.6 of the
 * arm's length ahead, and is picked up and then used. A glass is taken for its
 * use (`pickUp`'s `use`: the lip at the mouth, the vessel upright), since the
 * grip a hand takes decides what the arm can do with the object later. The
 * drink is one film, followed by a 0.5 s stand, read by every glass scenario:
 * its attitude, its rim and its grip were read off two films of the same
 * pick-up and drink, one here and one in the
 * `test_human_motion_prop_held_use_*` reader, and the stand that ends the film
 * follows the drink's `relax`, the last instant the attitude is read.
 *
 * Scenarios, on the body:
 *
 * 1. A drink from a held glass. While the glass is carried to the mouth, until the
 *    last `AutoMovieMotionHumanTouch.TIP` of the carry's progress over which it
 *    tips, its axis stands within 10 degrees of upright. From `atMouth` to
 *    `relax` its top leans only toward the face (the performer faces +Z, so the
 *    axis's Z part is not positive; a glass within 1 degree of upright leans
 *    nowhere, so its Z part may be the sine of 1 degree) and no more than the
 *    lean the law asked plus one `AutoMovieMotionHumanTouchDrink.LEAN_STEP`.
 *    The asked lean is the glass's axis carried by the hand rotation the arm
 *    was asked for at `atMouth`. This replaces "within 10 degrees of upright
 *    through the hold": held upright at the lips, the glass asked the elbow up
 *    to the shoulder's height, and a drinker tips the glass at the lips with
 *    the elbow low (Murphy et al. 2011), the arm the hand-to-face law now
 *    admits by the least lean (`AutoMovieMotionHumanTouchDrink.held`).
 * 2. Through the hold at the mouth, at `atMouth`, halfway to `relax` and at
 *    `relax`, the glass's rim passes within 15 mm of the mouth region (#3361's
 *    acceptance for the rim), read as the mouth's distance to the rim's
 *    circle.
 * 3. From the grip's closing to the end of the stand the glass stays where it was
 *    in the hand's own frame within 1 mm (the campaign's bound for a grip,
 *    `motionPropHeldDrift`).
 * 4. At `atLips` of `smoke` with a held cigarette, its mouth end lies within 15 mm
 *    of the mouth region.
 *
 * @param name The body.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the scene, why the glass is taken for its use, why one drink film serves every glass scenario and the 4 scenarios with their bounds, and why the first changed.
 * @evidence contracts/development/implementation.md#principled-implementation Places real archetypes, builds performances through the public chain and reads the displayed prop frame, the hand and the mouth region.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Two performances and their readings, gathered as complaints and asserted once.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A performance that does not plan is a complaint with the refusal's words; the bounds are the specs' own, unchanged by the split or by the shared film.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two short performances, sampled at up to 17 and 5 instants, the rim read at three of the hold's five and the grip every half second; the arm's description and the 7 pick-up instants of a complaint are resolved only when the carry's bound fails.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Read by each body's spec, so the readings exist once; one drink film feeds the attitude, the rim and the grip, and the grip's reading is `motionPropHeldDrift`.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing past the call.
 */
export function motionPropHeldAttitude(name: motionHumanBody.Name): void {
  const complaints: string[] = [];
  const glass: ReturnType<typeof createDrinkware> = createDrinkware({
    kind: "glass",
  });
  const cigarette: ReturnType<typeof createSmoking> = createSmoking({
    kind: "cigarette",
  });
  const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
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
      laws: [AutoMovieMotionHumanStance.HumanHabit.smoke],
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
  const instant = (
    segment: IAutoMovieMotionHumanSegment,
    event: string,
  ): number =>
    segment.start +
    (segment.plan.events.find((e): boolean => e.name === event)?.share ?? NaN) *
      segment.plan.duration;

  // What the right arm shows at a second, for a complaint: the forearm's
  // turn and the wrist's two angles in degrees, the wrist's distance from
  // the shoulder as a share of the arm, and how far a direction fixed in
  // the hand stays from upright after the best turn about the forearm's
  // own line (0 when a forearm turn alone would stand it up).
  const shown = (
    performance: IAutoMovieMotionHumanPerformance,
    seconds: number,
    fixed: IAutoMovieVector3,
  ): string => {
    const bones: ReturnType<IAutoMovieMotionHumanPerformance["bones"]> =
      performance.bones("a", seconds);
    const shoulder: IAutoMovieVector3 =
      bones.get("rightUpperArm")!.worldPosition;
    const elbow: IAutoMovieVector3 = bones.get("rightLowerArm")!.worldPosition;
    const wrist: IAutoMovieVector3 = bones.get("rightHand")!.worldPosition;
    const forearm: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(wrist, elbow),
    );
    const degrees = (cosine: number): number =>
      (Math.acos(Math.max(-1, Math.min(1, cosine))) * 180) / Math.PI;
    const residual: number = Math.abs(
      degrees(Vector3.dot(fixed, forearm)) - degrees(forearm.y),
    );
    const pose = performance.pose("a", seconds);
    const angles = (bone: string): string => {
      const joint = pose.joints.find((j): boolean => j.bone === bone);
      return `[${(joint?.flexion ?? 0).toFixed(0)}, ${(joint?.abduction ?? 0).toFixed(0)}, ${(joint?.twist ?? 0).toFixed(0)}]`;
    };
    return `upper arm ${angles("rightUpperArm")}, forearm ${angles("rightLowerArm")}, wrist ${angles("rightHand")}, reach ${(Vector3.length(Vector3.subtract(wrist, shoulder)) / (body.measure.upperArm + body.measure.forearm)).toFixed(2)} of the arm, ${residual.toFixed(1)} degrees left after the best forearm turn`;
  };

  // 1 to 3. The drink from the held glass, one film for every reading.
  try {
    const drunk: IAutoMovieMotionHumanPerformance = perform(
      HumanObject.prop("glass", glass, stood),
      HumanChain.subject("a")
        .pickUp({
          prop: "glass",
          handle: "body",
          use: { tip: "lip", line: "square", at: "mouth" },
        })
        .handToFace({ kind: "drink", prop: "glass" })
        .stand({ hold: 0.5 }),
    );
    const lift: IAutoMovieMotionHumanSegment = drunk.segments("a")[0]!;
    const drink: IAutoMovieMotionHumanSegment = drunk.segments("a")[1]!;
    const atMouth: number = instant(drink, "atMouth");
    const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    const axis = (seconds: number): IAutoMovieVector3 =>
      Quaternion.rotateVector(drunk.prop("glass", seconds).rotation, up);
    const from = (direction: IAutoMovieVector3): number =>
      (Math.acos(Math.min(1, Math.max(-1, direction.y))) * 180) / Math.PI;
    const step: number = AutoMovieMotionHumanTouchDrink.LEAN_STEP;

    // 1a. The carry, until the glass starts to tip.
    let carried: number = 0;
    let tilted: number = drink.start;
    const profile: string[] = [];
    for (let i: number = 0; i <= 16; i++) {
      if (minimumJerk(i / 16).s > 1 - AutoMovieMotionHumanTouch.TIP + 1e-9)
        break;
      const seconds: number = drink.start + ((atMouth - drink.start) * i) / 16;
      const now: number = from(axis(seconds));
      profile.push(`${seconds.toFixed(2)}: ${now.toFixed(1)}`);
      if (now > carried) {
        carried = now;
        tilted = seconds;
      }
    }
    if (!(carried <= 10)) {
      // The arm at the worst instant and through the pick-up, from the
      // fingers' closing to the lift's end, are resolved only to describe
      // a failure. Each pick-up frame: the glass's tilt, and how far the
      // hand bone and the glass have each turned since the fingers closed.
      const worst: string = `at ${tilted.toFixed(2)} s of ${drink.start.toFixed(2)} to ${atMouth.toFixed(2)}, ${shown(drunk, tilted, axis(tilted))}`;
      const picked: string[] = [];
      const reader: IAutoMovieMotionHumanSignature.IReader = HumanSignature(
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
      complaints.push(
        `${name}: the held glass tilts ${carried.toFixed(1)} degrees while it is carried to the mouth, within 10 expected (${worst}; ${from(axis(drink.start)).toFixed(1)} degrees as the drink starts, ${from(axis(instant(lift, "gripClosed") + 0.01)).toFixed(1)} as the fingers close, ${from(axis(instant(lift, "lifted") - 0.01)).toFixed(1)} as the glass is lifted (${shown(drunk, instant(lift, "lifted") - 0.01, axis(instant(lift, "lifted") - 0.01))}); through the pick-up ${picked.join(", ")}; through the carry ${profile.join(", ")})`,
      );
    }

    // 1b. At the mouth: the lean the law asked, read as the glass's axis
    // carried by the asked hand rotation, and the shown one beside it; and
    // 2, at the hold's ends and its middle, the rim's distance from the
    // mouth.
    const reader: IAutoMovieMotionHumanSignature.IReader = HumanSignature(
      drunk,
      "a",
      body,
      0,
    );
    const hand: IAutoMovieQuaternion = HumanSignature.bones(
      reader,
      atMouth,
    ).get("rightHand")!.worldRotation;
    const lip: IAutoMovieVector3 = glass.affordance("lip").frame.translation;
    const lipRadius: number = Math.hypot(lip.x, lip.z);
    const atLipsFrame: IAutoMovieRigidTransform = drunk.prop("glass", atMouth);
    const atLipsAxis: IAutoMovieVector3 = Quaternion.rotateVector(
      atLipsFrame.rotation,
      up,
    );
    const finishHold: number = instant(drink, "relax");
    let rim: number = 0;
    const asked: number = from(
      Quaternion.rotateVector(
        drunk.posture("a", atMouth).limbs.rightArm?.rotation ?? hand,
        Quaternion.rotateVector(Quaternion.inverse(hand), atLipsAxis),
      ),
    );
    for (let i: number = 0; i <= 4; i++) {
      const seconds: number = atMouth + ((finishHold - atMouth) * i) / 4;
      const frame: IAutoMovieRigidTransform =
        i === 0 ? atLipsFrame : drunk.prop("glass", seconds);
      const shownAxis: IAutoMovieVector3 =
        i === 0 ? atLipsAxis : Quaternion.rotateVector(frame.rotation, up);
      const lean: number = from(shownAxis);
      if (!(shownAxis.z <= AWAY && lean <= asked + step))
        complaints.push(
          `${name}: at ${seconds.toFixed(2)} s at the mouth the held glass leans ${lean.toFixed(1)} degrees with its top ${shownAxis.z <= 0 ? "toward" : "away from"} the face (${((Math.asin(Math.min(1, Math.abs(shownAxis.z))) * 180) / Math.PI).toFixed(1)} degrees of it), toward it or upright within 1 degree and at most the asked ${asked.toFixed(1)} plus ${step} expected (${shown(drunk, seconds, shownAxis)})`,
        );

      // The rim at the hold's ends and its middle: the mouth's distance to
      // the rim's circle about the glass's axis.
      if (i % 2 === 0) {
        const mouth: IAutoMovieVector3 = Vector3.subtract(
          HumanSignature.region(reader, "mouth", seconds),
          Vector3.add(
            frame.position,
            Quaternion.rotateVector(frame.rotation, { x: 0, y: lip.y, z: 0 }),
          ),
        );
        const along: number = Vector3.dot(mouth, shownAxis);
        const across: number = Vector3.length(
          Vector3.subtract(mouth, Vector3.scale(shownAxis, along)),
        );
        rim = Math.max(rim, Math.hypot(across - lipRadius, along));
      }
    }
    if (!(rim <= 0.015))
      complaints.push(
        `${name}: the held glass's rim is ${(rim * 1000).toFixed(1)} mm from the mouth at its farthest in the hold, within 15 mm expected`,
      );

    // 3. The glass in the hand's frame, from the grip's closing to the end.
    const moved: number = motionPropHeldDrift(drunk, "glass");
    if (!(moved <= 0.001))
      complaints.push(
        `${name}: the held glass moves ${(moved * 1000).toFixed(1)} mm in the hand's frame, within 1 mm expected`,
      );
  } catch (error) {
    complaints.push(
      `${name}: the drink from a held glass: expected to plan, got ${(error as Error).message}`,
    );
  }

  // 4. The cigarette's end at the lips.
  try {
    const smoked: IAutoMovieMotionHumanPerformance = perform(
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
    const frame: IAutoMovieRigidTransform = smoked.prop("cigarette", seconds);
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
          HumanSignature(smoked, "a", body, 0),
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
  TestValidator.equals(
    `held objects keep their attitude (${name})`,
    complaints,
    [],
  );
}
