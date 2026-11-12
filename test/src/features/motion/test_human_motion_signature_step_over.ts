import { HumanFoot } from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanSignature as M } from "../internal/motionHumanSignature";

/**
 * Stepping over a box looks like human obstacle crossing, on the four
 * extreme bodies leading with either foot over the sweep's box (0.3 m high,
 * 0.25 m deep, its near side 0.35 m ahead).
 *
 * Bounds and sources:
 * - Toe clearance: the lead foot clears an obstacle by about 0.1 m whatever
 *   its height (Patla and Rietdyk 1993, Gait Posture 1:45; Chou and
 *   Draganich 1998, J Biomech 31:685). Bound: the lowest sole point passes
 *   0.05 to 0.25 m above the box's top over its depth (provisional limits
 *   around the reported value); the trail foot at least 0.05 m.
 * - Lead limb: crossing raises the lead knee and hip far beyond level
 *   walking's swing; for an obstacle near 15 % of the stature the peak knee
 *   flexion is about 100 degrees and the hip's about 60 to 70 (Chou and
 *   Draganich 1997, J Biomech 30:331). Bound: peak lead knee flexion over
 *   the box in [75, 125] and peak lead hip flexion in [40, 95] degrees
 *   (provisional limits around the reported values).
 * - Trunk: crossing keeps the trunk upright or slightly forward (Chou,
 *   Kaufman, Brey and Draganich 2001, Gait Posture 13:17). Bound: mean
 *   inclination from lead toe-off to trail contact in [0, 15] degrees
 *   (provisional).
 *
 * The trunk is read as the line from the hip joints' midpoint to the
 * shoulder joints' midpoint, the trunk segment of the cited studies, and
 * the quiet stance must read within 3 degrees of vertical under it
 * (Kendall et al. 2005, ideal alignment; `motionHumanSignature.calibrate`).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the real step over on real bodies and reads displayed soles and joints; a foot that grazes or sails over the box, a stiff lead leg or a trunk tipped back fails with its cell, value, bound and source.
 * @evidence contracts/development/testing.md#independent-expectations Every bound is a cited obstacle-crossing value or marked provisional with its reason.
 * @evidence contracts/development/testing.md#distinguishing-cases Both lead feet and the default, each row on one body and every body in some row (`motionHumanSignature.cells`).
 * @evidence contracts/development/testing.md#execution-ownership In memory; named `test_human_` because a film of fitted poses is costly, so the CI test job leaves it to local runs.
 * @evidence contracts/development/common.md#meaningful-documentation States every bound with its source and status.
 */
export function test_human_motion_signature_step_over(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  const NEAR: number = 0.35;
  const FAR: number = 0.6;
  const TOP: number = 0.3;
  for (const { row, name } of M.cells(["default", "lead=left", "lead=right"])) {
    const cell: string = `stepOver ${row} ${name}`;
    const s: M.IStaged = M.stage("stepOver", row, name);
    const leadOff: number = M.event(s, "leadToeOff")!;
    const leadOn: number = M.event(s, "leadContact")!;
    const trailOff: number = M.event(s, "trailToeOff")!;
    const trailOn: number = M.event(s, "trailContact")!;
    const mid: number = (leadOff + leadOn) / 2;
    const lead: "left" | "right" =
      M.sole(s, mid, "left").y > M.sole(s, mid, "right").y ? "left" : "right";
    const trail: "left" | "right" = lead === "left" ? "right" : "left";
    const clearance = (
      side: "left" | "right",
      from: number,
      to: number,
    ): number => {
      let least: number = Infinity;
      for (const t of M.times(from, to, 120))
        for (const socket of HumanFoot.sockets(s.body, M.bones(s, t), side))
          if (socket.point.z >= NEAR && socket.point.z <= FAR)
            least = Math.min(least, socket.point.y - TOP);
      return least;
    };
    const leadClear: number = clearance(lead, leadOff, leadOn);
    complaints.check(
      `${cell}: the lead (${lead}) sole clears the box by ${(leadClear * 1000).toFixed(0)} mm, outside [50, 250] (Patla and Rietdyk 1993; Chou and Draganich 1998)`,
      leadClear >= 0.05 && leadClear <= 0.25,
    );
    const trailClear: number = clearance(trail, trailOff, trailOn);
    complaints.check(
      `${cell}: the trail (${trail}) sole clears the box by ${(trailClear * 1000).toFixed(0)} mm, at least 50 expected (Patla and Rietdyk 1993)`,
      trailClear >= 0.05,
    );
    let knee: number = 0;
    let hip: number = 0;
    for (const t of M.times(leadOff, leadOn, 60)) {
      knee = Math.max(knee, M.knee(s, t, lead));
      hip = Math.max(hip, M.hip(s, t, lead));
    }
    complaints.check(
      `${cell}: peak lead knee flexion ${knee.toFixed(1)} deg outside [75, 125] (Chou and Draganich 1997; provisional)`,
      knee >= 75 && knee <= 125,
    );
    complaints.check(
      `${cell}: peak lead hip flexion ${hip.toFixed(1)} deg outside [40, 95] (Chou and Draganich 1997; provisional)`,
      hip >= 40 && hip <= 95,
    );
    const lean: number = M.mean(M.times(leadOff, trailOn, M.HELD), (t) =>
      M.trunk(s, t),
    );
    complaints.check(
      `${cell}: mean trunk inclination ${lean.toFixed(2)} deg while crossing outside [0, 15] (Chou et al. 2001; provisional)`,
      lean >= 0 && lean <= 15,
    );
  }
  for (const name of motionHumanBody.EXTREMES)
    for (const c of M.calibrate(name)) complaints.check(c, false);
  complaints.assert("the step over has the signature of obstacle crossing");
}
