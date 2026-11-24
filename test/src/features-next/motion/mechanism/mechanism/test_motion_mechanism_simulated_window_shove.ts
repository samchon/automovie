import type { IAutoMovieMotionHumanBody } from "@automovie/interface";

import { motionComplaints } from "../../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../../features/internal/motionHumanBody";
import { simulatedWindowScene } from "../../../internal/simulatedWindowScene";

/**
 * A shove on the head the body absorbs, solved, on its own: scenarios 2, 3 and
 * 7 for the shove of `test_motion_mechanism_simulated_window`, on the average
 * man and the smallest woman, staged as the original stages them.
 *
 * Scenarios, on each body:
 *
 * 1. Two simulated bakes give the same input identity and solved frames.
 * 2. The solved head turns away from the kinematic one inside the window, by more
 *    than the range tolerance displayed poses are held to.
 * 3. At the window's end every joint centre is back on the kinematic motion, with
 *    no step in position and none in velocity beyond what gravity gives in one
 *    interval.
 * 4. The joint residuals stay within 0.1 degree (`simulationResiduals`).
 * 5. The solved take passes the shipped verdicts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original and scenarios it decomposes, the staging, the bodies and every bound.
 * @evidence contracts/development/testing.md#behavioral-verification Bakes the shove's window simulated twice and reads the solved and authored bones and the verdict report; a bake that differs between runs, a window with no response, a hand-back with a step, a residual or a verdict fails.
 * @evidence contracts/development/testing.md#independent-expectations Equality for determinism; the response must exceed the range tolerance; the velocity bound is gravity's change over one cache interval; the residual guard is `simulationResiduals`'.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies of opposite size; the shove's kinematic mode, the solved shove and the two falls are each one unit of `test_motion_mechanism_simulated_window_*`.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory test entered through `test_motion_mechanism_simulated_window_shove`; it runs the in-house solver in process and starts no viewer, every failure gathered before the one assertion.
 */
export async function test_motion_mechanism_simulated_window_shove(): Promise<void> {
  const all: motionComplaints.IGatherer = motionComplaints();
  for (const name of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    try {
      await simulatedWindowScene.shoveSolved(all, name, body);
    } catch (error: unknown) {
      all.check(
        `${name} threw: ${error instanceof Error ? error.message : String(error)}`,
        false,
      );
    }
  }
  all.assert("the shove is absorbed and handed back");
}
