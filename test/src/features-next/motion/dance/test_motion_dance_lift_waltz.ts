import { createBarbell } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
  IAutoMovieScheduleCue,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanWorkout,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import { HumanSport } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/**
 * Stage one loaded clean and squat jerk and one pair of turning waltz boxes.
 *
 * Scenarios:
 * 1. An already picked-up bar reaches rack, dip, drive, low catch and
 *    recovered overhead in order, with the actual grips near both wrists.
 * 2. Two dancers land their feet on six irregular shared cues, starting
 *    in opposite directions in their own frames and turning on flat ground.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the authoring inputs and the independent stage measurements.
 * @evidence contracts/development/testing.md#behavioral-verification Composes a loaded lift with the actual rigid bar and resolves both dancers' feet and pelvis in the scene.
 * @evidence contracts/development/testing.md#independent-expectations Reads both grip locations from the bar model and compares the actual footfalls to the input score, not to another clock output.
 * @evidence contracts/development/testing.md#distinguishing-cases The rack and catch are separate outcomes; the dancers have different body proportions, opposite entries and unequal intervals between cues.
 * @evidence contracts/development/testing.md#execution-ownership Uses small in-memory Human performances with no renderer.
 */
export function test_motion_dance_lift_waltz(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const bar = createBarbell({ kind: "mens", grip: 0.5, load: 0 });
  const right: IAutoMovieVector3 =
    bar.affordance("gripRight").frame.translation;
  const stature: number = body.measure.stature;
  const proficiency = { level: "trained" as const };
  const lift: HumanPerformance = new HumanPerformance({
    seed: "exercise-lift",
    laws: [AutoMovieMotionHumanWorkout.workout],
    performers: [{ subject: "a", body, at: origin, yaw: 0, proficiency }],
    props: [
      HumanObject.prop("bar", bar, {
        position: Vector3.subtract(
          { x: -0.12 * stature, y: 0.56 * stature, z: 0.12 * stature },
          right,
        ),
        rotation: Quaternion.identity(),
      }),
    ],
    composition: HumanChain.subject("a")
      .stand({ hold: 0.3, sway: 0 })
      .pickUp({ prop: "bar", handle: "gripRight" })
      .registered("workout", {
        kind: "cleanAndJerk",
        count: 1,
        load: { prop: "bar", handle: "gripRight", other: "gripLeft" },
      }).node,
  });
  const action: IAutoMovieMotionHumanSegment = lift.segments("a").at(-1)!;
  const rack: number = at(action, "rack1");
  const dip: number = at(action, "jerkDip1");
  const drive: number = at(action, "jerkDrive1");
  const catchBar: number = at(action, "jerkCatch1");
  const overhead: number = at(action, "jerkOverhead1");
  TestValidator.predicate(
    "a distinct dip, drive and squat catch follow recovery to the rack",
    rack < dip && dip < drive && drive < catchBar && catchBar < overhead,
  );
  TestValidator.predicate(
    "the catch is low and the bar recovers above the rack",
    lift.bones("a", overhead).get("hips")!.worldPosition.y -
      lift.bones("a", catchBar).get("hips")!.worldPosition.y >
      0.08 &&
      lift.prop("bar", overhead).position.y -
        lift.prop("bar", rack).position.y >
        0.12 * stature,
  );
  for (const time of [rack, catchBar, overhead]) {
    const shown = lift.prop("bar", time);
    for (const [bone, id] of [
      ["rightHand", "gripRight"],
      ["leftHand", "gripLeft"],
    ] as const) {
      const marker: IAutoMovieVector3 = Vector3.add(
        shown.position,
        Quaternion.rotateVector(
          shown.rotation,
          bar.affordance(id).frame.translation,
        ),
      );
      TestValidator.predicate(
        "the same bar's " +
          id +
          " follows the corresponding wrist at " +
          time.toFixed(3) +
          " s",
        Vector3.distance(
          marker,
          lift.bones("a", time).get(bone)!.worldPosition,
        ) <= 0.12,
      );
    }
  }

  const beats: readonly number[] = [0.9, 1.42, 1.9, 2.34, 2.94, 3.42];
  const score: readonly IAutoMovieScheduleCue[] = beats.map(
    (seconds: number): IAutoMovieScheduleCue => ({ name: "beat", seconds }),
  );
  const turn: number = 20;
  const dance: HumanPerformance = new HumanPerformance({
    seed: "exercise-waltz",
    laws: [HumanSport.boxStep],
    performers: [
      {
        subject: "lead",
        body,
        at: { x: 0, y: 0, z: -0.55 },
        yaw: 0,
        proficiency,
      },
      {
        subject: "follow",
        body: motionHumanBody("f-small"),
        at: { x: 0, y: 0, z: 0.55 },
        yaw: 180,
        proficiency,
      },
    ],
    cues: { score },
    composition: HumanChain.subject("lead")
      .stand({ hold: 0.3, sway: 0 })
      .registered("boxStep", {
        lock: { of: "score" },
        count: beats.length,
        side: "left",
        waltz: { turn, pivot: origin },
      })
      .with(
        HumanChain.subject("follow")
          .stand({ hold: 0.3, sway: 0 })
          .registered("boxStep", {
            lock: { of: "score" },
            count: beats.length,
            side: "right",
            waltz: { turn, pivot: origin, reverse: true },
          }),
      ).node,
  });
  for (const [subject, first, second] of [
    ["lead", "leftFoot", "rightFoot"],
    ["follow", "rightFoot", "leftFoot"],
  ] as const) {
    const step: IAutoMovieMotionHumanSegment = dance.segments(subject)[1]!;
    for (const [index, seconds] of beats.entries()) {
      const foot = index % 2 === 0 ? first : second;
      const touchdown: IAutoMovieVector3 = dance
        .bones(subject, seconds)
        .get(foot)!.worldPosition;
      const held: IAutoMovieVector3 = dance
        .bones(subject, seconds + 0.07)
        .get(foot)!.worldPosition;
      TestValidator.predicate(
        subject +
          " lands and holds its " +
          foot +
          " on shared beat " +
          (index + 1),
        Math.abs(at(step, "beat" + (index + 1)) - seconds) <= 1e-6 &&
          Vector3.distance(touchdown, held) <= 0.01,
      );
    }
    const start: IAutoMovieVector3 = dance
      .bones(subject, step.start)
      .get(first)!.worldPosition;
    const firstBeat: IAutoMovieVector3 = dance
      .bones(subject, beats[0]!)
      .get(first)!.worldPosition;
    TestValidator.predicate(
      subject + " starts in the composed world direction",
      firstBeat.z - start.z > 0.06,
    );
    const facing = (seconds: number): IAutoMovieVector3 =>
      Quaternion.rotateVector(
        dance.bones(subject, seconds).get("hips")!.worldRotation,
        { x: 0, y: 0, z: 1 },
      );
    const before: IAutoMovieVector3 = facing(step.start);
    const after: IAutoMovieVector3 = facing(beats.at(-1)! + 0.1);
    const turned: number =
      (Math.atan2(
        before.z * after.x - before.x * after.z,
        before.x * after.x + before.z * after.z,
      ) *
        180) /
      Math.PI;
    TestValidator.predicate(
      subject + " shows its authored turn",
      Math.abs(turned - turn) <= 1,
    );
  }
}

/** The absolute film second of a required landmark. */
function at(segment: IAutoMovieMotionHumanSegment, landmark: string): number {
  const event = segment.plan.events.find(
    (candidate): boolean => candidate.name === landmark,
  );
  if (event === undefined)
    throw new Error(segment.name + " has no " + landmark + " event");
  return segment.start + event.share * segment.plan.duration;
}
