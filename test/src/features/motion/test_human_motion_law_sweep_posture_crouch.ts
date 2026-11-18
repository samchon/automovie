import { AutoMovieMotionHumanRange, HumanChain, HumanRefusal } from "@automovie/motions";

import { motionHumanLaw } from "../internal/motionHumanLaw";
import { motionComplaints } from "../internal/motionComplaints";
import { motionCrouchSignature } from "../internal/motionCrouchSignature";
import { motionHumanBody } from "../internal/motionHumanBody";
import { motionPostureBranches } from "../internal/motionPostureBranches";

/**
 * The two crouch depths and the independent heel branch keep their supported path.
 *
 * Scenarios:
 * 1. The default flat heel and the explicitly raised partial heel distinguish the pivot branch.
 * 2. The full depth exercises its default lifted heel; flat heels must refuse at the open hip-plus-shank limit.
 * 3. Independent knee, heel and trunk observations check the geometry and the gate for unrequested balance.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the law's distinguishing inputs and preserves their staged context.
 * @evidence contracts/development/testing.md#behavioral-verification Performs the actual public law and applies the timing, contact, range, spin and display audits to its staged performances.
 * @evidence contracts/development/testing.md#independent-expectations The original floor, skin, contact and limit bounds still apply. The angle and heel geometry are read against the separate literature and socket bounds in motionCrouchSignature.
 * @evidence contracts/development/testing.md#distinguishing-cases The default flat heel and the explicitly raised partial heel distinguish the pivot branch. The full depth exercises its default lifted heel; flat heels must refuse at the open hip-plus-shank limit.
 * @evidence contracts/development/testing.md#execution-ownership All three feasible depth and heel combinations share each audited film with the geometry checks. Two standing references calibrate the two rigs.
 */
export function test_human_motion_law_sweep_posture_crouch(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  const stance: Map<motionHumanBody.Name, number> = new Map();
  const findings: string[] = motionPostureBranches(
    [
      ["crouch", "default", "f-small"],
      ["crouch", "depth=partial,heels=up", "m-large"],
      ["crouch", "depth=full", "m-large"],
    ],
    (film, [, row, name]): void => {
      motionPostureBranches.checkBase(complaints.list, film.performance, `crouch ${row} ${name}`, "standing");
      motionCrouchSignature(complaints, { film, body: motionHumanBody(name), yaw: 0 }, row, name, stance);
    },
  );
  complaints.list.push(...findings);
  // At flat heels the sagittal knee flexion is the sum of the shank tilt
  // and thigh tilt. The hip needs room left for the trunk to incline.
  const hip: number = AutoMovieMotionHumanRange.limit("leftUpperLeg", "flexion")!;
  const ankle: number = AutoMovieMotionHumanRange.limit("leftFoot", "flexion")!;
  const maximum: number = hip + Math.min(28, ankle); // Hyodo et al., 2017, loaded squat.
  let refusal: unknown;
  try {
    motionHumanLaw.perform("base", [{ subject: "a", body: motionHumanBody("f-small") }],
      HumanChain.subject("a").crouch({ depth: "full", heels: "flat", hold: 0.5 }));
  } catch (error) {
    refusal = error;
  }
  complaints.check(`flat full crouch reports knee flexion under ${maximum} degrees`,
    refusal instanceof HumanRefusal && refusal.kind === "parameter" && refusal.axis === "depth" &&
    refusal.value === "full" && refusal.feasible?.kind === "range" &&
    refusal.feasible.unit === "degrees" && refusal.feasible.open === "maximum" &&
    refusal.feasible.minimum === 0 && refusal.feasible.maximum === maximum);
  complaints.assert("The crouch follows its supported path and keeps its depth, heels and trunk direction");
}
