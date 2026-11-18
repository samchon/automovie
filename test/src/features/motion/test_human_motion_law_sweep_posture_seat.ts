import type { IAutoMovieVector3 } from "@automovie/interface";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanRiseSignature } from "../internal/motionHumanRiseSignature";
import { motionHumanSignature as M } from "../internal/motionHumanSignature";
import { motionPostureBranches } from "../internal/motionPostureBranches";

/**
 * The three sitting modes retain the geometry of a chair at the body's
 * own popliteal height, on two stature extremes. Default seating, the
 * backrest and the slump retain contacts through the full audited path.
 * The shift and rise start seated at that same support.
 *
 * Bounds and sources:
 * - Seated: on a seat at popliteal height the thighs lie about level and the
 *   shanks stand about upright, the hip and the knee near a right angle
 *   (ANSI/HFES 100-2007, the seated reference posture). Bound: hip and knee
 *   flexion in [70, 110] degrees from `seated` to the end (provisional limits
 *   about the right angle).
 * - Back: sitting upright holds the trunk near vertical; leaning back
 *   reclines it. Bound: upright in [-10, 10] degrees, lean at least 5
 *   degrees behind the upright row (provisional). Slumping tilts the pelvis
 *   back and rounds the spine, which carries the head forward of the
 *   shoulders (Caneiro et al. 2010, Man Ther 15:54); the hip-to-shoulder line
 *   need not tip forward. Bound: the head joint at least 10 mm farther ahead
 *   of the shoulder joints than in the upright row (provisional).
 * - Descent: sitting down inclines the trunk forward to keep the centre of
 *   mass over the feet before the seat takes the weight, by about 30 to 45
 *   degrees (Kralj, Jaeger and Munih 1990, J Biomech 23:1123). Bound: peak
 *   inclination before `seatContact` in [15, 60] degrees (provisional
 *   limits).
 * - Feet: both feet stay on the floor throughout.
 * - Rise: the trunk flexes before seat-off and stands aligned on both
 *   feet, as measured in motionHumanRiseSignature.
 *
 * The trunk is read as the line from the hip joints' midpoint to the
 * shoulder joints' midpoint, the trunk segment of the cited studies, and
 * the quiet stance must read within 3 degrees of vertical under it
 * (Kendall et al. 2005, ideal alignment; `motionHumanSignature.calibrate`).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the real sit law on real bodies and reads displayed joints and soles; a perched or sunk sit, an upright back that leans, a descent with an upright trunk or a lifted foot fails with its cell, value, bound and source.
 * @evidence contracts/development/testing.md#independent-expectations The seated posture is the standard's, the descent Kralj et al.'s, every limit marked provisional.
 * @evidence contracts/development/testing.md#distinguishing-cases The large rig tests the rearward lean against its upright reference; the small rig tests the forward head displacement of the slump against its own upright reference.
 * @evidence contracts/development/testing.md#execution-ownership Four distinct scenes carry the lean, slump, shift and rise. The upright poses are measured on the exact sit prefixes of the latter two, and those prefixes also supply both quiet entries.
 * @evidence contracts/development/common.md#meaningful-documentation States every bound with its source and status.
 */
export function test_human_motion_law_sweep_posture_seat(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  const audited: Map<string, M.IStaged> = new Map();
  complaints.list.push(...motionPostureBranches(AUDITED, (film, [law, row, name]): void => {
    const staged: M.IStaged = { film, body: motionHumanBody(name), yaw: 0 };
    // A shift and a rise each start with the same upright sit. Its complete
    // seated segment provides the matched reference on that very rig.
    const back: string = law === "sit" ? row : "back=upright";
    audited.set(`${back} ${name}`, staged);
    if (law === "rise") motionHumanRiseSignature(staged, name, complaints);
  }));

  for (const name of BODIES) {
    const back: Record<string, number> = {};
    const forward: Record<string, number> = {};
    const variant: string = name === "m-large" ? "back=lean" : "back=slump";
    for (const row of ["back=upright", variant]) {
      const cell: string = `sit ${row} ${name}`;
      const s: M.IStaged | undefined = audited.get(`${row} ${name}`);
      if (s === undefined) continue; // The full audit reports a failed admission.
      const end: number = s.film.performance.segments("a")[0]!.end;
      if (row === "back=upright") {
        const stance: number = M.trunk(s, 0);
        complaints.check(`${cell}: quiet entry inclination ${stance}°, at most ${M.STANCE}°`,
          Math.abs(stance) <= M.STANCE);
      }
      const contact: number = M.event(s, "seatContact")!;
      const seated: number = M.event(s, "seated")!;
      const ts: number[] = M.times(seated, end, M.HELD);
      const heading: IAutoMovieVector3 = M.forward(s.yaw);
      let trunkSum: number = 0;
      let headSum: number = 0;
      for (const t of ts) {
        const bones: ReturnType<typeof M.bones> = M.bones(s, t);
        const neck: IAutoMovieVector3 = bones.get("neck")!.worldPosition;
        for (const side of ["left", "right"] as const) {
          const thigh: IAutoMovieVector3 = bones.get(`${side}UpperLeg`)!.worldPosition;
          const shin: IAutoMovieVector3 = bones.get(`${side}LowerLeg`)!.worldPosition;
          const foot: IAutoMovieVector3 = bones.get(`${side}Foot`)!.worldPosition;
          const hip: number = M.flexion(neck, thigh, shin);
          const knee: number = M.flexion(thigh, shin, foot);
          complaints.check(
            `${cell}: seated ${side} hip ${hip.toFixed(1)} and knee ${knee.toFixed(1)} deg at ${t.toFixed(3)} s, [70, 110] expected (ANSI/HFES 100-2007; provisional)`,
            hip >= 70 && hip <= 110 && knee >= 70 && knee <= 110,
          );
        }
        trunkSum += M.trunk(s, t);
        const head: IAutoMovieVector3 = bones.get("head")!.worldPosition;
        const left: IAutoMovieVector3 = bones.get("leftUpperArm")!.worldPosition;
        const right: IAutoMovieVector3 = bones.get("rightUpperArm")!.worldPosition;
        headSum += (head.x - (left.x + right.x) / 2) * heading.x +
          (head.z - (left.z + right.z) / 2) * heading.z;
      }
      back[row] = trunkSum / ts.length;
      forward[row] = headSum / ts.length;
      let peak: number = -Infinity;
      let lifted: number = 0;
      for (const t of M.times(0, end, M.HELD)) {
        if (t <= contact) peak = Math.max(peak, M.trunk(s, t));
        if (!M.bears(s, t, "left") || !M.bears(s, t, "right")) lifted++;
      }
      complaints.check(
        `${cell}: peak trunk inclination ${peak.toFixed(1)} deg before seat contact, [15, 60] expected (Kralj et al. 1990; provisional)`,
        peak >= 15 && peak <= 60,
      );
      complaints.check(
        `${cell}: a foot is off the floor at ${lifted} instants of ${M.HELD} a second`,
        lifted === 0,
      );
    }
    const upright: number | undefined = back["back=upright"];
    const leaned: number | undefined = back["back=lean"];
    const head: number | undefined = forward["back=upright"];
    const slumped: number | undefined = forward["back=slump"];
    if (upright !== undefined) {
      complaints.check(
        `sit ${name}: upright back ${upright.toFixed(1)} deg, [-10, 10] expected (provisional)`,
        upright >= -10 && upright <= 10,
      );
      if (leaned !== undefined)
        complaints.check(
          `sit ${name}: lean ${leaned.toFixed(1)} deg, at least 5 behind upright ${upright.toFixed(1)} expected (provisional)`,
          leaned <= upright - 5,
        );
    }
    if (head !== undefined && slumped !== undefined)
      complaints.check(
        `sit ${name}: slumped, the head stands ${(slumped * 1000).toFixed(0)} mm ahead of the shoulders against ${(head * 1000).toFixed(0)} upright, at least 10 mm more expected (Caneiro et al. 2010; provisional)`,
        slumped >= head + 0.01,
      );
  }
  complaints.assert("Sitting and rising keep their prescribed geometry and supports");
}

/** The existing full-interval checks of the distinct seat and exit branches. */
const AUDITED: readonly motionPostureBranches.Branch[] = [
  ["sit", "back=lean", "m-large"],
  ["sit", "back=slump", "f-small"],
  ["shift", "default", "m-large"],
  ["rise", "default", "f-small"],
];

/** The chair scales with the body, so the two stature limits bracket this geometry. */
const BODIES: readonly motionHumanBody.Name[] = ["f-small", "m-large"];
