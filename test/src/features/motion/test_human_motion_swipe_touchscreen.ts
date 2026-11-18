import { createDevice } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanHand,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  swipeTouchscreen,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A registered index-finger swipe traverses the glass, holds contact through
 * the stroke and lifts away when done.
 *
 * Scenarios:
 * 1. A diagonal glass axis yields a stroke across half the tablet's width on
 *    the glass over the measured single-finger swipe duration.
 * 2. Reversing the authored endpoints reverses the visible path.
 * 3. An endpoint outside the screen width is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the displayed pose, contact phases, bidirectional screen path and invalid endpoint case.
 * @evidence contracts/development/testing.md#behavioral-verification Checks displayed index bones through HumanHand, film events, the registered plan's unloaded contact window, and the public refusal.
 * @evidence contracts/development/testing.md#independent-expectations The fixture's displayed diagonal and endpoints follow elementary plane geometry. The 9 mm position tolerance and about 0.285 s of contact come from Jeong's touchscreen experiment, Sections 2.2.3 and 2.3.
 * @evidence contracts/development/testing.md#distinguishing-cases Both swipe directions on tilted glass detect projected, missing or reversed motion, and an outside endpoint detects clamping.
 * @evidence contracts/development/testing.md#execution-ownership A motion feature test runs the registered law on the public chain and performance APIs.
 */
export function test_human_motion_swipe_touchscreen(): void {
  const Chain: ReturnType<
    typeof HumanChain.extend<{ swipeTouchscreen: typeof swipeTouchscreen }>
  > = HumanChain.extend({ swipeTouchscreen });
  const body: IAutoMovieMotionHumanBody = motionHumanBody("f-average");
  const tilt: number = Math.PI / 6;
  const diagonal: IAutoMovieVector3 = {
    x: -Math.cos(tilt),
    y: -Math.sin(tilt),
    z: 0,
  };
  const rotation: IAutoMovieQuaternion = Quaternion.multiply(
    Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 30),
    Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 180),
  );
  const center: IAutoMovieVector3 = {
    x: -body.measure.shoulderHalfWidth,
    y: body.measure.shoulderHeight - 0.14,
    z: 0.48,
  };
  // The iPad model's front is half its thickness past the vertical midline.
  const centerOffset: IAutoMovieVector3 = {
    x: (-0.2486 * Math.sin(tilt)) / 2,
    y: (0.2486 * Math.cos(tilt)) / 2,
    z: -0.007 / 2,
  };
  const tablet: IAutoMovieMotionHumanProp = HumanObject.prop(
    "tablet",
    createDevice({ kind: "tablet", model: "wifi" }),
    { position: Vector3.subtract(center, centerOffset), rotation, fixed: true },
  );
  const perform = (from: number, to: number): HumanPerformance =>
    new HumanPerformance({
      seed: "kiosk swipe",
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      props: [tablet],
      laws: [swipeTouchscreen],
      composition: Chain.subject("a")
        .stand({ seconds: 0.6, sway: 0 })
        .swipeTouchscreen({
          prop: "tablet",
          screen: "screen",
          from,
          to,
        }).node,
    });

  for (const sign of [1, -1]) {
    const performance: HumanPerformance = perform(-sign / 4, sign / 4);
    const segment: IAutoMovieMotionHumanSegment = performance.segments("a")[1]!;
    const event = (name: string): number =>
      segment.plan.events.find(
        (e: IAutoMovieMotionEvent): boolean => e.name === name,
      )!.share;
    const start: number = event("strokeStart");
    const end: number = event("strokeEnd");
    const duration: number = segment.plan.duration;
    const tip = (share: number): IAutoMovieVector3 =>
      HumanHand.frame(
        body,
        performance.bones("a", segment.start + share * duration),
        "right",
        "indexTip",
        "point",
      ).point;
    const hands: IAutoMovieMotionHumanContactWindow[] =
      segment.plan.contacts.filter(
        (contact: IAutoMovieMotionHumanContactWindow): boolean =>
          contact.part.endsWith("Hand"),
      );
    const hand: IAutoMovieMotionHumanContactWindow | undefined = hands[0];
    TestValidator.predicate(
      "only the acting index fingertip contacts the tablet during the swipe",
      hands.length === 1 &&
        hand !== undefined &&
        hand.part === "rightHand" &&
        hand.region === "indexTipRight" &&
        hand.load === 0 &&
        hand.support.kind === "prop" &&
        hand.support.subject === "tablet" &&
        Math.abs(hand.from - start) < 1e-6 &&
        Math.abs(hand.to - end) < 1e-6,
    );
    TestValidator.predicate(
      "touch-in to touch-out takes about 285 ms",
      Math.abs((end - start) * duration - 0.285) < 0.005,
    );
    for (const [share, along] of [
      [start, -0.1795 / 4],
      [(start + end) / 2, 0],
      [end, 0.1795 / 4],
    ] as const) {
      const expected: IAutoMovieVector3 = Vector3.add(
        center,
        Vector3.scale(diagonal, sign * along),
      );
      TestValidator.predicate(
        "displayed index tip follows the diagonal glass through touch-in and touch-out",
        Vector3.length(Vector3.subtract(tip(share), expected)) < 0.009,
      );
    }
    TestValidator.predicate(
      "withdrawal clears the glass",
      tip((end + 1) / 2).z < center.z - 0.02,
    );
    TestValidator.predicate(
      "the fingertip returns to its entry point",
      Vector3.length(Vector3.subtract(tip(1), tip(0))) <= 0.01,
    );
  }

  let rejected: unknown;
  try {
    perform(-0.6, 0.25);
  } catch (error) {
    rejected = error;
  }
  TestValidator.predicate(
    "an endpoint outside the glass is refused",
    rejected instanceof HumanRefusal &&
      rejected.kind === "parameter" &&
      rejected.axis === "from",
  );
}
