import type { motionComplaints } from "./motionComplaints";
import type { motionHumanBody } from "./motionHumanBody";
import { motionHumanSignature as M } from "./motionHumanSignature";

/**
 * The stair-walking signature of one body (the specs
 * `test_human_motion_signature_climb_stairs_<body>`): the stair law performed
 * up and down four stairs, step over step and step by step, leading with
 * either foot, and read against McFadyen and Winter's stair kinematics (1988,
 * J Biomech 21:733).
 *
 * - Ascent trunk: mean inclination from the first toe-off to the arrival in
 *   [2, 20] degrees (provisional limits; the studies report a few degrees to
 *   about ten).
 * - Ascent swing: peak knee flexion of the leg that swings to each tread at
 *   least 80 degrees (provisional lower limit).
 * - Ascent contact: the knee of the landing foot at each tread contact in
 *   [45, 80] degrees (provisional limits around the reported value, about 60).
 * - The step values apply to a foot that lands on another tread than the
 *   other foot; a foot brought level with the other (each second step of
 *   step-by-step, the closing step onto a landing) is a step-to and is not
 *   read.
 * - Descent: peak supporting knee flexion over each step at least 70 degrees
 *   (provisional lower limit).
 *
 * The trunk is read as the line from the hip joints' midpoint to the
 * shoulder joints' midpoint, and the quiet stance must read within 3 degrees
 * of vertical under it (Kendall et al. 2005; `motionHumanSignature.calibrate`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States every bound with its source and status, and how the specs share the reading.
 * @evidence contracts/development/implementation.md#principled-implementation Reads displayed joints at the law's own tread contacts; every bound is from the cited stair kinematics or marked provisional.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One reader over the rows of one body.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A row whose law names no tread contacts is a complaint, never skipped.
 * @evidence contracts/development/implementation.md#efficient-algorithms Seven films of one body, read at their tread contacts and on a 30 Hz grid for the trunk.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Films and readings come from `motionHumanSignature`.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Keeps nothing once read.
 */
export namespace motionHumanStairSignature {
  /** The rows read: both directions, both patterns and both lead feet. */
  export const ROWS: readonly string[] = [
    "default",
    "direction=up",
    "direction=down",
    "pattern=stepOverStep",
    "pattern=stepByStep",
    "lead=left",
    "lead=right",
  ];

  /**
   * Read one body's stair signature into a gatherer.
   *
   * @param name The body.
   * @param complaints Receives every check.
   */
  export function read(
    name: motionHumanBody.Name,
    complaints: motionComplaints.IGatherer,
  ): void {
    for (const row of ROWS) {
      const cell: string = `climbStairs ${row} ${name}`;
      const up: boolean = row !== "direction=down";
      const s: M.IStaged = M.stage("climbStairs", row, name);
      const offs: number[] = [];
      const ons: number[] = [];
      for (let i: number = 1; ; i++) {
        const off: number | undefined = M.event(s, `toeOff${i}`);
        const on: number | undefined = M.event(s, `treadContact${i}`);
        if (off === undefined || on === undefined) break;
        offs.push(off);
        ons.push(on);
      }
      if (offs.length === 0) {
        complaints.check(
          `${cell}: the law names its toe-offs and tread contacts`,
          false,
        );
        continue;
      }
      const end: number = M.event(s, "arrived") ?? s.film.duration;
      if (up) {
        const lean: number = M.mean(
          M.times(offs[0]!, end, 30),
          (t: number): number => M.trunk(s, t),
        );
        complaints.check(
          `${cell}: mean trunk inclination ${lean.toFixed(2)} deg on the way up outside [2, 20] (McFadyen and Winter 1988; provisional)`,
          lean >= 2 && lean <= 20,
        );
      }
      offs.forEach((off: number, i: number): void => {
        const on: number = ons[i]!;
        const mid: number = (off + on) / 2;
        const swing: "left" | "right" =
          M.sole(s, mid, "left").y - M.sole(s, off, "left").y >
          M.sole(s, mid, "right").y - M.sole(s, off, "right").y
            ? "left"
            : "right";
        const stance: "left" | "right" = swing === "left" ? "right" : "left";
        // Only a step to another tread is a stair step: a foot brought
        // level with the other on the same tread (step by step, or the
        // closing step onto a landing) is a step-to, which these values do
        // not describe.
        const rise: number = M.sole(s, on, swing).y - M.sole(s, on, stance).y;
        if (Math.abs(rise) < 0.05) return;
        let peak: number = 0;
        for (const t of M.times(off, on, 60))
          peak = Math.max(peak, M.knee(s, t, up ? swing : stance));
        if (up) {
          complaints.check(
            `${cell} step ${i + 1}: peak swing knee flexion (${swing}) ${peak.toFixed(1)} deg below 80 (McFadyen and Winter 1988; provisional)`,
            peak >= 80,
          );
          const landing: number = M.knee(s, on, swing);
          complaints.check(
            `${cell} step ${i + 1}: the landing knee (${swing}) is flexed ${landing.toFixed(1)} deg at tread contact, outside [45, 80] (McFadyen and Winter 1988; provisional)`,
            landing >= 45 && landing <= 80,
          );
        } else
          complaints.check(
            `${cell} step ${i + 1}: peak supporting knee flexion (${stance}) ${peak.toFixed(1)} deg below 70 (McFadyen and Winter 1988; provisional)`,
            peak >= 70,
          );
      });
    }
    for (const c of M.calibrate(name)) complaints.check(c, false);
  }
}
