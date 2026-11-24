import type { IAutoMovieMotionHumanBody } from "@automovie/interface";

import { motionComplaints } from "../../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../../features/internal/motionHumanBody";
import { simulatedPairScene } from "../../../internal/simulatedPairScene";

/**
 * Two bodies released in the air together keep gravity's momentum, on its own:
 * scenarios 3 and 4 for the released pair of
 * `test_motion_mechanism_simulated_pair`, the average man and the smallest
 * woman, staged as the original stages them.
 *
 * Scenarios:
 *
 * 1. The released pair never touches the floor and the window releases both.
 * 2. The pair's total linear momentum changes by gravity's impulse only, within
 *    the float64 rounding bound of the original (Higham 2002), at every
 *    released frame.
 * 3. The joint residuals stay within 0.1 degree (`simulationResiduals`).
 * 4. The solved take passes the shipped verdicts.
 *
 * The original guards this scenario apart from the handshake, so it ran there
 * too; here it is a spec of its own, isolated from the handshake's module
 * state.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original and scenarios it decomposes, the staging, the bodies and every bound.
 * @evidence contracts/development/testing.md#behavioral-verification Bakes the two jumps' released window through `HumanPerformance.simulate` and reads the solved frames' segment velocities, the contact receipts and the verdict report; a coupling that creates momentum, a floor contact voiding the premise, a residual or a verdict fails.
 * @evidence contracts/development/testing.md#independent-expectations Momentum against Newton's second law with gravity alone, read from segment masses and solved velocities, within the rounding bound in Higham's standard model, as the original derives it.
 * @evidence contracts/development/testing.md#distinguishing-cases The kinematic mode, the simulated handshake and the released pair are each one unit of `test_motion_mechanism_simulated_pair_*`; this one owns scenarios 3 and 4 for the released pair.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory test entered through `test_motion_mechanism_simulated_pair_released`; it runs the in-house solver in process and starts no viewer, every failure gathered before the one assertion.
 */
export async function test_motion_mechanism_simulated_pair_released(): Promise<void> {
  const a: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const b: IAutoMovieMotionHumanBody = motionHumanBody("f-small");
  const all: motionComplaints.IGatherer = motionComplaints();
  try {
    await simulatedPairScene.together(all, a, b);
  } catch (error: unknown) {
    all.check(
      `released threw: ${error instanceof Error ? error.message : String(error)}`,
      false,
    );
  }
  all.assert("the released pair keeps gravity's momentum");
}
