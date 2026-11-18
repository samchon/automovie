import { HumanChain } from "@automovie/motions";

import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanLaw } from "../internal/motionHumanLaw";
import { motionComplaints } from "../internal/motionComplaints";
import { motionKneelSignature } from "../internal/motionKneelSignature";
import { motionPostureBranches } from "../internal/motionPostureBranches";

/**
 * Kneeling on both knees and sitting back keep the required floor contacts.
 *
 * Scenarios:
 * 1. Upright kneeling holds both knees near right angles with upright thighs.
 * 2. Sitting back folds both knees while keeping their support on the floor.
 * 3. Omitting the rise leaves a two-knee base with both knees still bearing.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two floor supports and how their held geometry differs.
 * @evidence contracts/development/testing.md#behavioral-verification Performs the actual law, reading the joint geometry at the hold and the unchanged audits throughout the transition.
 * @evidence contracts/development/testing.md#independent-expectations The standard upright and folded kneeling postures establish the hip and knee angles in motionKneelSignature.
 * @evidence contracts/development/testing.md#distinguishing-cases Both knees bear in each posture. Degree of flexion separates upright kneeling from sitting back, on opposite stature extremes.
 * @evidence contracts/development/testing.md#execution-ownership Two returning films share geometry and audit, and one held film supplies the independent terminal branch.
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
  // Both knees can also remain down. The one-knee and sit-back held
  // variants are covered by the takeAKnee and kneelSit row geometry.
  const staying: motionHumanLaw.IFilm = motionHumanLaw.perform("base",
    [{ subject: "a", body: motionHumanBody("m-large") }],
    HumanChain.subject("a").kneel({ kind: "both", hold: 0.5, rise: false }));
  motionKneelSignature(signature, staying, "m-large", "both", "right", false);
  signature.list.push(...findings);
  signature.assert("Both floor kneels hold their distinct geometry and contact");
}
