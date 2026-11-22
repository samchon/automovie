import type {
  IAutoMovieMotionHumanResolveHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * A striking limb's free course tabulated on the contact scan's own knots:
 * the capsule ends at `from + k * STEP`, each knot fitted as the figure is
 * fitted at that second, and kept for any later read of the same knot.
 *
 * The contact resolution must meet the limb the figure shows, so every knot
 * is the course's own fit, solved as the displayed posture solves it. Knots
 * continued from their predecessor's swivel (`IAutoMovieSwivelNear`, a
 * refinement in place of a search) were tried for speed and left the
 * displayed fit: on the large man's rear round kick at the average man's
 * flank the continued knee drifted 6 cm above the shown one, and the
 * continued shin met the partner's guard elbow 33 ms before contact where
 * the shown shin passed it 4 cm clear (`signature_kick_m_large`); solving
 * each knot as the figure does was no slower there (4.7 s against 5.4 s for
 * the scene). The table therefore holds no seed, so a knot's ends are a
 * function of the course alone, whoever reads them and in what order; a
 * second off the knots or before the first is fitted itself.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the knots, why each is fitted as the figure is with the measured divergence of the continuation, why the result does not depend on read order and what a second off the knots or before them reads.
 * @evidence contracts/development/design.md#principled-representation One row a knot: the ends the scan reads.
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
      kept: (
        seeds: IAutoMovieMotionHumanResolveHumanPosture.ISeeded["seeds"],
      ) => void,
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
        (
          found: IAutoMovieMotionHumanResolveHumanPosture.ISeeded["seeds"],
        ): void => {
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
   * @evidence contracts/development/implementation.md#principled-implementation Each knot is the course's own fit at that second, solved as the displayed posture is, so the contact scan meets the limb the figure shows; no seed is carried between knots, because a continued swivel was measured to leave the shown fit.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A read is a knot's row, filled on its first read, or one fit of a second off the knots.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A knot is recognised only when the scan's own expression `from + k * STEP` gives the second bit for bit; any other second is fitted itself.
   * @evidence contracts/development/implementation.md#efficient-algorithms One fit a knot actually read, the fit the figure itself pays at that second, and a lookup for a knot read again; no cheaper exact method exists, since a fit continued from the previous knot is a different, inexact solution branch.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A knot's row is the course's value at that knot on one built geometry; the owner drops the table with the geometry (`StrikingWeapon.capsules`).
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The rows grow to the knots read, at most a hundred and twenty a second of weapon window, and are released with the table by its owner.
   */
  export function of(
    read: IRead,
    from: number,
  ): (seconds: number) => readonly IAutoMovieVector3[] {
    const rows: (readonly IAutoMovieVector3[])[] = [];
    return (seconds: number): readonly IAutoMovieVector3[] => {
      if (!(seconds >= from)) return read(seconds).ends;
      const k: number = Math.round((seconds - from) / STEP);
      if (from + k * STEP !== seconds) return read(seconds).ends;
      return (rows[k] ??= read(seconds).ends);
    };
  }
}
