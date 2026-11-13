import type { IAutoMovieVector3 } from "@automovie/interface";
import type { IHumanBody } from "@automovie/motions";

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
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read, on what and where the bounds and their sources are stated.
 * @evidence contracts/development/implementation.md#principled-implementation Each row is staged through the shared signature harness and read off the displayed joints of both performers at the punch's own events, every bound checked into the gatherer so a failing cell does not hide the others.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over the rows, one block per bound in the order the tests state them, then the body's calibration.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The elbow bands are compared within the stated read-back resolution, nothing else is loosened; the punching hand is the one that travels farther, read from the film, not the row.
 * @evidence contracts/development/implementation.md#efficient-algorithms One staged film per row and sixty samples for the early-contact read.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by the sixteen punch signature specs, so the reading is written once.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing; each film is dropped after its row.
 */
export function motionPunchSignature(
  complaints: motionComplaints.IGatherer,
  name: motionHumanBody.Name,
  rows: readonly string[],
): void {
  const partner: IHumanBody = motionHumanBody("m-average");
  for (const row of rows) {
    const cell: string = `punch ${row} ${name}`;
    const s: M.IStaged = M.stage("punch", row, name);
    const launch: number = M.event(s, "launch")!;
    const impact: number = M.event(s, "impact")!;
    // The punching hand travels farther from launch to impact.
    const travel = (side: "left" | "right"): number => {
      const a: IAutoMovieVector3 = M.joint(s, launch, `${side}Hand`);
      const b: IAutoMovieVector3 = M.joint(s, impact, `${side}Hand`);
      return Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
    };
    const side: "left" | "right" =
      travel("left") > travel("right") ? "left" : "right";
    const elbow: number = M.elbow(s, impact, side);
    const bent: boolean =
      row === "technique=hook" || row === "technique=uppercut";
    const T: number = motionPunchSignature.TOLERANCE;
    complaints.check(
      `${cell}: elbow flexion ${elbow.toFixed(2)} deg at impact (${side}), ${bent ? "[60, 120]" : "at most 30"} expected within ${T} deg (provisional)`,
      bent ? elbow >= 60 - T && elbow <= 120 + T : elbow <= 30 + T,
    );
    const peak: number = M.speed(s, `${side}Hand`, launch, impact);
    complaints.check(
      `${cell}: peak fist speed ${peak.toFixed(2)} m/s, [5, 15] expected (Kimm and Thiel 2015; provisional)`,
      peak >= 5 && peak <= 15,
    );
    complaints.check(
      `${cell}: launch to impact ${(impact - launch).toFixed(3)} s, [0.15, 0.6] expected (provisional)`,
      impact - launch >= 0.15 && impact - launch <= 0.6,
    );
    if (row === "accuracy=hit") {
      const face: IAutoMovieVector3 = M.region(s, "b", partner, "face", impact);
      const hand: IAutoMovieVector3 = M.joint(s, impact, `${side}Hand`);
      const gap: number = Math.hypot(
        face.x - hand.x,
        face.y - hand.y,
        face.z - hand.z,
      );
      complaints.check(
        `${cell}: the hand is ${(gap * 1000).toFixed(0)} mm from the partner's face at impact, within a hand length (${(s.body.measure.hand * 1000).toFixed(0)} mm) expected`,
        gap <= s.body.measure.hand,
      );
      // Contact only at the contact event: before it the fist is clear.
      let early: number = Infinity;
      let when: number = launch;
      for (const t of M.times(launch, impact - 0.1, 60)) {
        const f = M.region(s, "b", partner, "face", t);
        const h = M.joint(s, t, `${side}Hand`);
        const d: number = Math.hypot(f.x - h.x, f.y - h.y, f.z - h.z);
        if (d < early) {
          early = d;
          when = t;
        }
      }
      complaints.check(
        `${cell}: the hand comes within ${(early * 1000).toFixed(0)} mm of the face at ${when.toFixed(2)} s, a tenth of a second or more before impact; farther than ${(s.body.measure.hand * 1000).toFixed(0)} mm (a hand length) expected`,
        early > s.body.measure.hand,
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

/**
 * Companion lists and tolerance of {@link motionPunchSignature}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each member states what it holds and, for the tolerance, its measured basis.
 * @evidence contracts/development/design.md#principled-representation The rows of each split as data and one named tolerance, read by every spec.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Four row lists and one tolerance.
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

  /** The straight punch as the row leaves it and as the technique names it. */
  export const STRAIGHT: readonly string[] = ["default", "technique=straight"];

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
