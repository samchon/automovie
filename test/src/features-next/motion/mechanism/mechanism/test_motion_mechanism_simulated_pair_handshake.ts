import type { IAutoMovieMotionHumanBody } from "@automovie/interface";

import { motionComplaints } from "../../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../../features/internal/motionHumanBody";
import { simulatedPairScene } from "../../../internal/simulatedPairScene";

/**
 * The coupled handshake's grips held by the solver in a simulated window, on
 * its own: scenarios 2 and 4 for the handshake of
 * `test_motion_mechanism_simulated_pair`, the average man and the smallest
 * woman, staged as the original stages them.
 *
 * Scenarios:
 *
 * 1. The gripping arms are the solver's at every bound step and every grip stays
 *    within the solver's contact tolerance.
 * 2. Two bakes give the same identity and solved frames.
 * 3. Every hand-back's post-stabilization and every fewer-axis joint's distance
 *    from its limit box stay within 0.1 degree (`simulationResiduals`).
 * 4. The solved take passes the shipped verdicts.
 *
 * The original runs its scenarios in one spec, so the handshake's bake throwing
 * hid every bake check after it; here this part reports on its own.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original and scenarios it decomposes, the staging, the bodies and every bound.
 * @evidence contracts/development/testing.md#behavioral-verification Bakes the handshake's window simulated twice through `HumanPerformance.simulate` and reads the engine's solved frames, the bindings' colliders and the verdict report; a grip the solver lets slip or pass in, a hand left authored, a bake that differs between runs, a joint residual or a verdict fails.
 * @evidence contracts/development/testing.md#independent-expectations Bindings measured as the convex distance of the bound colliders against the admitted contact tolerance; equality for determinism; the residual guard is `simulationResiduals`'.
 * @evidence contracts/development/testing.md#distinguishing-cases The kinematic mode, the simulated handshake and the released pair are each one unit of `test_motion_mechanism_simulated_pair_*`; this one owns scenarios 2 and 4 for the handshake.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory test entered through `test_motion_mechanism_simulated_pair_handshake`; it runs the in-house solver in process and starts no viewer, every failure gathered before the one assertion.
 */
export async function test_motion_mechanism_simulated_pair_handshake(): Promise<void> {
  const a: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const b: IAutoMovieMotionHumanBody = motionHumanBody("f-small");
  const all: motionComplaints.IGatherer = motionComplaints();
  try {
    await simulatedPairScene.bake(all, simulatedPairScene.handshake(a, b));
  } catch (error: unknown) {
    all.check(
      `handshake threw: ${error instanceof Error ? error.message : String(error)}`,
      false,
    );
  }
  all.assert("the simulated handshake holds its grips");
}
