import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanSignature as M } from "../internal/motionHumanSignature";

/**
 * A walk looks like human walking: its kinematic signature, read on the
 * four extreme bodies at each pace over the steady middle half of a 3 m walk.
 *
 * Bounds and sources:
 * - Trunk: walking carries the trunk inclined forward a few degrees, and the
 *   inclination grows with speed (Thorstensson, Nilsson, Carlson and
 *   Zomlefer 1984, Acta Physiol Scand 121:9; Krebs et al. 1992, Phys Ther
 *   72:505, about 5 degrees). Bound: mean inclination in [0, 10] degrees,
 *   the upper limit provisional; slow <= normal <= fast within 0.5 degrees.
 * - Duty factor: walking keeps a foot down more than half the cycle, which
 *   is what separates it from running (Alexander 1984, Int J Robot Res 3:49);
 *   stance is about 60 % of the cycle at free speed (Perry and Burnfield
 *   2010, Gait Analysis, 2nd ed.). Bound: duty in [0.55, 0.75], the upper
 *   limit provisional for a slow walk; at least one instant of double
 *   support per step.
 * - Cadence: free walking is about 100 to 125 steps a minute (Perry and
 *   Burnfield 2010; mean about 113). Bound: the normal pace in [95, 130];
 *   slow < normal < fast.
 * - Centre of mass: walking vaults over a stiff stance leg, so the centre of
 *   mass is highest at mid single support and lowest in double support
 *   (Cavagna, Thys and Zamboni 1976, J Physiol 262:639); its vertical
 *   excursion is about 4 cm (Gard, Miff and Kuo 2004, Hum Mov Sci 22:597).
 *   Bound: at the middle of each single support the centre stands at least
 *   5 mm above the mean of its two ends (provisional, a quarter of the
 *   literature's 2 cm), and lies between the two ankles across the walk
 *   (Winter 1995, Gait Posture 3:193: the centre passes medial to the stance
 *   foot) and within 0.15 m of the stance ankle along it (provisional: the
 *   pendulum is vertical at mid-stance).
 * - Head: the head is held level for gaze in locomotion (Pozzo, Berthoz and
 *   Lefort 1990, Exp Brain Res 82:97). Bound: pitch in [-15, 25] degrees
 *   (provisional; down positive, the gaze a few metres ahead).
 *
 * The trunk is read as the line from the hip joints' midpoint to the
 * shoulder joints' midpoint, the trunk segment of the cited studies, and
 * the quiet stance must read within 3 degrees of vertical under it
 * (Kendall et al. 2005, ideal alignment; `motionHumanSignature.calibrate`).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the real walk law on real bodies and reads displayed bones; a trunk tipped back, a gait without double support, a wrong cadence, a centre of mass that dips at mid-stance or a head looking up fails with its cell, value, bound and source.
 * @evidence contracts/development/testing.md#independent-expectations Every bound is a cited human-gait value or marked provisional with its reason; none is read from the law.
 * @evidence contracts/development/testing.md#distinguishing-cases Three paces and the default on four bodies from the lightest to the heaviest.
 * @evidence contracts/development/testing.md#execution-ownership In memory; named `test_human_` because a film of fitted poses is costly, so the CI test job leaves it to local runs.
 * @evidence contracts/development/common.md#meaningful-documentation States every bound with its source and status.
 */
export function test_human_motion_signature_walk(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  for (const name of motionHumanBody.EXTREMES) {
    const lean: Record<string, number> = {};
    const cadence: Record<string, number> = {};
    for (const row of ["pace=slow", "pace=normal", "pace=fast", "default"]) {
      const cell: string = `walk ${row} ${name}`;
      const s: M.IStaged = M.stage("walk", row, name);
      const from: number = 0.25 * s.film.duration;
      const to: number = 0.75 * s.film.duration;
      const ts: number[] = M.times(from, to, 30);
      lean[row] = M.mean(ts, (t) => M.trunk(s, t));
      complaints.check(
        `${cell}: mean trunk inclination ${lean[row]!.toFixed(2)} deg outside [0, 10] (Thorstensson et al. 1984; Krebs et al. 1992)`,
        lean[row]! >= 0 && lean[row]! <= 10,
      );
      const g: M.IGait = M.gait(s, from, to);
      cadence[row] = g.cadence;
      complaints.check(
        `${cell}: duty factor ${g.duty.toFixed(3)} outside [0.55, 0.75] (Alexander 1984; Perry and Burnfield 2010)`,
        g.duty >= 0.55 && g.duty <= 0.75,
      );
      let doubles: number = 0;
      let singles: { from: number; to: number; side: "left" | "right" }[] = [];
      let open: { from: number; side: "left" | "right" } | undefined;
      for (const t of M.times(from, to, 120)) {
        const l: boolean = M.bears(s, t, "left");
        const r: boolean = M.bears(s, t, "right");
        if (l && r) doubles++;
        const side: "left" | "right" | undefined =
          l && !r ? "left" : r && !l ? "right" : undefined;
        if (open !== undefined && side !== open.side) {
          singles.push({ from: open.from, to: t, side: open.side });
          open = undefined;
        }
        if (side !== undefined && open === undefined) open = { from: t, side };
      }
      // Only supports wholly inside the window: one cut by the window's start
      // is not a whole support, and its middle is not mid-support.
      singles = singles.filter(
        (p) => p.from > from + 1e-9 && p.to - p.from >= 0.1,
      );
      complaints.check(
        `${cell}: ${doubles} instants of double support over ${g.strikes.length} strikes (Alexander 1984)`,
        doubles > 0,
      );
      for (const p of singles) {
        const mid: number = (p.from + p.to) / 2;
        const rise: number =
          M.centre(s, mid).y -
          (M.centre(s, p.from).y + M.centre(s, p.to).y) / 2;
        complaints.check(
          `${cell}: the centre of mass at mid single support (${p.side}, ${mid.toFixed(2)} s) stands ${(rise * 1000).toFixed(1)} mm above its ends, at least 5 mm expected (Cavagna et al. 1976)`,
          rise >= 0.005,
        );
        const c = M.centre(s, mid);
        const ankle = M.joint(s, mid, `${p.side}Foot`);
        const other = M.joint(
          s,
          mid,
          p.side === "left" ? "rightFoot" : "leftFoot",
        );
        const f = M.forward(s.yaw);
        const along: number = (c.x - ankle.x) * f.x + (c.z - ankle.z) * f.z;
        const lateral = (p: { x: number; z: number }): number =>
          p.x * f.z - p.z * f.x;
        const between: boolean =
          (lateral(c) - lateral(ankle)) * (lateral(c) - lateral(other)) <= 0;
        complaints.check(
          `${cell}: at mid single support (${p.side}, ${mid.toFixed(2)} s) the centre of mass is ${(along * 1000).toFixed(0)} mm along from the stance ankle (within 150 mm, provisional) and ${between ? "between" : "outside"} the ankles (Winter 1995)`,
          Math.abs(along) <= 0.15 && between,
        );
      }
      const pitch: number = M.mean(ts, (t) => M.head(s, t));
      complaints.check(
        `${cell}: mean head pitch ${pitch.toFixed(1)} deg outside [-15, 25] (Pozzo et al. 1990; provisional)`,
        pitch >= -15 && pitch <= 25,
      );
    }
    complaints.check(
      `walk ${name}: trunk inclination slow ${lean["pace=slow"]!.toFixed(2)}, normal ${lean["pace=normal"]!.toFixed(2)}, fast ${lean["pace=fast"]!.toFixed(2)} deg does not grow with speed (Thorstensson et al. 1984)`,
      lean["pace=slow"]! <= lean["pace=normal"]! + 0.5 &&
        lean["pace=normal"]! <= lean["pace=fast"]! + 0.5,
    );
    complaints.check(
      `walk ${name}: cadence slow ${cadence["pace=slow"]!.toFixed(0)}, normal ${cadence["pace=normal"]!.toFixed(0)}, fast ${cadence["pace=fast"]!.toFixed(0)} steps/min: normal outside [95, 130] or not rising with pace (Perry and Burnfield 2010)`,
      cadence["pace=normal"]! >= 95 &&
        cadence["pace=normal"]! <= 130 &&
        cadence["pace=slow"]! < cadence["pace=normal"]! &&
        cadence["pace=normal"]! < cadence["pace=fast"]!,
    );
  }
  for (const name of motionHumanBody.EXTREMES)
    for (const c of M.calibrate(name)) complaints.check(c, false);
  complaints.assert("the walk has the signature of human walking");
}
