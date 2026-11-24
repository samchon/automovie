import { createHighJump, createPlyoBox } from "@automovie/archetypes";
import { AutoMovieGravity } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanGymnasticsWheel,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAcrobatics,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  HumanSignature,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../internal/motionHumanBody";

/**
 * Jump clearance follows the mass centre. On landing, changing shape must keep
 * the lowest collider on the mat.
 *
 * Scenarios:
 *
 * 1. A high jump clears its authored bar with ballistic vertical acceleration; an
 *    unreachable bar is refused.
 * 2. Sampling a materialized mat posture out of order returns independent grounded
 *    records.
 * 3. Touching and singleton support runs preserve an exact change of supporting
 *    body part.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the actual mass centre, prepared floor and generated contact shares.
 * @evidence contracts/development/testing.md#independent-expectations The requested bar elevation, gravity and authored mat fix the answers.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers in-flight, settling and changing contacts.
 * @evidence contracts/development/testing.md#execution-ownership Uses one body and two public action admissions.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the three support phases.
 */
export function test_motion_acrobatics_gymnastics_support(): void {
  const body = motionHumanBody("m-average"),
    origin = { x: 0, y: 0, z: 0 },
    top = 0.762;
  const jump = (height: number) => {
    const obstacle = createHighJump({
      height: Math.min(height + 0.015, 2.45),
      diameter: 0.03,
    });
    return new HumanPerformance({
      seed: "bar",
      laws: [AutoMovieMotionHumanAcrobatics.HumanGymnastics.fosburyFlop],
      props: [
        HumanObject.prop("mat", createPlyoBox({ height: top }), {
          at: { ...origin, z: 2.5 },
          yaw: 0,
        }),
        HumanObject.prop("bar", obstacle, {
          at: {
            x: 0,
            y: height - obstacle.affordance("bar").frame.translation.y,
            z: 1.25,
          },
          yaw: 0,
        }),
      ],
      performers: [
        {
          subject: "jumper",
          body,
          at: origin,
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("jumper")
        .stand({ hold: 0.3 })
        .registered("fosburyFlop", {
          to: { x: 0, y: top, z: 2.5 },
          on: "mat",
          bar: "bar",
        }).node,
    });
  };
  const height = 1.4,
    film = jump(height),
    segment = film.segments("jumper")[1]!;
  const instant = (name: string) =>
    segment.start +
    segment.plan.duration *
      segment.plan.events.find((e) => e.name === name)!.share;
  const reader = HumanSignature(film, "jumper", body, 0);
  const apex = instant("apex"),
    takeoff = instant("takeoff"),
    h = (apex - takeoff) / 4;
  const y = (time: number) => HumanSignature.centre(reader, time).y;
  TestValidator.predicate(
    "mass centre reaches the bar",
    Math.abs(y(apex) - height) <= 0.01,
  );
  const acceleration =
    (y(takeoff + 3 * h) - 2 * y(takeoff + 2 * h) + y(takeoff + h)) / (h * h);
  TestValidator.predicate(
    "rising phase follows gravity",
    Math.abs(acceleration + AutoMovieGravity.STANDARD) <= 0.1,
  );
  let refused: unknown;
  try {
    jump(3);
  } catch (error) {
    refused = error;
  }
  TestValidator.predicate(
    "unreachable bar is attributed",
    refused instanceof HumanRefusal && refused.kind === "parameter",
  );
  const lowest =
    AutoMovieMotionHumanAcrobatics.GymnasticsFlight.prepareLowest(body);
  const from: IAutoMovieMotionHumanPosture = {
    root: { ...origin },
    yaw: 0,
    pitch: -60,
    roll: 0,
    joints: { head: [5, 0, 0], leftLowerLeg: [20, 0, 0] },
    limbs: {},
  };
  from.root.y = top - lowest(from);
  const settled = AutoMovieMotionHumanAcrobatics.GymnasticsMat.lie({
    body,
    model: body.massModel,
    from,
    velocity: { x: 0.6, y: -1, z: 0 },
    height: top,
  });
  const prior = settled(
    AutoMovieMotionHumanAcrobatics.GymnasticsMat.SETTLE / 2,
  );
  prior.root.x += 1;
  prior.joints.head = [999, 0, 0];
  for (const time of [
    AutoMovieMotionHumanAcrobatics.GymnasticsMat.SETTLE,
    0,
    AutoMovieMotionHumanAcrobatics.GymnasticsMat.SETTLE / 2,
  ]) {
    const posture = settled(time);
    TestValidator.predicate(
      "independent settled posture rests on the mat",
      Math.abs(lowest(posture) - top) <= 1e-7 &&
        posture.root !== prior.root &&
        posture.joints !== prior.joints,
    );
  }
  const spokes: IAutoMovieMotionHumanGymnasticsWheel.ISpoke[] = [
    { bones: ["leftFoot"], height: 0, support: { kind: "ground" } },
    { bones: ["rightHand"], height: 0, support: { kind: "ground" } },
  ];
  const contacts = (rows: IAutoMovieMotionHumanGymnasticsWheel.IRow[]) =>
    AutoMovieMotionHumanAcrobatics.GymnasticsWheel.contacts(
      { rows, root: () => origin },
      spokes,
      (angle) => angle / 360,
    );
  const rows = [
    { angle: -0, bears: 0, root: origin },
    { angle: 0, bears: 1, root: origin },
  ];
  const marks = contacts(rows);
  TestValidator.equals(
    "distinct limbs own the adjacent contacts",
    marks.map((mark) => mark.part),
    ["leftFoot", "rightHand"],
  );
  TestValidator.predicate(
    "touching bounds retain authored signs",
    Object.is(marks[0]!.from, -0) &&
      Object.is(marks[0]!.to, -0) &&
      Object.is(marks[1]!.from, 0) &&
      Object.is(marks[1]!.to, 0),
  );
  TestValidator.equals("empty contact schedule", contacts([]), []);
}
