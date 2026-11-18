import type { AutoMovieHumanSide } from "@automovie/interface";

import { motionComplaints } from "../internal/motionComplaints";
import { motionComposeLeanInto } from "../internal/motionComposeLeanInto";
import type { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The built reach target identifies the least trunk tilt that reaches it.
 *
 * Scenarios:
 * 1. A near wrist target needs no lean. Constructed targets at larger inclinations identify the least measured pose, and a goal beyond the admissible arc refuses.
 * 2. A held arm keeps both foot plants and the extrapolated centre of mass over the support throughout the moving interval.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the primitive and the independent conditions it checks.
 * @evidence contracts/development/testing.md#behavioral-verification Reads each real solved shoulder and wrist range, rejects a shallow or excessive pitch and observes both sole plants.
 * @evidence contracts/development/testing.md#independent-expectations A target exactly one allowed arm length forward of a selected shoulder position fixes the solution. The neighboring smaller pitch must fail reach. The Hof margin retains its original continuous-grid samples.
 * @evidence contracts/development/testing.md#distinguishing-cases Two opposite hand and reach-share choices on each body exercise both mirror paths and both reach limits. The moving 0.8-share case runs on alternate hands.
 * @evidence contracts/development/testing.md#execution-ownership The discovered scenario solves the posed geometry on in-memory rigs and gathers every finding before asserting.
 */
export function test_human_motion_compose_lean_into(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  for (const [body, side] of CASES) motionComposeLeanInto(body, side, complaints);
  complaints.assert("The built reach target identifies the least trunk tilt that reaches it");
}

/** Both hands take the more restricted reach share, on contrasting rigs. */
type Case = readonly [body: motionHumanBody.Name, side: AutoMovieHumanSide];

/** The body and the arm that performs the moving reach. */
const CASES: readonly Case[] = [
  ["f-small", "left"],
  ["m-large", "right"],
];
