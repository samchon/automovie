import type { IAutoMovieMotionHumanBody } from "@automovie/interface";
import {
  AutoMovieMotionHumanAcrobatics,
  HumanChain,
  HumanPerformance,
} from "@automovie/motions";

import { assertTakeClean } from "../../internal/assertTakeClean";
import { everydayTake } from "../../internal/everydayTake";
import { motionComplaints } from "../../internal/motionComplaints";
import { motionHumanBody } from "../../internal/motionHumanBody";

/**
 * A cartwheel alone from a stand, to either side (#3873's wheel, the aú row's
 * law).
 *
 * Scenarios, on two body proportions and both directions: the take passes the
 * shipped verdicts, which read the hands' plants on the floor surface (no
 * finger below it), the feet holding their plants until each lifts, the joints'
 * ranges and the continuity of every bone.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the takes and what the verdicts read.
 * @evidence contracts/development/testing.md#behavioral-verification Plans the cartwheel through the public chain and reads the shipped verdict report.
 * @evidence contracts/development/testing.md#independent-expectations The verdicts' limits are the report's own.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies and two directions.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on the shared Human fixture.
 */
export function test_motion_acrobatics_cartwheel(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const name of ["f-small", "m-average"] as const) {
    try {
      for (const to of ["left", "right"] as const) {
        const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
        const film: HumanPerformance = new HumanPerformance({
          seed: "cartwheel",
          laws: [AutoMovieMotionHumanAcrobatics.cartwheel],
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
            .stand({ hold: 0.3, sway: 0 })
            .registered("cartwheel", { to }).node,
        });
        verdict(checks, `${name} cartwheel to the ${to}`, film);
      }
    } catch (error: unknown) {
      checks.check(`${String(name)}: ${everydayTake.describe(error)}`, false);
    }
  }
  checks.assert("acrobatics cartwheel");
}

/** Gather a take's shipped verdicts as one check. */
function verdict(
  checks: motionComplaints.IGatherer,
  label: string,
  film: HumanPerformance,
): void {
  try {
    assertTakeClean(label, film);
  } catch (error: unknown) {
    checks.check(
      `${label}: ${error instanceof Error ? error.message : String(error)}`,
      false,
    );
  }
}
