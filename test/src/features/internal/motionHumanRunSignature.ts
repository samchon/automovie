import type { motionComplaints } from "./motionComplaints";
import type { motionHumanBody } from "./motionHumanBody";
import { motionHumanSignature as M } from "./motionHumanSignature";

/**
 * The running signature of one body (the specs
 * `test_human_motion_signature_run_<body>`), read at each pace over the
 * steady middle half of a 6 m run.
 *
 * Bounds and sources:
 * - Trunk: a runner leans the trunk forward, more as speed grows
 *   (Thorstensson et al. 1984, Acta Physiol Scand 121:9; Novacheck 1998,
 *   Gait Posture 7:77). Bound: mean inclination in [2, 20] degrees (the
 *   limits provisional around the reported 5 to 15); jog <= run <= sprint
 *   within 0.5 degrees.
 * - Duty factor: running has a flight phase and no double support, its duty
 *   factor below one half (Alexander 1984, Int J Robot Res 3:49); stance is
 *   about 40 % of the cycle in running and 20 to 30 % in sprinting
 *   (Novacheck 1998). Bound: duty below 0.45, the sprint's below 0.35, at
 *   least one instant with neither foot down, never both feet down.
 * - Cadence: distance runners take about 160 to 180 steps a minute
 *   (Cavanagh and Kram 1989, Med Sci Sports Exerc 21:467; Heiderscheit et
 *   al. 2011, Med Sci Sports Exerc 43:296); sprinters about 4.5 steps a
 *   second (Mero, Komi and Gregor 1992, Sports Med 13:376). Bound: jog and
 *   run in [150, 200], the sprint at least 200 steps a minute.
 * - Centre of mass: running bounces on a compliant stance leg, so the centre
 *   of mass is lowest at mid-stance (Cavagna, Thys and Zamboni 1976, J
 *   Physiol 262:639). Bound: at the middle of each stance it stands at least
 *   5 mm below the mean of its two ends (provisional; the literature's
 *   stance drop is several centimetres).
 * - Knee: the stance knee flexes to about 40 to 45 degrees at mid-stance
 *   (Novacheck 1998). Bound: peak stance knee flexion in [25, 60] degrees
 *   (provisional limits around the reported value).
 *
 * The trunk is read as the line from the hip joints' midpoint to the
 * shoulder joints' midpoint, the trunk segment of the cited studies, and
 * the quiet stance must read within 3 degrees of vertical under it
 * (Kendall et al. 2005, ideal alignment; `motionHumanSignature.calibrate`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States every bound with its source and status, and how the specs share the reading.
 * @evidence contracts/development/implementation.md#principled-implementation Reads displayed joints, soles and the centre of mass over the steady middle half of each film; every bound is a cited running value or marked provisional.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One reader for one body: a pass per pace, then the check across paces.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every limit is marked provisional or cited; nothing is skipped.
 * @evidence contracts/development/implementation.md#efficient-algorithms Four films, read on 30 and 120 Hz grids.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Films and readings come from `motionHumanSignature`.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Keeps nothing once read.
 */
export namespace motionHumanRunSignature {
  /**
   * Read one body's runs into a gatherer.
   *
   * @param name The body.
   * @param complaints Receives every check.
   */
  export function read(
    name: motionHumanBody.Name,
    complaints: motionComplaints.IGatherer,
  ): void {
    const lean: Record<string, number> = {};
    for (const row of ["pace=jog", "pace=run", "pace=sprint", "default"]) {
      const cell: string = `run ${row} ${name}`;
      const sprint: boolean = row === "pace=sprint";
      const s: M.IStaged = M.stage("run", row, name);
      const from: number = 0.25 * s.film.duration;
      const to: number = 0.75 * s.film.duration;
      lean[row] = M.mean(M.times(from, to, 30), (t: number): number =>
        M.trunk(s, t),
      );
      complaints.check(
        `${cell}: mean trunk inclination ${lean[row]!.toFixed(2)} deg outside [2, 20] (Thorstensson et al. 1984; Novacheck 1998)`,
        lean[row]! >= 2 && lean[row]! <= 20,
      );
      const g: M.IGait = M.gait(s, from, to);
      complaints.check(
        `${cell}: duty factor ${g.duty.toFixed(3)} not below ${sprint ? 0.35 : 0.45} (Alexander 1984; Novacheck 1998)`,
        g.duty < (sprint ? 0.35 : 0.45),
      );
      complaints.check(
        `${cell}: cadence ${g.cadence.toFixed(0)} steps/min outside ${sprint ? "[200, inf)" : "[150, 200]"} (Cavanagh and Kram 1989; Mero et al. 1992)`,
        sprint ? g.cadence >= 200 : g.cadence >= 150 && g.cadence <= 200,
      );
      let flight: number = 0;
      let both: number = 0;
      const stances: { from: number; to: number; side: "left" | "right" }[] =
        [];
      const open: Partial<Record<"left" | "right", number>> = {};
      for (const t of M.times(from, to, 120)) {
        const l: boolean = M.bears(s, t, "left");
        const r: boolean = M.bears(s, t, "right");
        if (!l && !r) flight++;
        if (l && r) both++;
        for (const [side, down] of [
          ["left", l],
          ["right", r],
        ] as const) {
          if (down && open[side] === undefined) open[side] = t;
          if (!down && open[side] !== undefined) {
            stances.push({ from: open[side]!, to: t, side });
            delete open[side];
          }
        }
      }
      complaints.check(
        `${cell}: ${flight} instants of flight and ${both} of double support at 120 Hz (Alexander 1984)`,
        flight > 0 && both === 0,
      );
      // Only stances wholly inside the window; one cut by its start is not a
      // whole stance.
      for (const p of stances.filter(
        (p: { from: number; to: number }): boolean =>
          p.from > from + 1e-9 && p.to - p.from >= 0.05,
      )) {
        const mid: number = (p.from + p.to) / 2;
        const drop: number =
          (M.centre(s, p.from).y + M.centre(s, p.to).y) / 2 -
          M.centre(s, mid).y;
        complaints.check(
          `${cell}: the centre of mass at mid-stance (${p.side}, ${mid.toFixed(2)} s) stands ${(drop * 1000).toFixed(1)} mm below its ends, at least 5 mm expected (Cavagna et al. 1976)`,
          drop >= 0.005,
        );
        let peak: number = 0;
        for (const t of M.times(p.from, p.to, 120))
          peak = Math.max(peak, M.knee(s, t, p.side));
        complaints.check(
          `${cell}: peak stance knee flexion ${peak.toFixed(1)} deg (${p.side}, ${mid.toFixed(2)} s) outside [25, 60] (Novacheck 1998; provisional)`,
          peak >= 25 && peak <= 60,
        );
      }
    }
    complaints.check(
      `run ${name}: trunk inclination jog ${lean["pace=jog"]!.toFixed(2)}, run ${lean["pace=run"]!.toFixed(2)}, sprint ${lean["pace=sprint"]!.toFixed(2)} deg does not grow with speed (Thorstensson et al. 1984)`,
      lean["pace=jog"]! <= lean["pace=run"]! + 0.5 &&
        lean["pace=run"]! <= lean["pace=sprint"]! + 0.5,
    );
    for (const c of M.calibrate(name)) complaints.check(c, false);
  }
}
