import { createDrinkware } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanMutual,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/**
 * A mug passed between unequal-height performers changes its rigid attachment
 * from the giver's hand to the receiver's hand at release.
 *
 * Scenarios:
 * 1. A giver picks up a mug by its handle and passes it upright to a facing receiver.
 * 2. Measure the attachment in the owning hand before and after release.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the displayed hand and mug at the boundaries of each carry. A mug stuck to the departing hand, or detached during a carry, loses its wrist-local position.
 * @evidence contracts/development/testing.md#independent-expectations Rigid attachment preserves the wrist-local offset to the 1 mm grip allowance. The upright mug must stay within the 10 degree container allowance at each observation.
 * @evidence contracts/development/testing.md#distinguishing-cases Checks the giver before the offer and the receiver after release. The two actors differ in stature and face opposite directions.
 * @evidence contracts/development/testing.md#execution-ownership Builds one portable two-person performance through the public handover composition and observes its event boundaries.
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the transfer instant, both attachment frames and their accuracy requirements.
 */
export function test_motion_prehension_two_hand_grasp(): void {
  const giver: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const receiver: IAutoMovieMotionHumanBody = motionHumanBody("f-small");
  const mug: ReturnType<typeof createDrinkware> = createDrinkware({
    kind: "mug",
  });
  const passed: IAutoMovieMotionHumanPerformance = new HumanPerformance({
    seed: "social",
    performers: [
      {
        subject: "a",
        body: giver,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
      {
        subject: "b",
        body: receiver,
        at: { x: 0, y: 0, z: 0.8 },
        yaw: 180,
        proficiency: { level: "trained" },
      },
    ],
    props: [
      HumanObject.prop("mug", mug, {
        at: {
          x: -giver.measure.shoulderHalfWidth,
          y: giver.measure.waistHeight,
          z: 0.6 * (giver.measure.upperArm + giver.measure.forearm),
        },
        yaw: 0,
      }),
    ],
    composition: HumanChain.mutual(
      HumanMutual.handOver,
      {
        giver: HumanChain.subject("a").pickUp({
          prop: "mug",
          handle: "handle",
          use: { tip: "lip", line: "square" },
        }),
        receiver: HumanChain.subject("b").stand({ hold: 0.3 }),
      },
      { prop: "mug", handle: "body" },
    ).node,
  });

  /** Convert an authored segment event to seconds on the shared timeline. */
  const instant = (
    segment: IAutoMovieMotionHumanSegment,
    event: string,
  ): number =>
    segment.start +
    segment.plan.events.find((entry) => entry.name === event)!.share *
      segment.plan.duration;
  const pickup: IAutoMovieMotionHumanSegment = passed.segments("a")[0]!;
  const give: IAutoMovieMotionHumanSegment = passed.segments("a")[1]!;
  const release: number = instant(give, "release");

  /** Observe the displayed mug centre in its current holder's wrist frame. */
  const local: (subject: string, seconds: number) => IAutoMovieVector3 = (
    subject: string,
    seconds: number,
  ): IAutoMovieVector3 => {
    const hand: IAutoMovieResolvedBone = passed
      .bones(subject, seconds)
      .get("rightHand")!;
    const prop: ReturnType<typeof passed.prop> = passed.prop("mug", seconds);
    const up: IAutoMovieVector3 = Quaternion.rotateVector(prop.rotation, {
      x: 0,
      y: 1,
      z: 0,
    });
    TestValidator.predicate(
      "the carried mug stays upright",
      up.y >= Math.cos(Math.PI / 18),
    );
    return Quaternion.rotateVector(
      Quaternion.inverse(hand.worldRotation),
      Vector3.subtract(prop.position, hand.worldPosition),
    );
  };
  for (const [subject, from, to] of [
    ["a", instant(pickup, "gripClosed"), instant(give, "offered")],
    ["b", release, passed.duration],
  ] as const) {
    TestValidator.predicate(
      "the attachment owns a nonempty interval",
      from < to,
    );
    const initial: IAutoMovieVector3 = local(subject, from + 0.001);
    for (const seconds of [(from + to) / 2, to]) {
      const drift: number = Vector3.length(
        Vector3.subtract(local(subject, seconds), initial),
      );
      TestValidator.predicate(
        `the mug stays seated in ${subject}'s hand at ${seconds} s`,
        drift <= 0.001,
      );
    }
  }
}
