import type { IAutoMovieMotionHumanBody } from "@automovie/interface";

import { motionComplaints } from "../../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../../features/internal/motionHumanBody";
import { simulatedPairScene } from "../../../internal/simulatedPairScene";

/**
 * The coupled handshake in a kinematic window shows its own poses, on its own:
 * scenario 1 of `test_motion_mechanism_simulated_pair`, the average man and the
 * smallest woman, staged as the original stages them.
 *
 * Scenarios:
 *
 * 1. Kinematic mode shows the coupled handshake's own poses of both people bit for
 *    bit, at 25 steps of the window.
 *
 * In the original these checks run before the handshake's simulated bake, which
 * throws now; here they report apart from it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original and scenarios it decomposes, the staging, the bodies and every bound.
 * @evidence contracts/development/testing.md#behavioral-verification Bakes the handshake's window in kinematic mode through `HumanPerformance.simulate` and reads both people's displayed poses against the coupled take's; a kinematic mode that departs from the coupled output fails, and a throw of the simulated bake cannot hide it.
 * @evidence contracts/development/testing.md#independent-expectations Equality of the displayed poses, the mode contract.
 * @evidence contracts/development/testing.md#distinguishing-cases The kinematic mode, the simulated handshake and the released pair are each one unit of `test_motion_mechanism_simulated_pair_*`; this one owns scenario 1.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory test entered through `test_motion_mechanism_simulated_pair_kinematic`; it runs the in-house solver in process and starts no viewer, every failure gathered before the one assertion.
 */
export async function test_motion_mechanism_simulated_pair_kinematic(): Promise<void> {
  const a: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const b: IAutoMovieMotionHumanBody = motionHumanBody("f-small");
  const all: motionComplaints.IGatherer = motionComplaints();
  try {
    await simulatedPairScene.kinematic(all, simulatedPairScene.handshake(a, b));
  } catch (error: unknown) {
    all.check(
      `kinematic threw: ${error instanceof Error ? error.message : String(error)}`,
      false,
    );
  }
  all.assert("the kinematic mode is the coupled handshake");
}
