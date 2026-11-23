import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanAuditMotion,
} from "@automovie/interface";
import { HumanFoot, HumanPhysics } from "@automovie/motions/internal";

import type { motionComplaints } from "./motionComplaints";
import type { motionHumanBody } from "./motionHumanBody";
import { motionHumanSignature as M } from "./motionHumanSignature";

/**
 * A crouch lowers and holds on the expected supports, with a trunk inclined relative to the body's own quiet stance.
 *
 * Scenarios:
 * 1. Default and explicit partial depth give 40–110° of held knee flexion. Full depth gives at least 120° (Hemmerich et al. 2006, Escamilla 2001; provisional bounds).
 * 2. Flat heels stay within 20 mm of the floor from lowering to return. Raised heels and the full-depth default stand at least 30 mm above the floor in the held span (provisional).
 * 3. The held trunk inclines forward from quiet stance, at least 5° at full depth (Hemmerich et al. 2006; provisional). Quiet stance stays within 3° of vertical (Kendall et al. 2005).
 * 4. These planted actions omit balance, so none enters the balance audit. The opt-in audit owns that separate physical check.
 *
 * @param complaints The test's geometry findings.
 * @param crouch The actual acted film and its body.
 * @param row The authored branch named in a measure.
 * @param name The body whose quiet stance is the reference.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the measured phases, both heel modes, literature windows and balance gate.
 * @evidence contracts/development/implementation.md#principled-implementation The knee angles come from the cited studies. The actual heel sockets and the same rig at its quiet entry supply the geometric reference for heel lift and trunk inclination.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Two heel sockets contribute to one relevant extreme and the held frames supply the two segment readings.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the original heel sampling intervals, angle limits and judge gate.
 * @evidence contracts/development/implementation.md#efficient-algorithms Reads the displayed pose once per requested instant, shared by both heel sockets or the held geometric measurements.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the caller's actual film for its quiet entry and held posture.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The implementation retains only complaint text after each measurement.
 */
export function motionCrouchSignature(
  complaints: motionComplaints.IGatherer,
  crouch: M.IStaged,
  row: string,
  name: motionHumanBody.Name,
): void {
  const label: string = `${name} crouch ${row}`;
  const lowest: number = M.event(crouch, "lowest")!;
  const ascend: number = M.event(crouch, "ascend")!;
  const held: number[] = M.times(lowest, ascend, M.HELD);
  const full: boolean = row === "depth=full";
  const raised: boolean = full || row.endsWith("heels=up");
  complaints.check(
    `${label}: no omitted balance enters the balance audit`,
    !crouch.film
      .segments("a")
      .some((span: IAutoMovieMotionHumanAuditMotion.ISpan): boolean =>
        HumanPhysics.judged(span),
      ),
  );

  // Distinct sockets preserve toe pivots and the clearance of each heel.
  const footTimes: number[] = raised
    ? held
    : M.times(0, crouch.film.duration, M.HELD);
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
  for (const side of SIDES) {
    const knee: number = M.mean(held, (t: number): number =>
      M.knee(crouch, t, side),
    );
    complaints.check(
      `${label}: held ${side} knee flexion ${knee.toFixed(1)}°, ${full ? "at least 120°" : "40–110°"}`,
      full ? knee >= 120 : knee >= 40 && knee <= 110,
    );
  }

  const upright: number = M.trunk(crouch, 0);
  complaints.check(
    `${label}: quiet entry inclines ${upright.toFixed(2)}°, within ${M.STANCE}° expected`,
    Math.abs(upright) <= M.STANCE,
  );
  const inclination: number =
    M.mean(held, (t: number): number => M.trunk(crouch, t)) - upright;
  const minimum: number = full ? 5 : 0;
  complaints.check(
    `${label}: trunk inclines ${inclination.toFixed(1)}° from quiet stance, at least ${minimum}° expected`,
    inclination >= minimum - ANGLE_READOUT,
  );
}

/** Both independent heel contacts. */
const SIDES: readonly AutoMovieHumanSide[] = ["left", "right"];

/** A tenth of a degree preserves the original signature reading's sampling tolerance. */
const ANGLE_READOUT: number = 0.1;
