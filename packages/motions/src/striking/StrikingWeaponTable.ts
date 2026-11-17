import { hingedArmSwivel } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  IAutoMovieMotionHumanResolveHumanPosture,
  IAutoMovieSwivelNear,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * A striking limb's free course tabulated on the contact scan's own knots:
 * the capsule ends at `from + k * STEP`, each knot's limb fits continued
 * from the knot before it.
 *
 * A contact scan walks a weapon's course a hundred and twenty times a
 * second and every sample used to solve the striking limb cold, searching
 * its whole swivel circle again (measured in test_human_motion_hit_punch:
 * 112 poses at 12.8 ms, the bounded sweep of the arm's fit 0.72 s of the
 * spec's 2.33 s). Along one course the limb's fit a hundred and twentieth
 * of a second on lies beside the last one's, so the first knot is solved
 * cold and each later knot continues its predecessor's fit
 * (`IAutoMovieSwivelNear`), a refinement in place of a search. The table is
 * built in knot order from the first, so a knot's ends are a function of the
 * course alone, whoever reads them and in what order; a second between two
 * knots continues the knot before it, and a second before the first knot is
 * solved cold.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the knots, the continuation, its measured reason, why the result does not depend on read order and what a second off the knots or before them reads.
 * @evidence contracts/development/design.md#principled-representation One row a knot: the ends the scan reads and the fits' seeds the next knot continues.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The reader type, the knots' step and the table's constructor, used by `StrikingWeapon.capsules`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No pose is replayed or interpolated: every second read is the course's own goals fitted at that second.
 */
export namespace StrikingWeaponTable {
  /** The knots' spacing, seconds: the contact scan's own step (`HumanPerformanceContacts.STEP`), so the scan's samples from the weapon's first second are the knots themselves. */
  export const STEP: number = 1 / 120;

  /**
   * A course's capsule ends at a second, its limb fits continued where
   * `near` names them, with the seeds they were chosen at.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the reading, the continuation and the seeds returned.
   * @evidence contracts/development/design.md#principled-representation The posture resolver's own continuation types, so nothing is translated between the table and the fit.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One call signature, implemented by each striking law's chain.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The reader solves the second it is asked; it holds no table of its own.
   */
  export type IRead = (
    seconds: number,
    near?: IAutoMovieMotionHumanResolveHumanPosture.INear,
  ) => {
    ends: readonly IAutoMovieVector3[];
    seeds: IAutoMovieMotionHumanResolveHumanPosture.ISeeded["seeds"];
  };

  /**
   * A reader from a limb's own solve, which hands its seeds to a callback
   * (`StrikingWeapon.arm`, `StrikingWeapon.leg`).
   *
   * @param solve The limb's ends at a second, continued from `near` where given, reporting its fits' seeds through `kept`.
   * @returns The reader.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the adapted solve and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The solve's own seeds, read synchronously from its one call.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One closure a read.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A solve that reports no seeds leaves none, so the next knot is solved cold.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work beside the solve.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing is shared.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function reader(
    solve: (
      seconds: number,
      near: IAutoMovieMotionHumanResolveHumanPosture.INear | undefined,
      kept: (seeds: IAutoMovieMotionHumanResolveHumanPosture.ISeeded["seeds"]) => void,
    ) => readonly IAutoMovieVector3[],
  ): IRead {
    return (
      seconds: number,
      near?: IAutoMovieMotionHumanResolveHumanPosture.INear,
    ): ReturnType<IRead> => {
      let seeds: IAutoMovieMotionHumanResolveHumanPosture.ISeeded["seeds"] = {};
      const ends: readonly IAutoMovieVector3[] = solve(
        seconds,
        near,
        (found: IAutoMovieMotionHumanResolveHumanPosture.ISeeded["seeds"]): void => {
          seeds = found;
        },
      );
      return { ends, seeds };
    };
  }

  /**
   * Tabulate a course.
   *
   * @param read The course's reader.
   * @param from The first knot's second, the weapon's first live second.
   * @returns The capsule ends at a second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the reader, the first knot and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Numerical continuation along a path: each knot's fit starts from its predecessor's seed at the swivel search's own resolution (`hingedArmSwivel.RESOLUTION`), as a contact re-aim's later passes already continue their first. A fit the continuation cannot refine falls back inside the engine's own fit, not here.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Rows appended in knot order up to the knot asked; a read is a row, or one fit continued from a row.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A knot is recognised only when the scan's own expression `from + k * STEP` gives the second bit for bit; any other second is fitted itself.
   * @evidence contracts/development/implementation.md#efficient-algorithms One cold fit a table and one continued fit a knot up to the last second read; a knot read again is a lookup.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A knot's row is the course's value at that knot on one built geometry; the owner drops the table with the geometry (`StrikingWeapon.capsules`).
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The rows grow to the course's knots, a hundred and twenty a second of weapon window, and are released with the table by its owner.
   */
  export function of(
    read: IRead,
    from: number,
  ): (seconds: number) => readonly IAutoMovieVector3[] {
    const rows: {
      ends: readonly IAutoMovieVector3[];
      near: IAutoMovieMotionHumanResolveHumanPosture.INear;
    }[] = [];
    const row = (k: number): (typeof rows)[number] => {
      while (rows.length <= k) {
        const index: number = rows.length;
        const solved: ReturnType<IRead> = read(
          from + index * STEP,
          index === 0 ? undefined : rows[index - 1]!.near,
        );
        rows.push({ ends: solved.ends, near: continued(solved.seeds) });
      }
      return rows[k]!;
    };
    return (seconds: number): readonly IAutoMovieVector3[] => {
      if (!(seconds >= from)) return read(seconds).ends;
      const k: number = Math.round((seconds - from) / STEP);
      if (from + k * STEP === seconds) return row(k).ends;
      const before: number = Math.floor((seconds - from) / STEP);
      return read(seconds, row(before).near).ends;
    };
  }
}

/** The fits a knot's successor continues: each solved limb's seed at the swivel search's own resolution. */
function continued(
  seeds: IAutoMovieMotionHumanResolveHumanPosture.ISeeded["seeds"],
): IAutoMovieMotionHumanResolveHumanPosture.INear {
  const near: Partial<Record<AutoMovieHumanLimb, IAutoMovieSwivelNear>> = {};
  for (const [limb, seed] of Object.entries(seeds))
    if (seed !== null && seed !== undefined)
      near[limb as AutoMovieHumanLimb] = {
        ...seed,
        tolerance: hingedArmSwivel.RESOLUTION,
      };
  return near;
}
