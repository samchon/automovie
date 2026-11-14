import {
  type IAutoMovieResolvedBone,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type { AutoMovieHumanoidBone } from "@automovie/interface";
import { HumanFoot } from "@automovie/motions";

import type { motionComplaints } from "./motionComplaints";
import { motionHumanBody } from "./motionHumanBody";
import { motionHumanSignature as M } from "./motionHumanSignature";

/**
 * The reading of a crouch's signature over some of its rows, which the
 * crouch signature specs share: the held knee flexion, the heels, the
 * centre of mass's margin inside the feet and the trunk's inclination, each
 * checked against its bound, and the quiet-stance calibration of every body
 * the rows stand on, since the trunk's reading stands on it. The bounds and
 * their sources are stated on the specs.
 *
 * Each row stands on the body the covering of all the crouch's rows
 * (`motionCrouchSignature.ROWS`) gives it, so a split reads every cell on the
 * body the whole reading would, and the splits together calibrate every
 * body of `motionHumanBody.EXTREMES`, each standing in some row.
 *
 * @param complaints The gatherer the checks are written to.
 * @param rows The crouch rows to read, a subset of `motionCrouchSignature.ROWS`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read, on which bodies and where the bounds and their sources are stated.
 * @evidence contracts/development/implementation.md#principled-implementation Each row is staged through the shared signature harness and read off the displayed joints, soles and centre of mass over the held span from the law's `lowest` to its `ascend`, every bound checked into the gatherer.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over the cells, one block per bound in the order the specs state them, then the calibration.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The bounds are the spec's own, unchanged by the split; the cells are the covering of all rows, filtered, never a covering of the subset.
 * @evidence contracts/development/implementation.md#efficient-algorithms One staged film per cell, read at the signature harness's held rate.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by the crouch signature specs, so the reading is written once.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing; each film is dropped after its cell.
 */
export function motionCrouchSignature(
  complaints: motionComplaints.IGatherer,
  rows: readonly string[],
): void {
  const read: Set<motionHumanBody.Name> = new Set();
  for (const { row, name } of M.cells(motionCrouchSignature.ROWS)) {
    if (!rows.includes(row)) continue;
    read.add(name);
    const cell: string = `crouch ${row} ${name}`;
    const s: M.IStaged = M.stage("crouch", row, name);
    const from: number = M.event(s, "lowest")!;
    const to: number = M.event(s, "ascend")!;
    const ts: number[] = M.times(from, to, M.HELD);
    const knee: number = M.mean(
      ts,
      (t: number): number => (M.knee(s, t, "left") + M.knee(s, t, "right")) / 2,
    );
    const full: boolean = row === "depth=full";
    complaints.check(
      `${cell}: held knee flexion ${knee.toFixed(1)} deg outside ${full ? "[120, 180]" : "[40, 110]"} (Hemmerich et al. 2006; Escamilla 2001; provisional)`,
      full ? knee >= 120 : knee >= 40 && knee <= 110,
    );
    // A full squat raises the heels unless told otherwise (the law's
    // default); every other row is a partial squat.
    const raised: boolean = row === "heels=up" || full;
    const model: resolveAutoMovieCenterOfMass.IModel =
      resolveAutoMovieCenterOfMass(s.body.skeleton, s.body.profile);
    let low: number = Infinity;
    let high: number = -Infinity;
    let margin: number = Infinity;
    for (const t of ts) {
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = M.bones(
        s,
        t,
      );
      for (const side of ["left", "right"] as const) {
        const heel: number = HumanFoot.sockets(s.body, bones, side)[0]!.point.y;
        low = Math.min(low, heel);
        high = Math.max(high, heel);
      }
      margin = Math.min(
        margin,
        resolveAutoMovieCenterOfMass.margin(
          resolveAutoMovieCenterOfMass.place(model, bones),
          HumanFoot.base(s.body, bones),
        ),
      );
    }
    complaints.check(
      raised
        ? `${cell}: the heels stand ${(low * 1000).toFixed(0)} mm off the floor, at least 30 expected (provisional)`
        : `${cell}: the heels stand up to ${(high * 1000).toFixed(0)} mm off the floor, within 20 expected (provisional)`,
      raised ? low >= 0.03 : high <= M.CONTACT,
    );
    complaints.check(
      `${cell}: the centre of mass's margin inside the feet is ${(margin * 1000).toFixed(0)} mm while held, not negative expected (static equilibrium)`,
      margin >= 0,
    );
    // Relative to the body's own quiet stance, the reading the trunk's
    // landmarks give a standing body.
    const lean: number =
      M.mean(ts, (t: number): number => M.trunk(s, t)) - M.upright(name);
    complaints.check(
      `${cell}: mean trunk inclination ${lean.toFixed(1)} deg ahead of the quiet stance while held, at least ${full ? 5 : 0} expected (Hemmerich et al. 2006; provisional)`,
      // A tenth of a degree for the reading's own sampling noise.
      lean >= (full ? 5 : 0) - 0.1,
    );
  }
  for (const name of read)
    for (const c of M.calibrate(name)) complaints.check(c, false);
}

/**
 * Companion lists of {@link motionCrouchSignature}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each list states its rows.
 * @evidence contracts/development/design.md#principled-representation The rows of the crouch and of each split as data.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Four row lists.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The rows are the spec's own, none dropped: the splits together are all of them.
 */
export namespace motionCrouchSignature {
  /** Every row of the crouch read, in the order the cells are covered. */
  export const ROWS: readonly string[] = [
    "default",
    "depth=partial",
    "depth=full",
    "heels=flat",
    "heels=up",
  ];

  /** The shallower depths: the law's default and a partial squat. */
  export const DEPTH: readonly string[] = ["default", "depth=partial"];

  /** The full squat. */
  export const FULL: readonly string[] = ["depth=full"];

  /** The heels: flat and raised. */
  export const HEELS: readonly string[] = ["heels=flat", "heels=up"];
}
