import type { IAutoMovieMotionHumanBody } from "@automovie/interface";

import { motionComplaints } from "../../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../../features/internal/motionHumanBody";
import { simulatedWindowScene } from "../../../internal/simulatedWindowScene";

/**
 * A shove's window in kinematic mode shows the performance's own poses, on its
 * own: scenario 1 of `test_motion_mechanism_simulated_window`, on the average
 * man and the smallest woman, staged as the original stages them.
 *
 * Scenarios, on each body:
 *
 * 1. Kinematic mode shows the performance's own pose bit for bit at 49 instants of
 *    the window.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original and scenarios it decomposes, the staging, the bodies and every bound.
 * @evidence contracts/development/testing.md#behavioral-verification Bakes the shove's window in kinematic mode through `HumanPerformance.simulate` and reads the displayed poses against the authored take's; a kinematic mode that departs from the authored motion fails.
 * @evidence contracts/development/testing.md#independent-expectations Equality of the displayed poses, the mode contract.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies of opposite size; the shove's kinematic mode, the solved shove and the two falls are each one unit of `test_motion_mechanism_simulated_window_*`.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory test entered through `test_motion_mechanism_simulated_window_shove_kinematic`; it runs the in-house solver in process and starts no viewer, every failure gathered before the one assertion.
 */
export async function test_motion_mechanism_simulated_window_shove_kinematic(): Promise<void> {
  const all: motionComplaints.IGatherer = motionComplaints();
  for (const name of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    try {
      await simulatedWindowScene.shoveKinematic(all, name, body);
    } catch (error: unknown) {
      all.check(
        `${name} threw: ${error instanceof Error ? error.message : String(error)}`,
        false,
      );
    }
  }
  all.assert("the kinematic window is the performance's own motion");
}
