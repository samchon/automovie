import type { IAutoMovieMotionHumanBody } from "@automovie/interface";

import { motionComplaints } from "../../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../../features/internal/motionHumanBody";
import { simulatedWindowScene } from "../../../internal/simulatedWindowScene";

/**
 * A fall-sized push from behind ends with the released body lying on the floor,
 * on its own: scenarios 4, 6 and 7 for the fall to the floor of
 * `test_motion_mechanism_simulated_window`, on the average man and the smallest
 * woman, staged as the original stages them.
 *
 * Scenarios, on each body:
 *
 * 1. The push releases the body to the solver.
 * 2. Nothing ends under the floor beyond its documented resting depth; the lowest
 *    collider touches the floor; the hips and the head lie below the standing
 *    knee.
 * 3. The solved window's report judges none of the plant checks the solver's
 *    contacts supersede.
 * 4. The joint residuals stay within 0.1 degree, and the solved take passes the
 *    shipped verdicts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original and scenarios it decomposes, the staging, the bodies and every bound.
 * @evidence contracts/development/testing.md#behavioral-verification Bakes the fall's window to the film's end and reads the solved colliders against the floor, the solved hips and head, the verdict report and the residuals; a fall that floats or sinks, a body left standing, a report still judging plants, a residual or a verdict fails.
 * @evidence contracts/development/testing.md#independent-expectations Resting contact bounded by the engine's compliant contact under its configured parameters (Macklin, Mueller and Chentanez 2016), lying against the body's own rest knee height, as the original.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies of opposite size; the shove's kinematic mode, the solved shove and the two falls are each one unit of `test_motion_mechanism_simulated_window_*`.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory test entered through `test_motion_mechanism_simulated_window_fall_floor`; it runs the in-house solver in process and starts no viewer, every failure gathered before the one assertion.
 */
export async function test_motion_mechanism_simulated_window_fall_floor(): Promise<void> {
  const all: motionComplaints.IGatherer = motionComplaints();
  for (const name of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    try {
      await simulatedWindowScene.fall(all, name, body, false);
    } catch (error: unknown) {
      all.check(
        `${name} threw: ${error instanceof Error ? error.message : String(error)}`,
        false,
      );
    }
  }
  all.assert("the pushed body falls to the floor");
}
