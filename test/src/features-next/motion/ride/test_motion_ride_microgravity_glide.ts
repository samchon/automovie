import { createSpacecraft } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanSpacecraftGlide,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanRide,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { HumanHand, poseBones } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { nclose } from "../../../features/internal/nclose";
import { vclose } from "../../../features/internal/vclose";

/**
 * An unsuited performer, already next to the aft rail, pushes off and
 * catches the forward rail along a 2.4 m cabin route. NASA-STD-3001 Volume 2
 * section 8.5 describes handholds for changing speed in microgravity.
 *
 * Scenarios:
 *
 * 1. The hand socket stays within 10 mm of each rail for its contact
 *    phase at its endpoints and midpoint. Halfway through the coast the
 *    hand passes 80 mm inboard of the rail line.
 * 2. The displayed root coasts at 0.8 m/s on a straight, level line,
 *    starts and ends at rest, and covers the 2.4 m between the rails.
 * 3. A door-mounted handle, zero coast and invalid clearances are refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the scene, source and bounded push, coast and catch observations.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the opt-in law in HumanPerformance using the spacecraft archetype and measures the displayed root and grip socket.
 * @evidence contracts/development/testing.md#independent-expectations The authored rails, constant-speed free flight and trapezoidal velocity area give explicit metre and second expectations. Grip positions are observed on the actual resolved bones and compared against known scenic coordinates.
 * @evidence contracts/development/testing.md#distinguishing-cases Checks both grip-window boundaries and interior, the coast quarter and midpoint and both 20 ms rest bounds. Refuses the mounted handle, the zero coast and clearances outside the measured reach.
 * @evidence contracts/development/testing.md#execution-ownership One discovered in-memory test creates the model and registers the law through public performance APIs.
 */
export function test_motion_ride_microgravity_glide(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const cabin: ReturnType<typeof createSpacecraft> = createSpacecraft({
    length: 8,
    width: 4,
    cabinHeight: 2.75,
  });
  /** Stage the performer with the right hand beside the starboard rails. */
  const stage = (
    departure: string = "aftHandrail",
    coast: number = 2.6,
    handClearance: number = 0.08,
  ): IAutoMovieMotionHumanPerformance =>
    new HumanPerformance({
      seed: "spacecraft-glide",
      laws: [AutoMovieMotionHumanRide.spacecraftGlide],
      performers: [
        {
          subject: "crew",
          body,
          at: { x: -1.34, y: 0.25, z: -2.88 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      props: [
        HumanObject.prop("cabin", cabin, {
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          fixed: true,
        }),
      ],
      composition: HumanChain.subject("crew").registered(
        "spacecraftGlide",
        {
          spacecraft: "cabin",
          departure,
          arrival: "forwardHandrail",
          hand: "right",
          ramp: 0.4,
          coast,
          handClearance,
        } satisfies IAutoMovieMotionHumanSpacecraftGlide,
        "translation",
      ).node,
    });
  const performance: IAutoMovieMotionHumanPerformance = stage();
  const segment: IAutoMovieMotionHumanSegment =
    performance.segments("crew")[0]!;
  const departure: IAutoMovieVector3 = { x: -1.82, y: 1.63, z: -2.8 };
  const arrival: IAutoMovieVector3 = { x: -1.82, y: 1.63, z: -0.4 };
  const offset: IAutoMovieVector3 = HumanHand.offset(
    body,
    "right",
    "grip",
  ).point;
  /** Read the anatomical grip socket on the displayed hand. */
  const grip = (pose: IAutoMoviePose): IAutoMovieVector3 => {
    const hand: IAutoMovieResolvedBone = poseBones(body, pose).get(
      "rightHand",
    )!;
    return Vector3.add(
      hand.worldPosition,
      Quaternion.rotateVector(hand.worldRotation, offset),
    );
  };
  /** Read the displayed rig origin at a film second. */
  const root = (seconds: number): IAutoMovieVector3 =>
    performance.pose("crew", seconds).root!.translation;

  // 1. The gap is unassisted, with a fixed hand socket on either side.
  const windows: readonly IAutoMovieMotionHumanContactWindow[] =
    segment.plan.contacts;
  TestValidator.predicate(
    "the only support windows are the two hand grips",
    windows.length === 2 &&
      windows.every(
        (window: IAutoMovieMotionHumanContactWindow): boolean =>
          window.part === "rightHand" &&
          window.kind === "grip" &&
          window.support.kind === "prop" &&
          window.support.subject === "cabin",
      ),
  );
  TestValidator.predicate(
    "the grip windows cover only the push and brake ramps",
    nclose(windows[0]!.from, 0) &&
      nclose(windows[0]!.to * segment.plan.duration, 0.4) &&
      nclose(windows[1]!.from * segment.plan.duration, 3) &&
      nclose(windows[1]!.to, 1),
  );
  for (const [event, seconds] of [
    ["release", 0.4],
    ["catch", 3],
    ["stop", 3.4],
  ] as const) {
    const key: IAutoMovieMotionEvent = segment.plan.events.find(
      (candidate: IAutoMovieMotionEvent): boolean => candidate.name === event,
    )!;
    TestValidator.predicate(
      `${event} occurs at ${seconds} s`,
      nclose(key.share * segment.plan.duration, seconds),
    );
  }

  // The ramps move the shoulder along the rail, so each grip must track
  // a changing arm extension at both ends and retain its plant in between.
  const start: IAutoMoviePose = performance.pose("crew", 0);
  const release: IAutoMoviePose = performance.pose("crew", 0.4);
  const middle: IAutoMoviePose = performance.pose("crew", 1.7);
  const catchPose: IAutoMoviePose = performance.pose("crew", 3);
  const stop: IAutoMoviePose = performance.pose("crew", 3.4);
  for (const [phase, pose, target] of [
    ["departure start", start, departure],
    ["push midpoint", performance.pose("crew", 0.2), departure],
    ["release", release, departure],
    ["catch", catchPose, arrival],
    ["brake midpoint", performance.pose("crew", 3.2), arrival],
    ["stop", stop, arrival],
  ] as const)
    TestValidator.predicate(
      `${phase} grip is within 10 mm of its rail`,
      Vector3.length(Vector3.subtract(grip(pose), target)) <= 0.01,
    );
  TestValidator.predicate(
    "the displayed grip passes 80 mm inboard at mid-coast within 10 mm",
    nclose(grip(middle).x, -1.74, 0.01),
  );

  // A trapezoid with a 2.6 s plateau and two 0.4 s ramps covers
  // 2.4 m at 0.8 m/s. Each ramp covers 0.16 m.
  const origin: IAutoMovieVector3 = start.root!.translation;
  const end: IAutoMovieVector3 = stop.root!.translation;
  for (const [phase, pose, travel] of [
    ["release", release, 0.16],
    ["coast quarter", performance.pose("crew", 1.05), 0.68],
    ["coast midpoint", middle, 1.2],
    ["coast three quarters", performance.pose("crew", 2.35), 1.72],
    ["catch", catchPose, 2.24],
    ["stop", stop, 2.4],
  ] as const)
    TestValidator.predicate(
      `${phase} has the expected forward travel at constant cabin height`,
      vclose(
        Vector3.subtract(pose.root!.translation, origin),
        { x: 0, y: 0, z: travel },
        0.001,
      ),
    );
  TestValidator.predicate(
    "both ends move less than 1 mm in the first or last 20 ms",
    Vector3.length(Vector3.subtract(root(0.02), origin)) < 0.001 &&
      Vector3.length(Vector3.subtract(end, root(3.38))) < 0.001,
  );

  // 3. No two legal wrist positions relative to the same shoulder can
  // differ by more than twice the measured extended arm length.
  const extendedArm: number = body.measure.upperArm + body.measure.forearm;
  for (const [id, coast, clearance, axis] of [
    ["boardingHandle", 2.6, 0.08, "departure"],
    ["aftHandrail", 0, 0.08, "clock"],
    ["aftHandrail", 2.6, Number.POSITIVE_INFINITY, "handClearance"],
    ["aftHandrail", 2.6, 0, "handClearance"],
    ["aftHandrail", 2.6, 3 * extendedArm, "handClearance"],
  ] as const) {
    let refusal: unknown;
    try {
      stage(id, coast, clearance);
    } catch (error) {
      refusal = error;
    }
    TestValidator.predicate(
      `${axis} refusal is reported`,
      refusal instanceof HumanRefusal && refusal.axis === axis,
    );
  }
}
