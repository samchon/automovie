import type { IAutoMovieVector3 } from "@automovie/interface";
import { HumanFoot, type IHumanBody } from "@automovie/motions";

import type { motionComplaints } from "./motionComplaints";
import { motionHumanBody } from "./motionHumanBody";
import { motionHumanSignature as M } from "./motionHumanSignature";

/**
 * The reading of a kick's signature on one body, which the kick signature
 * specs share: the knee's chamber and snap, the foot's peak speed, the
 * support foot, the hip, the delivery's time, the target, the guards'
 * range and the foot's height, each checked against its bound. The bounds
 * and their sources are stated on the specs.
 *
 * @param complaints The gatherer the checks are written to.
 * @param name The body.
 * @param rows The kick rows staged on it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read, on what and where the bounds and their sources are stated.
 * @evidence contracts/development/implementation.md#principled-implementation Each row is staged through the shared signature harness and read off the displayed joints and soles of both performers at the kick's own events, every bound checked into the gatherer.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over the rows, one block per bound in the order the specs state them.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The bounds are the spec's own, unchanged by the split; the kicking leg is the one whose foot is higher at impact, read from the film.
 * @evidence contracts/development/implementation.md#efficient-algorithms One staged film per row and 120 samples a second for the support foot.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by the kick signature specs, so the reading is written once.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing; each film is dropped after its row.
 */
export function motionKickSignature(
  complaints: motionComplaints.IGatherer,
  name: motionHumanBody.Name,
  rows: readonly string[],
): void {
  const partner: IHumanBody = motionHumanBody("m-average");
  for (const row of rows) {
    const cell: string = `kick ${row} ${name}`;
    const s: M.IStaged = M.stage("kick", row, name);
    const launch: number = M.event(s, "launch")!;
    const chamber: number = M.event(s, "chamber")!;
    const impact: number = M.event(s, "impact")!;
    const height = (side: "left" | "right"): number =>
      M.joint(s, impact, `${side}Foot`).y;
    const side: "left" | "right" =
      height("left") > height("right") ? "left" : "right";
    const support: "left" | "right" = side === "left" ? "right" : "left";
    const folded: number = M.knee(s, chamber, side);
    const snapped: number = M.knee(s, impact, side);
    complaints.check(
      `${cell}: the kicking knee (${side}) is folded ${folded.toFixed(1)} deg at chamber and ${snapped.toFixed(1)} at impact, at least 60 then at most 45 expected (Kim et al. 2010; provisional)`,
      folded >= 60 && snapped <= 45,
    );
    const peak: number = M.speed(s, `${side}Foot`, launch, impact);
    complaints.check(
      `${cell}: peak foot speed ${peak.toFixed(2)} m/s, [6, 20] expected (Kim et al. 2010; provisional)`,
      peak >= 6 && peak <= 20,
    );
    let hopped: number = 0;
    for (const t of M.times(chamber, impact, 120))
      if (!M.bears(s, t, support)) hopped++;
    complaints.check(
      `${cell}: the support foot (${support}) is off the floor at ${hopped} instants of 120 a second from chamber to impact`,
      hopped === 0,
    );
    const hip: number = M.hip(s, impact, side);
    complaints.check(
      `${cell}: the kicking hip (${side}) is flexed ${hip.toFixed(1)} deg at impact, at least 50 expected (Kim et al. 2010; provisional)`,
      hip >= 50,
    );
    complaints.check(
      `${cell}: launch to impact ${(impact - launch).toFixed(3)} s, [0.2, 1.0] expected (Kim et al. 2010; provisional)`,
      impact - launch >= 0.2 && impact - launch <= 1.0,
    );
    const ribs: IAutoMovieVector3 = M.region(
      s,
      "b",
      partner,
      "ribsLeft",
      impact,
    );
    const ankle: IAutoMovieVector3 = M.joint(s, impact, `${side}Foot`);
    const reach: number = Math.hypot(
      ribs.x - ankle.x,
      ribs.y - ankle.y,
      ribs.z - ankle.z,
    );
    const heel: IAutoMovieVector3 = HumanFoot.offset(s.body, side, "heel");
    const toe: IAutoMovieVector3 = HumanFoot.offset(s.body, side, "toe");
    const footLength: number = Math.hypot(
      toe.x - heel.x,
      toe.y - heel.y,
      toe.z - heel.z,
    );
    complaints.check(
      `${cell}: the kicking ankle is ${(reach * 1000).toFixed(0)} mm from the partner's ribs at impact, within a foot length (${(footLength * 1000).toFixed(0)} mm) expected`,
      reach <= footLength,
    );
    const set: number = M.event(s, "set") ?? launch;
    const clear: number = M.apart(s, set, partner);
    complaints.check(
      `${cell}: in the guard (${set.toFixed(2)} s) the two fighters stand ${(clear * 1000).toFixed(0)} mm apart (least joint-to-body distance), not inside each other expected`,
      clear >= 0,
    );
    const foot: IAutoMovieVector3 = M.joint(s, impact, `${side}Foot`);
    complaints.check(
      `${cell}: the kicking foot is ${(foot.y * 1000).toFixed(0)} mm high at impact, at least half the hip height (${((s.body.measure.hipHeight / 2) * 1000).toFixed(0)} mm) expected (provisional)`,
      foot.y >= s.body.measure.hipHeight / 2,
    );
  }
}

/**
 * Companion lists of {@link motionKickSignature}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each list states its rows.
 * @evidence contracts/development/design.md#principled-representation The rows of each split as data.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Three row lists.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The rows are the spec's own, none dropped.
 */
export namespace motionKickSignature {
  /** The round kick, as the row leaves it and as the technique names it. */
  export const ROUND: readonly string[] = ["default", "technique=round"];

  /** The push kick. */
  export const PUSH: readonly string[] = ["technique=push"];

  /** The legs: the lead and the rear. */
  export const LEGS: readonly string[] = ["leg=lead", "leg=rear"];
}
