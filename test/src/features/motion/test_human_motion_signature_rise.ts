import { motionComplaints } from "../internal/motionComplaints";
import type { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanRiseSignature } from "../internal/motionHumanRiseSignature";

/**
 * Sit-to-stand flexes the trunk before seat-off and finishes upright on both feet.
 *
 * Scenarios:
 * 1. The trunk's peak from seated to seat-off stays between 20° and 60°.
 * 2. Standing shows flexion at most 20° at either knee and trunk inclination within ±10°.
 * 3. Both planted feet stay on the floor through the whole rise.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the observed phases, limits and feet.
 * @evidence contracts/development/testing.md#behavioral-verification Observes the public rise film's displayed trunk, knees and both feet; a missing preparatory lean or a slipped plant fails.
 * @evidence contracts/development/testing.md#independent-expectations The phases follow Schenkman et al. 1990. The existing provisional angle bounds and continuous contact readings are retained.
 * @evidence contracts/development/testing.md#distinguishing-cases The same body-relative chair geometry is tested at the two size extremes. Seat and bench interactions have their separate support tests.
 * @evidence contracts/development/testing.md#execution-ownership Two real films using normalized furniture run in memory under the discovered feature.
 */
export function test_human_motion_signature_rise(): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  for (const body of BODIES) motionHumanRiseSignature.read(body, all);
  all.assert("the rise flexes before seat-off and finishes on both feet");
}

/** Body-relative furniture is checked at both size extremes. */
const BODIES: readonly motionHumanBody.Name[] = ["f-small", "m-large"];
