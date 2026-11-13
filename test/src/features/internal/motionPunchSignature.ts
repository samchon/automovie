import type { IAutoMovieVector3 } from "@automovie/interface";

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
 */
export function motionPunchSignature(
  complaints: motionComplaints.IGatherer,
  name: motionHumanBody.Name,
  rows: readonly string[],
): void {
  const partner = motionHumanBody("m-average");
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
    complaints.check(
      `${cell}: elbow flexion ${elbow.toFixed(1)} deg at impact (${side}), ${bent ? "[60, 120]" : "at most 30"} expected (provisional)`,
      bent ? elbow >= 60 && elbow <= 120 : elbow <= 30,
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
      const face: IAutoMovieVector3 = M.region(
        s,
        "b",
        partner,
        "face",
        impact,
      );
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

/** Companion lists of {@link motionPunchSignature}. */
export namespace motionPunchSignature {
  /** The straight punches: the default, the straight technique, each hand and the hit. */
  export const STRAIGHT: readonly string[] = [
    "default",
    "technique=straight",
    "hand=lead",
    "hand=rear",
    "accuracy=hit",
  ];

  /** The bent-arm punches. */
  export const BENT: readonly string[] = [
    "technique=hook",
    "technique=uppercut",
  ];
}
