import { motionComplaints } from "../internal/motionComplaints";
import { motionKneelSignature } from "../internal/motionKneelSignature";
import { motionPostureBranches } from "../internal/motionPostureBranches";

/**
 * Kneeling on both knees and sitting back keep the required floor contacts.
 *
 * Scenarios:
 * 1. Upright kneeling holds both knees near right angles with upright thighs.
 * 2. Sitting back folds both knees while keeping their support on the floor.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two floor supports and how their held geometry differs.
 * @evidence contracts/development/testing.md#behavioral-verification Performs the actual law, reading the joint geometry at the hold and the unchanged audits throughout the transition.
 * @evidence contracts/development/testing.md#independent-expectations The standard upright and folded kneeling postures establish the hip and knee angles in motionKneelSignature.
 * @evidence contracts/development/testing.md#distinguishing-cases Both knees bear in each posture. Degree of flexion separates upright kneeling from sitting back, on opposite stature extremes.
 * @evidence contracts/development/testing.md#execution-ownership One film per floor mode serves both the geometry and the full audit.
 */
export function test_human_motion_law_sweep_posture_kneel_floor(): void {
  const signature: motionComplaints.IGatherer = motionComplaints();
  const findings: string[] = motionPostureBranches(
    [
      ["kneel", "kind=both", "m-large"],
      ["kneel", "kind=sitBack", "f-small"],
    ],
    (film, [, row, name]): void => {
      motionKneelSignature(signature, film, name, row === "kind=both" ? "both" : "sitBack");
    },
  );
  signature.list.push(...findings);
  signature.assert("Both floor kneels hold their distinct geometry and contact");
}
