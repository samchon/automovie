import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanAudit } from "@automovie/motions";

import type { motionComplaints } from "./motionComplaints";
import { motionHumanBody } from "./motionHumanBody";
import { motionHumanSignature as M } from "./motionHumanSignature";

/**
 * The reading of a punch's signature on one body, which the punch
 * signature tests share: the arm at impact, the fist's peak speed, the
 * delivery's time, the contact of a punch thrown to hit, the guards' range
 * and the trunk at impact, each checked against its bound, and the body's
 * calibration. The bounds and their sources are stated on the tests.
 *
 * @param complaints The gatherer the checks are written to.
 * @param name The body.
 * @param rows The punch rows staged on it.
 * @param contact Whether this spec also owns the straight contact continuity and rear shoulder checks.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read, on what and where the bounds and their sources are stated.
 * @evidence contracts/development/implementation.md#principled-implementation Each row is staged through the shared signature harness and read off the displayed joints of both performers at the punch's own events, every bound checked into the gatherer so a failing cell does not hide the others.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over the rows, one block per bound in the order the tests state them, then the body's calibration.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The elbow bands are compared within the stated read-back resolution, nothing else is loosened; the punching hand is the one that travels farther, read from the film, not the row.
 * @evidence contracts/development/implementation.md#efficient-algorithms One film per reach branch. The two marker speeds share a single 240 Hz series, and every fourth sample of the same series supplies the early-contact check.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The straight, bent and hit specs share the same absolute signature bounds.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing; each film is dropped after its row.
 */
export function motionPunchSignature(
  complaints: motionComplaints.IGatherer,
  name: motionHumanBody.Name,
  rows: readonly string[],
  contact: boolean = false,
): void {
  const partner: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  for (const row of rows) {
    const cell: string = `punch ${row} ${name}`;
    const s: M.IStaged = M.stage("punch", row, name);
    const launch: number = M.event(s, "launch")!;
    const impact: number = M.event(s, "impact")!;
    // The punching hand travels farther from launch to impact.
    const first: ReturnType<typeof M.bones> = M.bones(s, launch);
    const last: ReturnType<typeof M.bones> = M.bones(s, impact);
    const travel = (side: AutoMovieHumanSide): number =>
      Vector3.distance(
        first.get(`${side}Hand`)!.worldPosition,
        last.get(`${side}Hand`)!.worldPosition,
      );
    const side: AutoMovieHumanSide =
      travel("left") > travel("right") ? "left" : "right";
    const elbow: number = M.flexion(
      last.get(`${side}UpperArm`)!.worldPosition,
      last.get(`${side}LowerArm`)!.worldPosition,
      last.get(`${side}Hand`)!.worldPosition,
    );
    const bent: boolean =
      row === "technique=hook" || row === "technique=uppercut";
    const T: number = motionPunchSignature.TOLERANCE;
    complaints.check(
      `${cell}: elbow flexion ${elbow.toFixed(2)} deg at impact (${side}), ${bent ? "[60, 120]" : "at most 30"} expected within ${T} deg (provisional)`,
      bent ? elbow >= 60 - T && elbow <= 120 + T : elbow <= 30 + T,
    );
    const rear: boolean = contact && row === "hand=rear";
    const isHit: boolean = row === "accuracy=hit";
    const series: ISignature = readFlight(
      s,
      side,
      launch,
      impact,
      rear,
      isHit ? partner : undefined,
    );
    const peak: number = series.handPeak;
    complaints.check(
      `${cell}: peak fist speed ${peak.toFixed(2)} m/s, [5, 15] expected (Kimm and Thiel 2015; provisional)`,
      peak >= 5 && peak <= 15,
    );
    if (contact)
      checkStraightContact(
        complaints,
        cell,
        s,
        side,
        impact,
        peak,
        series.shoulderPeak,
        rear,
      );
    complaints.check(
      `${cell}: launch to impact ${(impact - launch).toFixed(3)} s, [0.15, 0.6] expected (provisional)`,
      impact - launch >= 0.15 && impact - launch <= 0.6,
    );
    if (isHit) {
      const face: IAutoMovieVector3 = M.region(s, "b", partner, "face", impact);
      const gap: number = Vector3.distance(
        face,
        last.get(`${side}Hand`)!.worldPosition,
      );
      complaints.check(
        `${cell}: the hand is ${(gap * 1000).toFixed(0)} mm from the partner's face at impact, within a hand length (${(s.body.measure.hand * 1000).toFixed(0)} mm) expected`,
        gap <= s.body.measure.hand,
      );
      complaints.check(
        `${cell}: the hand comes within ${(series.earlyGap * 1000).toFixed(0)} mm of the face at ${series.earlyTime.toFixed(2)} s, a tenth of a second or more before impact; farther than ${(s.body.measure.hand * 1000).toFixed(0)} mm (a hand length) expected`,
        series.earlyGap > s.body.measure.hand,
      );
    }
    const set: number = M.event(s, "set") ?? launch;
    const clear: number = M.apart(s, set, partner);
    complaints.check(
      `${cell}: in the guard (${set.toFixed(2)} s) the two fighters stand ${(clear * 1000).toFixed(0)} mm apart (least joint-to-body distance), not inside each other expected`,
      clear >= 0,
    );
    const lean: number = M.trunk(s, impact);
    complaints.check(
      `${cell}: trunk inclination ${lean.toFixed(1)} deg at impact, at least -2 expected (provisional)`,
      lean >= -2,
    );
  }
  for (const c of M.calibrate(name)) complaints.check(c, false);
}

interface ISignature {
  handPeak: number;
  shoulderPeak: number;
  earlyGap: number;
  earlyTime: number;
}

interface IMarkers {
  hand: IAutoMovieVector3;
  shoulder: IAutoMovieVector3 | undefined;
}

/** One sequence supplies both central differences and the early clearance. */
function readFlight(
  staged: M.IStaged,
  side: AutoMovieHumanSide,
  launch: number,
  impact: number,
  rear: boolean,
  partner: IAutoMovieMotionHumanBody | undefined,
): ISignature {
  // Keep the signature's 240 Hz stencil and its 60 Hz early-contact read.
  const contactRate: number = 60;
  const speedRate: number = 240;
  const stride: number = speedRate / contactRate;
  const duration: number = staged.film.performance.duration;
  const start: number = Math.max(1 / speedRate, launch);
  const count: number = M.times(
    start,
    Math.min(impact, duration - 1 / speedRate),
    speedRate,
  ).length;
  const out: ISignature = {
    handPeak: 0,
    shoulderPeak: 0,
    earlyGap: Infinity,
    earlyTime: launch,
  };
  if (count === 0) return out;
  const time = (k: number): number =>
    Math.min(duration, Math.max(0, start + k / speedRate));
  const marks = (t: number): IMarkers => {
    const bones: ReturnType<typeof M.bones> = M.bones(staged, t);
    return {
      hand: bones.get(`${side}Hand`)!.worldPosition,
      shoulder: rear ? bones.get(`${side}UpperArm`)!.worldPosition : undefined,
    };
  };
  let previous: IMarkers = marks(time(-1));
  let current: IMarkers = marks(time(0));
  for (let k: number = 0; k < count; k++) {
    const t: number = time(k);
    const after: number = time(k + 1);
    const next: IMarkers = marks(after);
    const dt: number = after - time(k - 1);
    out.handPeak = Math.max(
      out.handPeak,
      Vector3.distance(previous.hand, next.hand) / dt,
    );
    if (previous.shoulder !== undefined && next.shoulder !== undefined)
      out.shoulderPeak = Math.max(
        out.shoulderPeak,
        Vector3.distance(previous.shoulder, next.shoulder) / dt,
      );
    if (partner !== undefined && k % stride === 0 && t <= impact - 0.1 + 1e-9) {
      // Launch is within the scene's settled guard, after the first stencil.
      const face: IAutoMovieVector3 = M.region(staged, "b", partner, "face", t);
      const gap: number = Vector3.distance(current.hand, face);
      if (gap < out.earlyGap) {
        out.earlyGap = gap;
        out.earlyTime = t;
      }
    }
    previous = current;
    current = next;
  }
  return out;
}

/** Check straight-arm continuity at impact and rear shoulder participation. */
function checkStraightContact(
  complaints: motionComplaints.IGatherer,
  cell: string,
  staged: M.IStaged,
  side: AutoMovieHumanSide,
  impact: number,
  handPeak: number,
  shoulderPeak: number,
  rear: boolean,
): void {
  const maximum: number = AutoMovieMotionHumanAudit.LIMITS.jump;
  // Even at the audit's highest accepted speed, the full stencil covers
  // at most half the jump limit. It detects a branch switch without asking
  // a perfectly legitimate fast elbow to hold still at impact.
  const h: number = maximum / (4 * AutoMovieMotionHumanAudit.LIMITS.speed);
  const before: IAutoMovieVector3 = M.joint(
    staged,
    impact - h,
    `${side}LowerArm`,
  );
  const after: IAutoMovieVector3 = M.joint(
    staged,
    impact + h,
    `${side}LowerArm`,
  );
  const jump: number = Math.hypot(
    after.x - before.x,
    after.y - before.y,
    after.z - before.z,
  );
  complaints.check(
    `${cell}: elbow displacement ${jump * 1000} mm across impact, at most ${maximum * 1000} mm`,
    jump <= maximum,
  );

  if (rear) {
    // Cheraghi et al. 2014, Table 1 (DOI 10.18869/acadpub.aassjournal.2.2.39).
    // The lowest observed acromion peak over the highest observed fist
    // peak is a conservative dimensionless lower bound. Rig joint centres
    // approximate those landmarks. The study did not measure trunk rotation.
    const ratio: number = shoulderPeak / handPeak;
    const least: number = 2.1 / 9.4;
    complaints.check(
      `${cell}: relative shoulder peak ${ratio.toFixed(3)}, at least ${least.toFixed(3)} expected`,
      ratio >= least,
    );
  }
}

/**
 * Companion lists and tolerance of {@link motionPunchSignature}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each member states what it holds and, for the tolerance, its measured basis.
 * @evidence contracts/development/design.md#principled-representation The rows of each split as data and one named tolerance, read by every spec.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The distinct reach branches and one tolerance.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The tolerance is one constant with its basis, not a margin in each bound.
 */
export namespace motionPunchSignature {
  /**
   * The read-back resolution of an elbow angle at a band's edge, degrees.
   * An arm planned exactly at a band's end (a punch whose step is capped
   * plans its arm at the band's longest reach) read 59.99 degrees from the
   * posed joints against its planned 60 on the average man's uppercut,
   * though the plan's limb lengths equal the rig's rest joints' distances on
   * all four extreme bodies (measured): the hundredth is the angle's
   * read-back. 0.1 is ten times that, so a read-back never fails a planned
   * edge, and a hundredth of the narrowest band's width (the straight's 30),
   * so no plan outside its band passes.
   */
  export const TOLERANCE: number = 0.1;

  /** The straight punch of each hand named. */
  export const HANDS: readonly string[] = ["hand=lead", "hand=rear"];

  /** The straight punch thrown to hit. */
  export const HIT: readonly string[] = ["accuracy=hit"];
  /** The bent-arm punches. */
  export const BENT: readonly string[] = [
    "technique=hook",
    "technique=uppercut",
  ];
}
