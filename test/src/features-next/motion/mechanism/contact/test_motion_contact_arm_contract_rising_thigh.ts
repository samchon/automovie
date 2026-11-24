import { createSeat } from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanSeated,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanObject, HumanPerformance } from "@automovie/motions";
import { HumanHand } from "@automovie/motions/internal";

import { motionComplaints } from "../../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../../features/internal/motionHumanBody";
import { armCourseContract } from "../../../internal/armCourseContract";
import { motionActionUnit } from "../../../internal/motionActionUnit";

/** Where a chair is staged: its floor point, heading and fixity. */
interface IPlaced {
  /** The floor point, world metres. */
  at: IAutoMovieVector3;

  /** The heading, degrees. */
  yaw: number;

  /** Whether it is fixed in the scene. */
  fixed: true;
}

/**
 * The arm planner's contract on its third canonical case: a seated hand onto a
 * rising thigh. A performer seated on a dining chair rises; the rise lays the
 * hands on the thighs, which move as the trunk flexes over them, and the
 * hands leave them after seat-off (`rise`, the planner's public seam), whatever
 * the planner's algorithm, on the average man and the small woman.
 *
 * Scenarios:
 * 1. At `seatOff` each palm lies on its own thigh: within the thigh's measured
 *    radius of the thigh's axis, from the hip joint to the knee, plus the
 *    touch contract's 10 mm.
 * 2. The courses stay clear by the audit's bounds.
 * 3. The courses are continuous: no jump, out-and-back spike or snap.
 * 4. The courses keep the audit's speed, and each wrist stays within 30 m/s
 *    read at ten times the film rate.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the canonical case, the seam, the bodies and every bound.
 * @evidence contracts/development/testing.md#behavioral-verification Performs sit > rise through the public chain and reads the displayed palms against the displayed thighs' axes at seat-off, the displayed wrists' speed and the verdict report over the rise; a hand off its thigh, an arm through the thigh or trunk, a jump or snap or an impossible speed fails, and no planner internal is read.
 * @evidence contracts/development/testing.md#independent-expectations The rise's contract lays the hands on the thighs until after seat-off (`IAutoMovieMotionHumanRise`); the thigh's radius is the body's measure (`IAutoMovieBodyMeasure.thighRadius`), the site tolerance the touch contract's 10 mm, the other bounds the audit's stated limits.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies of opposite stature, both arms; the other canonical cases are the other `test_motion_contact_arm_contract_*`.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances through the public chain, entered through `test_motion_contact_arm_contract_rising_thigh`.
 */
export function test_motion_contact_arm_contract_rising_thigh(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const name of ["m-average", "f-small"] as const) {
    const label: string = `${name}: hands on the rising thighs`;
    try {
      verify(checks, label, motionHumanBody(name));
    } catch (error: unknown) {
      checks.check(
        `${label}: ${error instanceof Error ? error.message : String(error)}`,
        false,
      );
    }
  }
  checks.assert("the arm courses onto the rising thighs keep their contract");
}

/** One body's rise and its checks. */
function verify(
  checks: motionComplaints.IGatherer,
  label: string,
  body: IAutoMovieMotionHumanBody,
): void {
  const chair: ReturnType<typeof createSeat> = createSeat({
    id: "chair",
    kind: "dining",
  });
  const placed: IPlaced = { at: { x: 0, y: 0, z: 0 }, yaw: 0, fixed: true };
  const seat: IAutoMovieMotionHumanSeated.ISeat = HumanObject.seat(
    chair,
    placed,
  );
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
    props: [HumanObject.prop("chair", chair, placed)],
    composition: HumanChain.subject("a").sit({ seat, hold: 1 }).rise().node,
  });
  const act: IAutoMovieMotionHumanSegment = motionActionUnit.segment(
    take,
    "a",
    "rise",
  );
  const off: number = motionActionUnit.event(act, "seatOff");
  for (const side of ["left", "right"] as const) {
    const palm: IAutoMovieVector3 = HumanHand.frame(
      body,
      take.bones("a", off),
      side,
      "palm",
    ).point;
    const bones: ReturnType<HumanPerformance["bones"]> = take.bones("a", off);
    const axis: number = toAxis(
      palm,
      bones.get(`${side}UpperLeg`)!.worldPosition,
      bones.get(`${side}LowerLeg`)!.worldPosition,
    );
    checks.check(
      `${label}: the ${side} palm lies on its thigh at seat-off (${(axis * 1000).toFixed(1)} mm from its axis, the thigh's radius ${(body.measure.thighRadius * 1000).toFixed(1)} mm)`,
      axis <= body.measure.thighRadius + armCourseContract.SITE,
    );
  }
  armCourseContract.course(checks, label, take, "a", act, ["left", "right"]);
}

/** A point's distance from the segment between two points, metres. */
function toAxis(
  p: IAutoMovieVector3,
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
): number {
  const ab: IAutoMovieVector3 = Vector3.subtract(b, a);
  const share: number = Math.min(
    1,
    Math.max(0, Vector3.dot(Vector3.subtract(p, a), ab) / Vector3.dot(ab, ab)),
  );
  return Vector3.distance(p, Vector3.add(a, Vector3.scale(ab, share)));
}
