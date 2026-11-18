import { motionComplaints } from "../internal/motionComplaints";
import { motionCrouchSignature } from "../internal/motionCrouchSignature";
import { motionHumanBody } from "../internal/motionHumanBody";
import { motionPostureBranches } from "../internal/motionPostureBranches";

/**
 * The two crouch depths and the independent heel branch keep their supported path.
 *
 * Scenarios:
 * 1. The default flat heel and the explicitly raised partial heel distinguish the pivot branch.
 * 2. The full depth exercises its default lifted heel; the adjacent full-flat refusal is owned by core base transitions.
 * 3. Independent knee, heel and trunk observations check the geometry and the gate for unrequested balance.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the law's distinguishing inputs and preserves their staged context.
 * @evidence contracts/development/testing.md#behavioral-verification Performs the actual public law and applies the timing, contact, range, spin and display audits to its staged performances.
 * @evidence contracts/development/testing.md#independent-expectations The original floor, skin, contact and limit bounds still apply. The angle and heel geometry are read against the separate literature and socket bounds in motionCrouchSignature.
 * @evidence contracts/development/testing.md#distinguishing-cases The default flat heel and the explicitly raised partial heel distinguish the pivot branch. The full depth exercises its default lifted heel; the adjacent full-flat refusal is owned by core base transitions.
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
  complaints.assert("The crouch follows its supported path and keeps its depth, heels and trunk direction");
}
