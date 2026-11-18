import type { AutoMovieHumanSide, IAutoMovieMotionHumanAuditMotion } from "@automovie/interface";
import { HumanFoot, HumanPhysics } from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import type { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanSignature as M } from "../internal/motionHumanSignature";

/**
 * A crouch lowers and holds on the expected supports, with a trunk inclined relative to the body's own quiet stance.
 *
 * Scenarios:
 * 1. Default and explicit partial depth give 40–110° of held knee flexion. Full depth gives at least 120° (Hemmerich et al. 2006, Escamilla 2001; provisional bounds).
 * 2. Flat heels stay within 20 mm of the floor from lowering to return. Raised heels and the full-depth default stand at least 30 mm above the floor in the held span (provisional).
 * 3. The held trunk inclines forward from quiet stance, at least 5° at full depth (Hemmerich et al. 2006; provisional). Quiet stance stays within 3° of vertical (Kendall et al. 2005).
 * 4. These planted actions omit balance, so none enters the balance audit. The opt-in audit owns that separate physical check.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the measured phases, both heel modes, literature windows and balance gate.
 * @evidence contracts/development/testing.md#behavioral-verification Performs the real crouch through the public film and reads the displayed knees, trunk and each heel independently. A shallow full squat, a floating flat heel or an unrequested balance audit fails.
 * @evidence contracts/development/testing.md#independent-expectations The knee angles come from the cited squatting studies; the heel limits describe the two support modes, and the trunk direction is evaluated relative to a separate quiet stance.
 * @evidence contracts/development/testing.md#distinguishing-cases Default and explicit partial depth, full depth, explicit flat heel and explicit raised heel use four representative rigs. The full-flat refusal is verified by core base transitions.
 * @evidence contracts/development/testing.md#execution-ownership The discovered test prepares the real bodies and compares their in-memory motion without capture.
 */
export function test_human_motion_signature_crouch(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  const stance: Map<motionHumanBody.Name, number> = new Map();
  for (const { row, name } of M.cells(ROWS)) {
    const label: string = `${name} crouch ${row}`;
    const crouch: M.IStaged = M.stage("crouch", row, name);
    const lowest: number = M.event(crouch, "lowest")!;
    const ascend: number = M.event(crouch, "ascend")!;
    const held: number[] = M.times(lowest, ascend, M.HELD);
    const full: boolean = row === "depth=full";
    const raised: boolean = full || row === "heels=up";
    complaints.check(
      `${label}: no omitted balance enters the balance audit`,
      !crouch.film.segments("a").some(
        (span: IAutoMovieMotionHumanAuditMotion.ISpan): boolean => HumanPhysics.judged(span),
      ),
    );

    // Distinct sockets preserve toe pivots and the clearance of each heel.
    const footTimes: number[] = raised ? held : M.times(0, crouch.film.duration, M.HELD);
    let extreme: number = raised ? Infinity : -Infinity;
    for (const t of footTimes) {
      const bones: ReturnType<typeof M.bones> = M.bones(crouch, t);
      for (const side of SIDES) {
        const y: number = HumanFoot.sockets(crouch.body, bones, side)[0]!.point.y;
        extreme = raised ? Math.min(extreme, y) : Math.max(extreme, y);
      }
    }
    complaints.check(
      `${label}: extreme heel clearance ${(extreme * 1000).toFixed(1)} mm, ${raised ? "at least 30 mm held" : "within the 20 mm contact limit throughout"}`,
      raised ? extreme >= 0.03 : extreme <= M.CONTACT,
    );
    const knees: number = M.mean(
      held,
      (t: number): number => (M.knee(crouch, t, "left") + M.knee(crouch, t, "right")) / 2,
    );
    complaints.check(
      `${label}: held mean knee flexion ${knees.toFixed(1)}°, ${full ? "at least 120°" : "40–110°"}`,
      full ? knees >= 120 : knees >= 40 && knees <= 110,
    );

    let upright: number | undefined = stance.get(name);
    if (upright === undefined) {
      upright = M.trunk(M.stage("stand", "default", name), 1);
      stance.set(name, upright);
      complaints.check(
        `${name} quiet stance inclines ${upright.toFixed(2)}°, within ${M.STANCE}° expected`,
        Math.abs(upright) <= M.STANCE,
      );
    }
    const inclination: number =
      M.mean(held, (t: number): number => M.trunk(crouch, t)) - upright;
    const minimum: number = full ? 5 : 0;
    complaints.check(
      `${label}: trunk inclines ${inclination.toFixed(1)}° from quiet stance, at least ${minimum}° expected`,
      inclination >= minimum - ANGLE_READOUT,
    );
  }
  complaints.assert("a crouch keeps its depth, heel mode and trunk direction");
}

/** Each supported depth and heel selection, including the authored defaults. */
const ROWS: readonly string[] = ["default", "depth=partial", "depth=full", "heels=flat", "heels=up"];

/** Both independent heel contacts. */
const SIDES: readonly AutoMovieHumanSide[] = ["left", "right"];

/** A tenth of a degree preserves the original signature reading's sampling tolerance. */
const ANGLE_READOUT: number = 0.1;
