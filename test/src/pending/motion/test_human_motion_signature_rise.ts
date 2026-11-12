import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanSignature as M } from "../internal/motionHumanSignature";

/**
 * Rising from a chair looks like a human sit-to-stand, on the four extreme
 * bodies from a seat at the body's own popliteal height.
 *
 * Bounds and sources:
 * - Flexion momentum: the trunk flexes forward before the buttocks leave
 *   the seat, to carry the centre of mass over the feet, peaking at about 30
 *   to 40 degrees (Schenkman, Berger, Riley, Mann and Hodge 1990, Phys Ther
 *   70:638). Bound: peak inclination before `seatOff` in [20, 60] degrees
 *   (provisional limits).
 * - Extension: the trunk returns upright as the knees extend. Bound: at
 *   `standing` the knees flexed at most 20 degrees and the trunk within
 *   [-10, 10] degrees (provisional).
 * - Feet: both feet stay on the floor from `seatOff` to `standing`.
 *
 * The trunk is read as the line from the hip joints' midpoint to the
 * shoulder joints' midpoint, the trunk segment of the cited studies, and
 * the quiet stance must read within 3 degrees of vertical under it
 * (Kendall et al. 2005, ideal alignment; `motionHumanSignature.calibrate`).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the real rise law on real bodies and reads displayed joints and soles; a rise without forward flexion, one that ends bent or a lifted foot fails with its cell, value, bound and source.
 * @evidence contracts/development/testing.md#independent-expectations The phases and the flexion are Schenkman et al.'s; every limit is marked provisional.
 * @evidence contracts/development/testing.md#distinguishing-cases The default on four bodies from the lightest to the heaviest.
 * @evidence contracts/development/testing.md#execution-ownership In memory; named `test_human_` because a film of fitted poses is costly, so the CI test job leaves it to local runs.
 * @evidence contracts/development/common.md#meaningful-documentation States every bound with its source and status.
 */
export function test_human_motion_signature_rise(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  for (const name of motionHumanBody.EXTREMES) {
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
  }
  for (const name of motionHumanBody.EXTREMES)
    for (const c of M.calibrate(name)) complaints.check(c, false);
  complaints.assert("the rise has the signature of a sit-to-stand");
}
