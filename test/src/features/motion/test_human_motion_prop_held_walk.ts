import { createDrinkware } from "@automovie/archetypes";
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
  type HumanSegment,
  HumanSignature,
  type IHumanBody,
  type IHumanProp,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A person picks a glass up, walks on and sips from it while walking: the
 * sip rides the walk and takes the hold of the glass over (#3338, #3358).
 *
 * One body, the average man, since the claim is the takeover of a hold by an
 * overlay, not a stature; the glass stands at waist height before the right
 * shoulder, 0.6 of the arm ahead, and is picked up for its use at the mouth.
 *
 * Scenarios:
 * 1. `pickUp` then `walk` 2 m with `handToFace({ task: "sip", prop })` over
 *    the walk plans.
 * 2. At the sip's `atMouth` the glass's rim lies within 15 mm of the mouth
 *    region, read as the mouth's distance to the rim's circle (#3361), and
 *    the glass stands within 10 degrees of upright (#3361).
 * 3. From the grip's closing to the film's end the glass keeps its place in
 *    the hand's frame within 1 mm (#3358: held props stay within 1 mm of the
 *    grip socket through a walk), read every quarter of a second.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Places a real archetype, builds the performance through the public chain and reads the displayed prop frame, hand and mouth region; a sip refused over the walk, a glass away from the mouth, tipped, or sliding in the hand fails.
 * @evidence contracts/development/testing.md#independent-expectations The bounds are acceptance lines of #3358 and #3361; the rim is the archetype's own lip affordance.
 * @evidence contracts/development/testing.md#distinguishing-cases The held prop under an overlay; the same task standing is `test_human_motion_prop_held_use`'s and the overlay without a prop `test_human_motion_hand_overlay_wave`'s.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and one archetype and builds one performance; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, why one body is enough and the 3 scenarios with their bounds, sources and sampling.
 */
export function test_human_motion_prop_held_walk(): void {
  const body: IHumanBody = motionHumanBody("m-average");
  const glass: ReturnType<typeof createDrinkware> = createDrinkware({
    kind: "glass",
  });
  const complaints: string[] = [];

  // 1. The sip rides the walk with the glass the hand holds.
  let performance: HumanPerformance;
  try {
    performance = new HumanPerformance({
      seed: "held-walk",
      props: [
        HumanObject.prop("glass", glass, {
          at: {
            x: -body.measure.shoulderHalfWidth,
            y: body.measure.waistHeight,
            z: 0.6 * (body.measure.upperArm + body.measure.forearm),
          },
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
        .pickUp({
          prop: "glass",
          handle: "body",
          use: { tip: "lip", line: "square", at: "mouth" },
        })
        .walk({ to: { x: 0, y: 0, z: 2 } })
        .over(
          (u: HumanChain): HumanChain =>
            u.handToFace({ task: "sip", prop: "glass" }),
        ).node,
    });
  } catch (error) {
    TestValidator.equals(
      "a sip from a held glass over a walk plans",
      (error as Error).message,
      "",
    );
    return;
  }

  // 2. The rim at the mouth, the glass upright.
  const sip: HumanSegment.IOverlay = performance.overlays("a")[0]!;
  const seconds: number =
    sip.start +
    (sip.plan.events.find((e): boolean => e.name === "atMouth")?.share ??
      NaN) *
      sip.plan.duration;
  const lip: IAutoMovieVector3 = glass.affordance("lip").frame.translation;
  const frame: IHumanProp.IFrame = performance.prop("glass", seconds);
  const axis: IAutoMovieVector3 = Quaternion.rotateVector(frame.rotation, {
    x: 0,
    y: 1,
    z: 0,
  });
  const mouth: IAutoMovieVector3 = Vector3.subtract(
    HumanSignature.region(
      HumanSignature.of(performance, "a", body, 0),
      "mouth",
      seconds,
    ),
    Vector3.add(
      frame.position,
      Quaternion.rotateVector(frame.rotation, { x: 0, y: lip.y, z: 0 }),
    ),
  );
  const along: number = Vector3.dot(mouth, axis);
  const rim: number = Math.hypot(
    Vector3.length(Vector3.subtract(mouth, Vector3.scale(axis, along))) -
      Math.hypot(lip.x, lip.z),
    along,
  );
  if (!(rim <= 0.015))
    complaints.push(
      `the glass's rim is ${(rim * 1000).toFixed(1)} mm from the mouth at atMouth, within 15 mm expected`,
    );
  const tilt: number = (Math.acos(Math.min(1, axis.y)) * 180) / Math.PI;
  if (!(tilt <= 10))
    complaints.push(
      `the glass tilts ${tilt.toFixed(1)} degrees at atMouth, within 10 expected`,
    );

  // 3. The glass stays in the hand.
  const pick: HumanSegment.ISegment = performance.segments("a")[0]!;
  const from: number =
    pick.start +
    (pick.plan.events.find((e): boolean => e.name === "gripClosed")?.share ??
      NaN) *
      pick.plan.duration +
    1e-3;
  const seat = (at: number): IAutoMovieVector3 => {
    const hand: IAutoMovieResolvedBone = performance
      .bones("a", at)
      .get("rightHand")!;
    return Quaternion.rotateVector(
      Quaternion.inverse(hand.worldRotation),
      Vector3.subtract(
        performance.prop("glass", at).position,
        hand.worldPosition,
      ),
    );
  };
  const first: IAutoMovieVector3 = seat(from);
  let drift: number = 0;
  for (let at: number = from; at <= performance.duration; at += 0.25)
    drift = Math.max(
      drift,
      Vector3.length(Vector3.subtract(seat(at), first)),
    );
  if (!(drift <= 0.001))
    complaints.push(
      `the glass moves ${(drift * 1000).toFixed(1)} mm in the hand's frame through the walk, within 1 mm expected`,
    );
  TestValidator.equals("a held glass sipped over a walk", complaints, []);
}
