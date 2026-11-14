import type { motionComplaints } from "./motionComplaints";
import type { motionHumanBody } from "./motionHumanBody";
import { motionHumanSignature as M } from "./motionHumanSignature";

/**
 * The sit-to-stand signature of one body (the specs
 * `test_human_motion_signature_rise_<body>`), from a seat at the body's own
 * popliteal height.
 *
 * - Flexion momentum: the trunk flexes forward before the buttocks leave the
 *   seat, to carry the centre of mass over the feet, peaking at about 30 to
 *   40 degrees (Schenkman, Berger, Riley, Mann and Hodge 1990, Phys Ther
 *   70:638). Bound: peak inclination before `seatOff` in [20, 60] degrees
 *   (provisional limits).
 * - Extension: the trunk returns upright as the knees extend. Bound: at
 *   `standing` the knees flexed at most 20 degrees and the trunk within
 *   [-10, 10] degrees (provisional).
 * - Feet: both feet stay on the floor from `seatOff` to `standing`.
 *
 * The trunk is read as the line from the hip joints' midpoint to the
 * shoulder joints' midpoint, and the quiet stance must read within 3 degrees
 * of vertical under it (Kendall et al. 2005; `motionHumanSignature.calibrate`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States every bound with its source and status, and how the specs share the reading.
 * @evidence contracts/development/implementation.md#principled-implementation Reads displayed joints and soles at the law's own events; the phases and the flexion are Schenkman et al.'s.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One reader for one body.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every limit is marked provisional; nothing is skipped.
 * @evidence contracts/development/implementation.md#efficient-algorithms One film, read on a 30 Hz grid.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Films and readings come from `motionHumanSignature`.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Keeps nothing once read.
 */
export namespace motionHumanRiseSignature {
  /**
   * Read one body's rise into a gatherer.
   *
   * @param name The body.
   * @param complaints Receives every check.
   */
  export function read(
    name: motionHumanBody.Name,
    complaints: motionComplaints.IGatherer,
  ): void {
    const cell: string = `rise default ${name}`;
    const s: M.IStaged = M.stage("rise", "default", name);
    const off: number = M.event(s, "seatOff")!;
    const standing: number = M.event(s, "standing")!;
    // The rise follows the sit that put the body on the seat.
    const start: number = M.event(s, "seated")!;
    let peak: number = -Infinity;
    for (const t of M.times(start, off, 30))
      peak = Math.max(peak, M.trunk(s, t));
    complaints.check(
      `${cell}: peak trunk inclination ${peak.toFixed(1)} deg before seat-off, [20, 60] expected (Schenkman et al. 1990; provisional)`,
      peak >= 20 && peak <= 60,
    );
    const knee: number = Math.max(
      M.knee(s, standing, "left"),
      M.knee(s, standing, "right"),
    );
    const lean: number = M.trunk(s, standing);
    complaints.check(
      `${cell}: at standing the knees are flexed ${knee.toFixed(1)} deg and the trunk ${lean.toFixed(1)} deg, at most 20 and within [-10, 10] expected (provisional)`,
      knee <= 20 && lean >= -10 && lean <= 10,
    );
    let lifted: number = 0;
    for (const t of M.times(off, standing, 30))
      if (!M.bears(s, t, "left") || !M.bears(s, t, "right")) lifted++;
    complaints.check(
      `${cell}: a foot is off the floor at ${lifted} instants of 30 a second while rising`,
      lifted === 0,
    );
    for (const c of M.calibrate(name)) complaints.check(c, false);
  }
}
