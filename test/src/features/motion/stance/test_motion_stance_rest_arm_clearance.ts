import type {
  IAutoMovieMotionHumanAuditTangle,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";
import { AutoMovieMotionHumanStance } from "@automovie/motions";
import {
  AutoMovieMotionHumanAuditTangle,
  HumanArmClearance,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions/internal";

import { everydayTake } from "../../internal/everydayTake";
import { motionComplaints } from "../../internal/motionComplaints";
import { motionHumanBody } from "../../internal/motionHumanBody";

/**
 * Hip abduction of the spread thigh, degrees: a wide stance (a board, a
 * straddle) brings the thigh out under the hanging hand.
 */
const SPREAD: number = 25;

/** The right hand's digits. */
const DIGIT: RegExp = /^right(Thumb|Index|Middle|Ring|Little)/;

/** The tangle audit's limit, metres: the skin's give. */
const GIVE: number = 0.01;

/**
 * The hanging arm of a posture is let out of the body it hangs beside
 * (`HumanArmClearance.swung`): a posture that moves the thigh under the quiet
 * stance's relaxed arm leaves the hand's digits in the thigh, and the swung arm
 * takes them out, by the tangle audit's own reading.
 *
 * Scenarios:
 *
 * 1. In the quiet stance the relaxed arm is left as it hangs.
 * 2. With the right thigh spread out under the right hand, the relaxed digits lie
 *    in the thigh past the skin's give; the swung arm abducts and no digit lies
 *    past it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the two postures and what each pins.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public clearance on postures and reads the tangle audit's pose reading.
 * @evidence contracts/development/testing.md#independent-expectations The audit's own pairs and the skin's give bound both cases.
 * @evidence contracts/development/testing.md#distinguishing-cases A posture the relaxed arm clears and one it sinks into.
 * @evidence contracts/development/testing.md#execution-ownership In-memory postures of generated bodies.
 */
export function test_motion_stance_rest_arm_clearance(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const profile of ["m-average", "f-average"] as const) {
    try {
      const body: IAutoMovieMotionHumanBody = motionHumanBody(profile);
      const quiet: IAutoMovieMotionHumanPosture =
        AutoMovieMotionHumanStance.stand.posture(body, { x: 0, y: 0, z: 0 }, 0);
      const thigh: (posture: IAutoMovieMotionHumanPosture) => number = (
        posture: IAutoMovieMotionHumanPosture,
      ): number =>
        Math.max(
          0,
          ...AutoMovieMotionHumanAuditTangle.pose(
            body,
            poseBones(body, resolveHumanPosture(body, posture)),
          )
            .filter(
              (pair: IAutoMovieMotionHumanAuditTangle.IPair): boolean =>
                DIGIT.test(pair.a) || DIGIT.test(pair.b),
            )
            .map(
              (pair: IAutoMovieMotionHumanAuditTangle.IPair): number =>
                pair.depth,
            ),
        );

      const kept: IAutoMovieMotionHumanPosture = HumanArmClearance.swung(
        body,
        quiet,
        ["right"],
      );
      checks.check(
        `${profile}: in the quiet stance the relaxed arm hangs as it is`,
        kept.joints.rightUpperArm?.[1] === quiet.joints.rightUpperArm?.[1],
      );

      const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...quiet.limbs };
      delete limbs.rightLeg;
      const spread: IAutoMovieMotionHumanPosture = {
        ...quiet,
        limbs,
        joints: { ...quiet.joints, rightUpperLeg: [0, SPREAD, 0] },
      };
      const sunk: number = thigh(spread);
      const swung: IAutoMovieMotionHumanPosture = HumanArmClearance.swung(
        body,
        spread,
        ["right"],
      );
      const cleared: number = thigh(swung);
      checks.check(
        `${profile}: over a spread thigh the relaxed digits sink (${sunk.toFixed(4)} m) and the swung arm takes them out (${cleared.toFixed(4)} m)`,
        sunk > GIVE &&
          cleared <= GIVE &&
          swung.joints.rightUpperArm![1] > quiet.joints.rightUpperArm![1],
      );
    } catch (error: unknown) {
      checks.check(
        `${String(profile)}: ${everydayTake.describe(error)}`,
        false,
      );
    }
  }
  checks.assert("stance rest arm clearance");
}
