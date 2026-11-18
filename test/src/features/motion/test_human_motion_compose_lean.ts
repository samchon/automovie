import { motionComplaints } from "../internal/motionComplaints";
import { motionComposeLean } from "../internal/motionComposeLean";
import type { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A lean composes each rigid pivot and weight in the performer's own frame.
 *
 * Scenarios:
 * 1. Pitch and roll preserve the pelvis. Successive elementary pivots preserve their summed angles.
 * 2. The same backward translation is resolved at 0° and 90°. A sway keeps its planted feet.
 * 3. Bow begins at zero, scales the hip correction by the ratio of sines, and holds its explicit support balance.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the primitive and the independent conditions it checks.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the displayed pelvis, head and feet through the pose resolver, and verifies the named bow's active centre of mass.
 * @evidence contracts/development/testing.md#independent-expectations The pivot and backward shift are rigid transforms. The bow's half-weight back shift is the ratio of the sines of the two pitch angles.
 * @evidence contracts/development/testing.md#distinguishing-cases No angle, translated frame, weight endpoint or balance limit changes between bodies.
 * @evidence contracts/development/testing.md#execution-ownership The discovered scenario solves the posed geometry on in-memory rigs and gathers every finding before asserting.
 */
export function test_human_motion_compose_lean(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  for (const body of BODIES) motionComposeLean(body, complaints);
  complaints.assert("A lean composes each rigid pivot and weight in the performer's own frame");
}

/** The shortest and tallest rigs preserve both size extremes. */
const BODIES: readonly motionHumanBody.Name[] = ["f-small", "m-large"];
