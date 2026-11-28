import { AutoMovieEngineVector3 } from "@automovie/engine";
import {
  AutoMovieMotionHumanChain,
  AutoMovieMotionHumanPerformance,
} from "@automovie/motions";
import assert from "node:assert/strict";

import { HumanSegmentPlant } from "../../../../../packages/motions/src/perform/internal/HumanSegmentPlant";
import { HumanFoot } from "../../../../../packages/motions/src/posture/internal/HumanFoot";
import { poseBones } from "../../../../../packages/motions/src/posture/internal/poseBones";
import { resolveHumanPosture } from "../../../../../packages/motions/src/posture/internal/resolveHumanPosture";
import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";

/**
 * Keep the active distal toe socket on its authored pivot while a completed
 * walk blends into a stand. Heel, forefoot, inactive toe and absent contact
 * goals retain the entering offset that they were given.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the affected gait-to-stand, the active toe's bearing socket and the contact controls.
 * @evidence contracts/development/testing.md#behavioral-verification Compares the native displayed toe with its incoming stand's actual foot course during the blend and across both boundaries. Exercises unaffected contact cases using the same measured body and offset pose.
 * @evidence contracts/development/testing.md#independent-expectations The raw authored toe world point is the reference at each positive sample. Guard contacts are computed from the foot's separate heel and forefoot sockets or have the target or plant removed. The freely moving toe is read in the original gait.
 */
export async function test_motions_perform_toe_bearing(): Promise<void> {
  const body = await humanFixtureBody("m-average");
  const person = {
    subject: "d2",
    body,
    at: { x: 2, y: 0, z: 1.3 },
    yaw: 205,
    proficiency: { level: "elite" as const },
  };
  const walk = AutoMovieMotionHumanChain.subject(person.subject)
    .stand({ hold: 2.1 })
    .walk(
      {
        to: { x: 1.4, y: 0, z: 2.7 },
        facing: { yaw: 205 },
        pace: "normal",
      },
      "arrive",
    );
  const timer = AutoMovieMotionHumanChain.subject("timer").stand({ hold: 8 });
  const cast = [
    person,
    { ...person, subject: "timer", at: { x: 13, y: 0, z: 0 }, yaw: 0 },
  ];
  const settled = new AutoMovieMotionHumanPerformance({
    seed: "court-witness",
    performers: cast,
    composition: walk.stand({ hold: 1.8 }, "settle").with(timer).node,
    props: [],
  });
  const gaitOnly = new AutoMovieMotionHumanPerformance({
    seed: "court-witness",
    performers: cast,
    composition: walk.with(timer).node,
    props: [],
  });
  const stand = settled
    .segments(person.subject)
    .find((segment) => segment.id === "settle")!;
  assert.ok(stand.transition !== undefined);
  const boundary = stand.transition.cut;
  const blendEnd = boundary + stand.transition.blend;
  const toeAt = (take: AutoMovieMotionHumanPerformance, seconds: number) =>
    HumanFoot.sockets(body, take.bones(person.subject, seconds), "right").find(
      (socket) => socket.socket === "toe",
    )!.point;
  const distance = AutoMovieEngineVector3.distance;
  const seconds = [boundary + 0.03, boundary + 0.07, boundary + 0.16];
  for (const time of seconds) {
    const posture = stand.plan.posture(time - stand.start);
    const raw = poseBones(body, resolveHumanPosture(body, posture));
    const told = HumanFoot.sockets(body, raw, "right").find(
      (socket) => socket.socket === "toe",
    )!.point;
    assert.ok(distance(told, toeAt(settled, time)) < 1e-9);
  }
  for (const time of [boundary, blendEnd])
    assert.ok(
      distance(toeAt(settled, time - 1e-6), toeAt(settled, time + 1e-6)) < 2e-6,
    );
  assert.deepEqual(toeAt(settled, 4.9), toeAt(gaitOnly, 4.9));
  assert.ok(distance(toeAt(gaitOnly, 4.9), toeAt(gaitOnly, 5.09)) > 0.03);

  const posture = stand.plan.posture(seconds[0]! - stand.start);
  const before = resolveHumanPosture(body, posture);
  const toe = before.joints.find((joint) => joint.bone === "rightToes")!;
  const offset = {
    ...before,
    joints: before.joints.map((joint) =>
      joint === toe ? { ...joint, flexion: (joint.flexion ?? 0) - 5 } : joint,
    ),
  };
  const plant = posture.limbs.rightLeg!;
  for (const rightLeg of [
    { ...plant, planted: false },
    { ...plant, contact: undefined },
    {
      ...plant,
      contact: HumanFoot.offset(body, "right", "heel", toe.flexion ?? 0),
    },
    {
      ...plant,
      contact: HumanFoot.offset(body, "right", "ball", toe.flexion ?? 0),
    },
  ])
    assert.equal(
      HumanSegmentPlant.preserveBearingToes(body, { rightLeg }, before, offset),
      offset,
    );
  assert.equal(
    HumanSegmentPlant.preserveBearingToes(body, {}, before, offset),
    offset,
  );
}
