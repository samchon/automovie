import { createFork } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanObject, HumanPerformance } from "@automovie/motions";

import { armCourseContract } from "../../../internal/armCourseContract";
import { everydayTake } from "../../../internal/everydayTake";
import { motionActionUnit } from "../../../internal/motionActionUnit";
import { motionComplaints } from "../../../internal/motionComplaints";
import { motionHumanBody } from "../../../internal/motionHumanBody";

/**
 * Where the fork rests before it is taken, world metres: ahead of the right
 * hand at a counter's height.
 */
const FROM: IAutoMovieVector3 = { x: -0.25, y: 1.0, z: 0.35 };

/** Where it is put down, world metres: 0.3 m across, at the same height. */
const TO: IAutoMovieVector3 = { x: 0.05, y: 1.0, z: 0.35 };

/**
 * The arm planner's contract on its fifth canonical case: a held prop
 * transported. A standing performer takes a fork up and puts it down 0.3 m
 * across (`pickUp` > `putDown`, the planner's public seam for the carried
 * course), whatever the planner's algorithm, on the average man and the small
 * woman.
 *
 * Scenarios:
 *
 * 1. At the putDown's `placed` the fork's origin lies at the asked place within
 *    the touch contract's 10 mm.
 * 2. The fork rides the hand from the putDown's entry to `placed` within the
 *    everyday prop specs' 5 mm.
 * 3. The carried course stays clear by the audit's bounds.
 * 4. The course is continuous: no jump, out-and-back spike or snap.
 * 5. The course keeps the audit's speed, and the right wrist stays within 30 m/s
 *    read at ten times the film rate.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the canonical case, the seam, the bodies and every bound.
 * @evidence contracts/development/testing.md#behavioral-verification Performs pickUp > putDown through the public chain and reads the displayed fork against the asked place and in the hand's frame, the displayed wrist's speed and the verdict report over the putDown; a fork set down off its place or slipping in the hand, an arm through the body, a jump or snap or an impossible speed fails, and no planner internal is read.
 * @evidence contracts/development/testing.md#independent-expectations The place is the authored `to` (`IAutoMovieMotionHumanPutDown`, the prop's origin goes there) within the touch contract's 10 mm; the custody bound is the everyday prop specs' 5 mm; the rest the audit's stated limits.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies of opposite stature; a carried course against the empty-handed cases of the other `test_motion_contact_arm_contract_*`.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances through the public chain, entered through `test_motion_contact_arm_contract_held_transport`.
 */
export function test_motion_contact_arm_contract_held_transport(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const name of ["m-average", "f-small"] as const) {
    const label: string = `${name}: a fork carried 0.3 m across`;
    try {
      verify(checks, label, motionHumanBody(name));
    } catch (error: unknown) {
      checks.check(
        `${label}: ${error instanceof Error ? error.message : String(error)}`,
        false,
      );
    }
  }
  checks.assert("the carried arm course keeps its contract");
}

/** One body's transport and its checks. */
function verify(
  checks: motionComplaints.IGatherer,
  label: string,
  body: IAutoMovieMotionHumanBody,
): void {
  const take: HumanPerformance = new HumanPerformance({
    seed: "arm-contract",
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    props: [
      HumanObject.prop("fork", createFork({ id: "fork" }), {
        position: FROM,
        rotation: Quaternion.identity(),
      }),
    ],
    composition: HumanChain.subject("a")
      .pickUp({ prop: "fork", handle: "grip", hand: "right", lift: 0.05 })
      .putDown({ prop: "fork", to: TO, hand: "right" }).node,
  });
  const act: IAutoMovieMotionHumanSegment = motionActionUnit.segment(
    take,
    "a",
    "putDown",
  );
  const placed: number = motionActionUnit.event(act, "placed");
  const off: number = Vector3.distance(take.prop("fork", placed).position, TO);
  checks.check(
    `${label}: the fork is set down at its place (${(off * 1000).toFixed(1)} mm)`,
    off <= armCourseContract.SITE,
  );
  const drift: number = everydayTake.drift(
    take,
    "right",
    "fork",
    act.entryTime,
    placed,
    "a",
  );
  checks.check(
    `${label}: the fork rides the hand to its place (${(drift * 1000).toFixed(1)} mm)`,
    drift <= motionActionUnit.HOLD,
  );
  armCourseContract.course(checks, label, take, "a", act, ["right"]);
}
