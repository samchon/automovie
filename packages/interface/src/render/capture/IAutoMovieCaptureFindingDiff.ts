import type { IAutoMovieInspectionDiagnostics } from "../inspection/IAutoMovieInspectionDiagnostics.js";

/**
 * How one capture's inspection findings changed from an earlier round's, as
 * `diffAutoMovieCaptureFindings` writes it into the comparison.
 *
 * A finding is identified by its `scope`, `check`, `key`, `code` and ordered
 * `paths`. Within one round its severity is its worst observation across all
 * its episodes, by the reducer's order: confidence, then category, then rank,
 * with an absent rank below any present one. Its intervals run from each
 * episode's first observation time to its last sample time, in film seconds.
 *
 * The round outcome is decided by errors alone: `worse` when any error is new
 * or carried worse, `better` when no error is new, carried worse or unmatched
 * and at least one is fixed or carried better, and `same` otherwise. Warnings
 * are listed with their states and leave the outcome unchanged.
 *
 * When either record has no `diagnostics`, as a round written before
 * diagnostics were recorded or a capture of a video file, nothing is compared
 * and `lacking` names the records without them.
 */
export type IAutoMovieCaptureFindingDiff =
  | {
      /** Both rounds recorded diagnostics and their findings were compared. */
      state: "compared";

      /**
       * Whether this round's errors got worse, better or stayed the same
       * against the earlier round's.
       */
      outcome: "worse" | "better" | "same";

      /**
       * One entry per finding identity of either round: this round's in first
       * observation order, then those only the earlier round has.
       */
      entries: IAutoMovieCaptureFindingDiff.IEntry[];
    }
  | {
      /** At least one record has no diagnostics, so no finding was compared. */
      state: "omitted";

      /**
       * The records without diagnostics: the earlier round's, this round's, or
       * both.
       */
      lacking: ("earlier" | "current")[];
    };

/** Entries of a finding diff. */
export namespace IAutoMovieCaptureFindingDiff {
  /**
   * Why a finding is unmatched: one round's open coverage status over a needed
   * interval, or `not-sampled` when its coverage leaves a gap.
   */
  export type Cause = "deferred" | "unsupported" | "excluded" | "not-sampled";

  /**
   * One finding identity across both rounds.
   *
   * `fixed` and `new` require the other round to have checked the finding's
   * obligation, its `scope`, `check` and `key`, over every interval of the
   * round that has it; otherwise the finding is `unmatched` with the cause. A
   * finding both rounds have is `carried` only when both checked every interval
   * of both rounds. It then has a `worse`, `better` or `same` change by its
   * worst observations. Otherwise it is `unmatched` and keeps both
   * observations.
   */
  export type IEntry = IIdentity &
    (
      | {
          /**
           * Only the earlier round has it, and this round checked its
           * obligation over all its intervals.
           */
          state: "fixed";

          /** Its worst observation in the earlier round. */
          earlier: IAutoMovieInspectionDiagnostics.IObservation;

          /** This round has no observation. */
          current: null;
        }
      | {
          /**
           * Only this round has it, and the earlier round checked its
           * obligation over all its intervals.
           */
          state: "new";

          /** The earlier round has no observation. */
          earlier: null;

          /** Its worst observation in this round. */
          current: IAutoMovieInspectionDiagnostics.IObservation;
        }
      | {
          /** Both rounds have it and checked every interval of both rounds. */
          state: "carried";

          /**
           * This round's worst observation against the earlier round's, by the
           * reducer's order.
           */
          change: "worse" | "better" | "same";

          /** Its worst observation in the earlier round. */
          earlier: IAutoMovieInspectionDiagnostics.IObservation;

          /** Its worst observation in this round. */
          current: IAutoMovieInspectionDiagnostics.IObservation;
        }
      | {
          /**
           * A round lacks checked coverage of at least one interval needed to
           * decide the change.
           */
          state: "unmatched";

          /**
           * Open coverage over the first interval a round did not check, or a
           * gap in its observations. For a shared identity, the current round's
           * missing intervals take priority.
           */
          cause: Cause;

          uncovered?: readonly IAutoMovieInspectionDiagnostics.IInterval[];

          /**
           * Its worst observation in the earlier round, or null when only this
           * round has it.
           */
          earlier: IAutoMovieInspectionDiagnostics.IObservation | null;

          /**
           * Its worst observation in this round, or null when only the earlier
           * round has it.
           */
          current: IAutoMovieInspectionDiagnostics.IObservation | null;
        }
    );

  /** The identity of a finding and its category in the round outcome. */
  export interface IIdentity {
    /** Continuity occurrence that owns the finding. */
    scope: string;

    /** Checker that produced it. */
    check: string;

    /**
     * Checker-owned evidence identity, shared with the obligation's coverage
     * row.
     */
    key: string;

    /** Checker-owned diagnostic code. */
    code: string;

    /** Canonically ordered entity or part paths. */
    paths: string[];

    /**
     * `error` when either round's worst observation is an error, which makes
     * the entry count toward the outcome; `warning` otherwise.
     */
    category: "error" | "warning";
  }
}
