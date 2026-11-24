import type {
  IAutoMovieMotionHumanResolveHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

/** The record of `IRead2`'s site. */
type IRead2 = {
  ends: readonly IAutoMovieVector3[];
  seeds: IAutoMovieMotionHumanResolveHumanPosture.ISeeded["seeds"];
};

/**
 * A striking limb's free course tabulated on the contact scan's own knots: the
 * capsule ends at `from + k * STEP`, each knot fitted as the figure is fitted
 * at that second, and kept for any later read of the same knot.
 *
 * The contact resolution must meet the limb the figure shows, so every knot is
 * the course's own fit, solved as the displayed posture solves it. Knots
 * continued from their predecessor's swivel (`IAutoMovieSwivelNear`, a
 * refinement in place of a search) were tried for speed and left the displayed
 * fit: on the large man's rear round kick at the average man's flank the
 * continued knee drifted 6 cm above the shown one, and the continued shin met
 * the partner's guard elbow 33 ms before contact where the shown shin passed it
 * 4 cm clear (`signature_kick_m_large`); solving each knot as the figure does
 * was no slower there (4.7 s against 5.4 s for the scene). The table therefore
 * holds no seed, so a knot's ends are a function of the course alone, whoever
 * reads them and in what order; a second off the knots or before the first is
 * fitted itself.
 */
export namespace StrikingWeaponTable {
  /**
   * The knots' spacing, seconds: the contact scan's own step
   * (`HumanPerformanceContacts.STEP`), so the scan's samples from the weapon's
   * first second are the knots themselves.
   */
  export const STEP: number = 1 / 120;

  /**
   * A course's capsule ends at a second, its limb fits continued where `near`
   * names them, with the seeds they were chosen at.
   */
  export type IRead = (
    seconds: number,
    near?: IAutoMovieMotionHumanResolveHumanPosture.INear,
  ) => IRead2;

  /**
   * A reader from a limb's own solve, which hands its seeds to a callback
   * (`StrikingWeapon.arm`, `StrikingWeapon.leg`).
   *
   * @param solve The limb's ends at a second, continued from `near` where
   *   given, reporting its fits' seeds through `kept`.
   * @returns The reader.
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
